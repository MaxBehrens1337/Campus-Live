import { StationView } from "@/components/campus/station/station-view";

interface Props {
  params: Promise<{ locale: string; version: string; islandId: string; stationId: string }>;
}

export default async function StationPage({ params }: Props) {
  const { version, islandId, stationId } = await params;
  return <StationView version={version} islandId={islandId} stationId={stationId} />;
}
