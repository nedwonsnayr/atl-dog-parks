import Link from "next/link";

import type { AuthButtonProps } from "@/components/contracts";
import { getAuthenticatedUser } from "@/lib/supabase/auth";

export default async function AuthButton({ className }: AuthButtonProps) {
  const user = await getAuthenticatedUser();

  return (
    <Link href={user ? "/account" : "/auth"} data-testid="auth-button" className={className}>
      {user ? "Account" : "Sign in"}
    </Link>
  );
}
