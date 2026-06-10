"use client";

export default function ConsoleError({ unstable_retry }: { unstable_retry: () => void }) {
  return (
    <div className="rounded-xl border border-error/30 bg-error/5 p-6">
      <h2 className="font-semibold">Workspace request failed</h2>
      <p className="mt-2 text-sm text-body">Check the Supabase connection and try again.</p>
      <button className="stark-btn-secondary mt-4 h-9 px-4" onClick={() => unstable_retry()}>Try again</button>
    </div>
  );
}
