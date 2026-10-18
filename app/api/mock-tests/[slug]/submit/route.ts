import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { readMockTest } from "@/lib/questions";

const submissionSchema = z.object({
  answers: z.record(
    z.string().regex(/^\d{1,3}$/),
    z.array(z.number().int().min(0).max(7)).max(8)
  ),
});

export async function POST(
  request: Request,
  context: { params: { slug: string } }
) {
  const body = await request.json().catch(() => null);
  const parsed = submissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid answer format." },
      { status: 400 }
    );
  }

  try {
    const test = await db.contentItem.findFirst({
      where: {
        slug: context.params.slug,
        type: "MOCK_TEST",
        status: "PUBLISHED",
      },
      select: { questions: true, durationMinutes: true },
    });

    if (!test) {
      return NextResponse.json(
        { error: "Mock test not found." },
        { status: 404 }
      );
    }

    const mockTest = readMockTest(test.questions);
    const questions = mockTest.items;

    if (!questions.length) {
      return NextResponse.json(
        { error: "This mock test does not have valid questions." },
        { status: 400 }
      );
    }

    // Reject answer indexes that do not exist in this test.
    for (const [key, selected] of Object.entries(parsed.data.answers)) {
      const index = Number(key);
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= questions.length ||
        selected.some((option) => option >= questions[index].options.length) ||
        new Set(selected).size !== selected.length
      ) {
        return NextResponse.json(
          { error: "An answer contains an invalid question or option index." },
          { status: 400 }
        );
      }
    }

    let score = 0;
    let maximumScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const details = questions.map((question, index) => {
      const selected = parsed.data.answers[String(index)] ?? [];
      const correctAnswers = question.answer;
      const isAnswered = selected.length > 0;

      const correct =
        isAnswered &&
        selected.length === correctAnswers.length &&
        selected.every((answer) => correctAnswers.includes(answer));

      maximumScore += question.marks;

      let awarded = 0;

      if (correct) {
        awarded = question.marks;
        correctCount += 1;
      } else if (!isAnswered) {
        unansweredCount += 1;
      } else {
        awarded = -question.negativeMarks;
        wrongCount += 1;
      }

      score += awarded;

      return {
        index,
        correct,
        selected,
        correctAnswer: correctAnswers,
        explanation: question.explanation,
        awarded,
      };
    });

    const percentage =
      maximumScore > 0
        ? Math.round((score / maximumScore) * 10000) / 100
        : 0;

    return NextResponse.json({
      score: Math.round(score * 100) / 100,
      maximumScore,
      total: questions.length,
      percentage,
      correctCount,
      wrongCount,
      unansweredCount,
      passed: percentage >= mockTest.settings.passingPercentage,
      passingPercentage: mockTest.settings.passingPercentage,
      details,
    });
  } catch (error) {
    console.error(
      "Mock test submission failed:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "Could not evaluate this test right now." },
      { status: 503 }
    );
  }
}