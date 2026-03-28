import { StationList } from "@/components/campus/station/station-list";

interface Props {
  params: Promise<{ locale: string; version: string; islandId: string }>;
}

export default async function IslandPage({ params }: Props) {
  const { version, islandId } = await params;
  return <StationList version={version} islandId={islandId} />;
}
