import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { readStoredQuestions } from "@/lib/questions";

const submissionSchema = z.object({
  answers: z.record(z.string().regex(/^\d{1,3}$/), z.number().int().min(0).max(7)),
});

export async function POST(request: Request, context: { params: { slug: string } }) {
  const parsed = submissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid answer format." }, { status: 400 });
  try {
    const test = await db.contentItem.findFirst({ where: { slug: context.params.slug, type: "MOCK_TEST", status: "PUBLISHED" }, select: { questions: true } });
    if (!test) return NextResponse.json({ error: "Mock test not found." }, { status: 404 });
    const questions = readStoredQuestions(test.questions);
    if (!questions.length) return NextResponse.json({ error: "This mock test does not have questions yet." }, { status: 400 });

    const details = questions.map((question, index) => {
      const selected = parsed.data.answers[String(index)];
      const correct = selected === question.answer;
      return {
        index,
        correct,
        selected: typeof selected === "number" ? selected : null,
        correctAnswer: question.answer,
        explanation: question.explanation ?? "",
      };
    });
    const score = details.filter((item) => item.correct).length;
    return NextResponse.json({ score, total: questions.length, percentage: Math.round((score / questions.length) * 100), details });
  } catch (error) {
    console.error("Mock test submission failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not evaluate this test right now." }, { status: 503 });
  }
}
