import { signInWithGoogle } from "@/app/auth/actions";

export function GoogleAuthButton({ returnTo }: { returnTo: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="returnTo" value={returnTo} />
      <button className="stark-btn-secondary h-11 w-full" type="submit">
        Continue with Google
      </button>
    </form>
  );
}
