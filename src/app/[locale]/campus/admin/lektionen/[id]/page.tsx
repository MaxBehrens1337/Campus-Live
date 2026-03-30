import { AdminLektionDetail } from "@/components/campus/admin/lektion-detail";
interface Props { params: Promise<{ id: string }> }
export default async function Page({ params }: Props) {
  const { id } = await params;
  return <AdminLektionDetail lektionId={id} />;
}
