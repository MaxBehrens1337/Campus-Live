import { InhaltViewer } from "@/components/campus/inhalt-viewer";

interface Props {
  params: Promise<{ locale: string; bereich: string; id: string }>;
}

export default async function InhaltPage({ params }: Props) {
  const { bereich, id } = await params;
  return <InhaltViewer bereich={bereich} id={id} />;
}
