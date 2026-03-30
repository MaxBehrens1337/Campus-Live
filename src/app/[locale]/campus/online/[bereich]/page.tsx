import { BereichView } from "@/components/campus/bereich-view";

interface Props {
  params: Promise<{ locale: string; bereich: string }>;
}

export default async function BereichPage({ params }: Props) {
  const { bereich } = await params;
  return <BereichView bereich={bereich} />;
}
