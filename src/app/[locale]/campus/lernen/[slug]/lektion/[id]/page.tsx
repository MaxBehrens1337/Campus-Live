import { LektionView } from "@/components/campus/lernen/lektion-view";
interface Props { params: Promise<{ slug: string; id: string }> }
export default async function Page({ params }: Props) {
  const { slug, id } = await params;
  return <LektionView slug={slug} lektionId={id} />;
}
