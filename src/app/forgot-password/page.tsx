import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordForm } from "@/components/auth/PasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" description="We will send password reset instructions to your account email.">
      <PasswordForm mode="request" />
    </AuthShell>
  );
}
