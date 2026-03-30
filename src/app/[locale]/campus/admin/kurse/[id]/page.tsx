import { AdminKursDetail } from "@/components/campus/admin/kurs-detail";
interface Props { params: Promise<{ id: string }> }
export default async function Page({ params }: Props) {
  const { id } = await params;
  return <AdminKursDetail kursId={id} />;
}
