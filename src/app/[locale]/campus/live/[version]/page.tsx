import { IslandOverview } from "@/components/campus/island-overview";

interface Props {
  params: Promise<{ locale: string; version: string }>;
}

export default async function CampusLivePage({ params }: Props) {
  const { version } = await params;
  return <IslandOverview version={version} />;
}
