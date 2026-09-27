import type { AuthButtonProps } from "@/components/contracts";

export default function AuthButton({ className }: AuthButtonProps) {
  return (
    <span data-testid="auth-button" className={className}>
      Sign in
    </span>
  );
}
