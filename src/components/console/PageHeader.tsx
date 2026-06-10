export function PageHeader({ eyebrow, title, description, action }: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-link">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-body">{description}</p>
      </div>
      {action}
    </div>
  );
}
