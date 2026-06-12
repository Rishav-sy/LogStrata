import DocsClientPage from "@/components/DocsClientPage";

export function generateStaticParams() {
  return [
    { slug: "getting-started" },
    { slug: "architecture" },
    { slug: "configuration" },
    { slug: "scaling-policies" },
    { slug: "security-analytics" },
    { slug: "api-reference" },
  ];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <DocsClientPage slug={slug} />;
}
