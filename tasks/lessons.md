# Lessons

Patterns learned from corrections. Review at the start of each session.

<!-- Format:
## <short title>
- Mistake:
- Rule:
-->

## Protect the default branch

- Mistake: Foundation work was committed before creating a feature branch.
- Rule: Before the first project commit, verify the current branch and create a feature branch unless the user explicitly authorizes commits to the default branch.

## Auth redirects stay on-site

- Mistake: Treating a leading slash as a safe `next` path still sends people off-site, because URL parsers accept `/\host` as a protocol-relative URL.
- Rule: Resolve auth `next` values against a fixed origin and keep them only when the parsed origin matches. Reject backslashes and control characters before parsing.

## Outbound fetches stay on public web URLs

- Mistake: The park refresh fetch followed redirects and accepted any scheme, so a park URL or redirect could reach loopback, link-local, or file URLs.
- Rule: Allow only credential-free http(s) URLs, reject non-public addresses at resolution and connect time, and re-check every redirect. Abuse controls that are missing must fail closed outside development and test.
