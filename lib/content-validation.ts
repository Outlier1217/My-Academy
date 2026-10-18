import { z } from "zod";

export const questionSchema = z.object({
  question: z.string().trim().min(1).max(3000),
  options: z.array(z.string().trim().min(1).max(1000)).min(2).max(8),
  answer: z.number().int().min(0).max(7),
  explanation: z.string().max(5000).optional().default(""),
}).refine((question) => question.answer < question.options.length, {
  message: "Answer index must match one of the available options.",
  path: ["answer"],
});

export const contentSchema = z.object({
  title: z.string().trim().min(3).max(180),
  slug: z.string().trim().max(120).optional().default(""),
  type: z.enum(["ARTICLE", "BLOG", "STORY", "MOCK_TEST"]),
  subject: z.enum(["NISM", "NCFM", "FINANCE", "AI_ML", "BLOCKCHAIN", "DEFI", "MATHEMATICS", "GENERAL"]),
  excerpt: z.string().trim().min(5).max(500),
  body: z.string().min(1).max(1_500_000),
  coverImageUrl: z.union([z.string().url(), z.literal("")]).optional().default(""),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  featured: z.boolean().default(false),
  readingMinutes: z.number().int().min(1).max(600).nullable().optional(),
  durationMinutes: z.number().int().min(1).max(600).nullable().optional(),
  questions: z.array(questionSchema).max(200).optional().default([]),
});

export type ContentInput = z.infer<typeof contentSchema>;
