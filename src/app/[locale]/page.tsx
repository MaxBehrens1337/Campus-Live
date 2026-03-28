import { redirect } from "next/navigation";

export default function LocaleRoot({ params }: { params: Promise<{ locale: string }> }) {
  void params;
  redirect("campus/login");
}
