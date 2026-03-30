import { QuizView } from "@/components/campus/lernen/quiz-view";
interface Props { params: Promise<{ slug: string; id: string }> }
export default async function Page({ params }: Props) {
  const { slug, id } = await params;
  return <QuizView slug={slug} quizId={id} />;
}
