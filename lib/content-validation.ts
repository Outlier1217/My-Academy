import { z } from "zod";

const questionSchema = z.object({
  question: z.string().trim().min(1).max(3000),
  options: z.array(z.string().trim().min(1).max(1000)).min(2).max(8),
  answer: z.union([
    z.number().int().min(0).max(7),
    z.array(z.number().int().min(0).max(7)).min(1).max(8),
  ]),
  explanation: z.string().max(5000).optional().default(""),
  marks: z.number().positive().max(100).optional(),
  negativeMarks: z.number().min(0).max(100).optional(),
}).superRefine((question, ctx) => {
  const answers = Array.isArray(question.answer)
    ? question.answer
    : [question.answer];

  if (answers.some((answer) => answer >= question.options.length)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Correct answer must match an available option.",
      path: ["answer"],
    });
  }

  if (new Set(answers).size !== answers.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A correct option cannot be selected twice.",
      path: ["answer"],
    });
  }
});

const testSettingsSchema = z.object({
  durationMinutes: z.number().int().min(1).max(600),
  marksPerQuestion: z.number().positive().max(100),
  negativeMarks: z.number().min(0).max(100),
  passingPercentage: z.number().min(0).max(100),
  shuffleQuestions: z.boolean(),
  shuffleOptions: z.boolean(),
});

const questionsSchema = z.union([
  z.array(questionSchema).max(200),
  z.object({
    version: z.literal(2),
    settings: testSettingsSchema,
    items: z.array(questionSchema).max(200),
  }),
]);

export const contentSchema = z.object({
  title: z.string().trim().min(3).max(180),
  slug: z.string().trim().max(120).optional().default(""),
  type: z.enum(["ARTICLE", "BLOG", "STORY", "MOCK_TEST"]),
  subject: z.enum([
    "NISM",
    "NCFM",
    "FINANCE",
    "AI_ML",
    "BLOCKCHAIN",
    "DEFI",
    "MATHEMATICS",
    "GENERAL",
  ]),
  excerpt: z.string().trim().min(5).max(500),
  body: z.string().min(1).max(1_500_000),
  coverImageUrl: z.union([
    z.string().url(),
    z.string().regex(
      /^\/uploads\/[0-9a-f-]{36}\.(jpg|png|webp|gif)$/i,
      "Invalid uploaded image path."
    ),
    z.literal(""),
  ]).optional().default(""),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  featured: z.boolean().default(false),
  readingMinutes: z.number().int().min(1).max(600).nullable().optional(),
  durationMinutes: z.number().int().min(1).max(600).nullable().optional(),
  questions: questionsSchema.optional().default([]),
});

export type ContentInput = z.infer<typeof contentSchema>;