import { KursDetailView } from "@/components/campus/lernen/kurs-detail";
interface Props { params: Promise<{ slug: string }> }
export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <KursDetailView slug={slug} />;
}
