import Link from "next/link";

export default function NotFound() {
  return <div className="stark-card"><h1 className="font-semibold">Record not found</h1><p className="my-3 text-sm text-body">The record does not exist or is not owned by this workspace.</p><Link href="/console" className="text-link">Return to console</Link></div>;
}
