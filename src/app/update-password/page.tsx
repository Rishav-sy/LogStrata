import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordForm } from "@/components/auth/PasswordForm";
import { requireUser } from "@/lib/auth/user";

export default async function UpdatePasswordPage() {
  await requireUser("/update-password");
  return (
    <AuthShell title="Choose a new password" description="Use at least eight characters with a letter and number.">
      <PasswordForm mode="update" />
    </AuthShell>
  );
}
