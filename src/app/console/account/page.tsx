import { signOut } from "@/app/auth/actions";
import { updateProfile } from "@/app/console/actions";
import { PageHeader } from "@/components/console/PageHeader";
import { PasswordForm } from "@/components/auth/PasswordForm";
import { requireUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const user = await requireUser("/console/account");
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (
    <>
      <PageHeader eyebrow="Workspace" title="Account" description="Manage your profile, password, and current session." />
      <div className="grid gap-6 xl:grid-cols-2">
        <form action={updateProfile} className="stark-card space-y-4">
          <h2 className="font-semibold">Profile</h2>
          <Field label="Email" name="email" value={user.email ?? ""} disabled />
          <Field label="Display name" name="displayName" value={profile?.display_name ?? ""} />
          <Field label="Avatar URL" name="avatarUrl" value={profile?.avatar_url ?? ""} />
          <button className="stark-btn-primary h-10 px-4">Save profile</button>
        </form>
        <div className="stark-card space-y-5">
          <h2 className="font-semibold">Password</h2><PasswordForm mode="update" />
          <div className="border-t border-hairline pt-5">
            <p className="mb-3 text-xs text-mute">Session user ID: {user.id}</p>
            <form action={signOut}><button className="stark-btn-secondary h-10 px-4">Sign out</button></form>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, name, value, disabled = false }: { label: string; name: string; value: string; disabled?: boolean }) {
  return <label className="block space-y-2"><span className="text-sm">{label}</span><input className="stark-input w-full" name={name} defaultValue={value} disabled={disabled} /></label>;
}
