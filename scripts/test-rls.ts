import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RLS_TEST_UNVERIFIED_ACCESS_TOKEN",
] as const;

type RequiredEnvName = (typeof REQUIRED_ENV)[number];
type RequiredEnv = Record<RequiredEnvName, string>;
type QueryError = { message: string } | null;

function readEnv(): RequiredEnv | null {
  const configured = REQUIRED_ENV.filter((name) => Boolean(process.env[name]?.trim()));

  if (configured.length === 0) {
    console.log(
      `SKIP RLS integration: none of ${REQUIRED_ENV.join(", ")} are set. ` +
        "A complete environment runs the suite; a partial environment is an error.",
    );
    return null;
  }

  const missing = REQUIRED_ENV.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Partial RLS test environment. Missing ${missing.join(", ")}. ` +
        "Unset all required variables to skip, or set every variable to run.",
    );
  }

  return Object.fromEntries(
    REQUIRED_ENV.map((name) => [name, process.env[name]!.trim()]),
  ) as RequiredEnv;
}

function assertNoError(error: QueryError, context: string): void {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

function assertDenied(error: QueryError, context: string): void {
  if (!error) {
    throw new Error(`${context}: write unexpectedly succeeded`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function run(): Promise<void> {
  const env = readEnv();
  if (!env) return;

  console.log(
    "RUN RLS integration: failures and incomplete configuration exit non-zero; " +
      "only an entirely unconfigured environment skips.",
  );

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const anonymous = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const unverified = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: { Authorization: `Bearer ${env.RLS_TEST_UNVERIFIED_ACCESS_TOKEN}` },
    },
  });

  const runId = randomUUID();
  const parkSlug = `rls-probe-${runId}`;
  const ownerEmail = `rls-owner-${runId}@example.com`;
  const reviewerEmail = `rls-reviewer-${runId}@example.com`;
  const ownerPassword = `${randomUUID()}Aa1!`;
  const reviewerPassword = `${randomUUID()}Aa1!`;
  const createdUserIds: string[] = [];

  try {
    const { data: unverifiedIdentity, error: unverifiedIdentityError } =
      await unverified.auth.getUser(env.RLS_TEST_UNVERIFIED_ACCESS_TOKEN);
    assertNoError(unverifiedIdentityError, "Validate unverified access token");
    assert(unverifiedIdentity.user, "Unverified access token did not identify a user");

    const { data: unverifiedAdminData, error: unverifiedAdminError } =
      await admin.auth.admin.getUserById(unverifiedIdentity.user.id);
    assertNoError(unverifiedAdminError, "Inspect unverified test user");
    assert(unverifiedAdminData.user, "Unverified test user does not exist in this project");
    assert(
      !unverifiedAdminData.user.email_confirmed_at,
      "RLS_TEST_UNVERIFIED_ACCESS_TOKEN belongs to a verified user",
    );

    const { data: ownerData, error: ownerError } = await admin.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true,
    });
    assertNoError(ownerError, "Create fixture owner");
    assert(ownerData.user, "Fixture owner was not created");
    createdUserIds.push(ownerData.user.id);

    const { data: reviewerData, error: reviewerError } = await admin.auth.admin.createUser({
      email: reviewerEmail,
      password: reviewerPassword,
      email_confirm: true,
    });
    assertNoError(reviewerError, "Create verified reviewer");
    assert(reviewerData.user, "Verified reviewer was not created");
    createdUserIds.push(reviewerData.user.id);

    const { data: approvedReview, error: approvedReviewError } = await admin
      .from("reviews")
      .insert({
        park_slug: parkSlug,
        user_id: ownerData.user.id,
        rating: 5,
        body: "Approved RLS visibility probe",
        status: "approved",
      })
      .select("id")
      .single();
    assertNoError(approvedReviewError, "Seed approved review");
    assert(approvedReview, "Approved review fixture was not returned");

    const { data: anonymousRead, error: anonymousReadError } = await anonymous
      .from("reviews")
      .select("id,status")
      .eq("id", approvedReview.id);
    assertNoError(anonymousReadError, "Anonymous approved-review read");
    assert(
      anonymousRead?.length === 1 && anonymousRead[0].status === "approved",
      "Anonymous users could not read the approved review",
    );
    console.log("PASS anonymous users can read approved reviews");

    const { error: anonymousReviewError } = await anonymous.from("reviews").insert({
      park_slug: `${parkSlug}-anonymous`,
      user_id: ownerData.user.id,
      rating: 4,
      body: "Anonymous write probe",
      status: "pending",
    });
    assertDenied(anonymousReviewError, "Anonymous review insert");

    const { error: anonymousSubmissionError } = await anonymous.from("submissions").insert({
      user_id: ownerData.user.id,
      payload: { kind: "new_park", name: "Anonymous RLS probe", rlsProbe: runId },
      status: "pending",
    });
    assertDenied(anonymousSubmissionError, "Anonymous submission insert");
    console.log("PASS anonymous review and submission writes are denied");

    const { error: unverifiedReviewError } = await unverified.from("reviews").insert({
      park_slug: `${parkSlug}-unverified`,
      user_id: unverifiedIdentity.user.id,
      rating: 4,
      body: "Unverified write probe",
      status: "pending",
    });
    assertDenied(unverifiedReviewError, "Unverified review insert");

    const { error: unverifiedSubmissionError } = await unverified.from("submissions").insert({
      user_id: unverifiedIdentity.user.id,
      payload: { kind: "new_park", name: "Unverified RLS probe", rlsProbe: runId },
      status: "pending",
    });
    assertDenied(unverifiedSubmissionError, "Unverified submission insert");
    console.log("PASS unverified review and submission writes are denied");

    const verified = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: signInError } = await verified.auth.signInWithPassword({
      email: reviewerEmail,
      password: reviewerPassword,
    });
    assertNoError(signInError, "Sign in verified reviewer");

    const { data: ownReview, error: ownReviewError } = await verified
      .from("reviews")
      .insert({
        park_slug: parkSlug,
        user_id: reviewerData.user.id,
        rating: 4,
        body: "Verified review probe",
        status: "pending",
      })
      .select("id")
      .single();
    assertNoError(ownReviewError, "Verified review insert");
    assert(ownReview, "Verified review was not returned");

    const { error: duplicateError } = await verified.from("reviews").insert({
      park_slug: parkSlug,
      user_id: reviewerData.user.id,
      rating: 3,
      body: "Duplicate review probe",
      status: "pending",
    });
    assertDenied(duplicateError, "Second review for the same user and park");
    console.log("PASS verified users are limited to one review per park");

    const { data: ownUpdate, error: ownUpdateError } = await verified
      .from("reviews")
      .update({ body: "Updated owned review" })
      .eq("id", ownReview.id)
      .select("id");
    assertNoError(ownUpdateError, "Update owned review");
    assert(ownUpdate?.length === 1, "Verified user could not update their own review");

    const { data: foreignUpdate, error: foreignUpdateError } = await verified
      .from("reviews")
      .update({ body: "Foreign update probe" })
      .eq("id", approvedReview.id)
      .select("id");
    assertNoError(foreignUpdateError, "Attempt foreign review update");
    assert(foreignUpdate?.length === 0, "Verified user updated another user's review");

    const { data: foreignDelete, error: foreignDeleteError } = await verified
      .from("reviews")
      .delete()
      .eq("id", approvedReview.id)
      .select("id");
    assertNoError(foreignDeleteError, "Attempt foreign review delete");
    assert(foreignDelete?.length === 0, "Verified user deleted another user's review");
    console.log("PASS verified users can edit owned reviews but not another user's review");
  } finally {
    await admin.from("reviews").delete().like("park_slug", `${parkSlug}%`);
    await admin.from("submissions").delete().contains("payload", { rlsProbe: runId });
    if (createdUserIds.length > 0) {
      await admin.from("reviews").delete().in("user_id", createdUserIds);
      await admin.from("submissions").delete().in("user_id", createdUserIds);
    }
    for (const userId of createdUserIds) {
      await admin.auth.admin.deleteUser(userId);
    }
  }
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`ERROR RLS integration: ${message}`);
  process.exitCode = 1;
});
