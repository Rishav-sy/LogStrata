import Link from "next/link";
import { Activity, CircleUserRound, Layers3, LayoutDashboard } from "lucide-react";

const links = [
  { href: "/console", label: "Overview", icon: LayoutDashboard },
  { href: "/console/scenarios", label: "Scenarios", icon: Activity },
  { href: "/console/clusters", label: "Clusters", icon: Layers3 },
  { href: "/console/account", label: "Account", icon: CircleUserRound },
];

export function ConsoleNav() {
  return (
    <nav className="flex gap-2 overflow-x-auto lg:flex-col">
      {links.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className="flex min-w-fit items-center gap-3 rounded-lg px-3 py-2 text-sm text-body hover:bg-canvas-soft-hover hover:text-ink">
          <Icon className="h-4 w-4" />{label}
        </Link>
      ))}
    </nav>
  );
}
