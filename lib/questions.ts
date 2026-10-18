export type PublicQuestion = {
  question: string;
  options: string[];
};

export type StoredQuestion = PublicQuestion & {
  answer: number;
  explanation?: string;
};

export function readStoredQuestions(value: unknown): StoredQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is StoredQuestion => {
    if (!entry || typeof entry !== "object") return false;
    const item = entry as Record<string, unknown>;
    return typeof item.question === "string" && Array.isArray(item.options) &&
      item.options.length >= 2 && item.options.every((option) => typeof option === "string") &&
      Number.isInteger(item.answer) && Number(item.answer) >= 0 && Number(item.answer) < item.options.length;
  }).map((item) => ({
    question: item.question,
    options: item.options,
    answer: item.answer,
    ...(typeof item.explanation === "string" ? { explanation: item.explanation } : {}),
  }));
}

export function toPublicQuestions(value: unknown): PublicQuestion[] {
  return readStoredQuestions(value).map(({ question, options }) => ({ question, options }));
}
