import { ConsoleNav } from "@/components/console/ConsoleNav";
import { requireUser } from "@/lib/auth/user";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/console");
  return (
    <div className="mx-auto grid max-w-[1400px] gap-6 px-6 py-8 lg:grid-cols-[220px_1fr]">
      <aside className="rounded-xl border border-hairline bg-canvas-soft p-3 lg:min-h-[calc(100vh-9rem)]">
        <div className="mb-4 border-b border-hairline px-3 pb-4">
          <p className="text-xs font-semibold">Workspace</p>
          <p className="mt-1 truncate text-xs text-mute">{user.email}</p>
        </div>
        <ConsoleNav />
      </aside>
      <section className="min-w-0">{children}</section>
    </div>
  );
}
