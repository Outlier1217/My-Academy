export type TestSettings = {
  durationMinutes: number;
  marksPerQuestion: number;
  negativeMarks: number;
  passingPercentage: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
};

export type PublicQuestion = {
  question: string;
  options: string[];
  marks: number;
  negativeMarks: number;
};

export type StoredQuestion = PublicQuestion & {
  answer: number[];
  explanation: string;
};

export type MockTestData = {
  version: 2;
  settings: TestSettings;
  items: StoredQuestion[];
};

export const DEFAULT_TEST_SETTINGS: TestSettings = {
  durationMinutes: 20,
  marksPerQuestion: 1,
  negativeMarks: 0,
  passingPercentage: 40,
  shuffleQuestions: false,
  shuffleOptions: false,
};

function normaliseQuestion(value: unknown): StoredQuestion | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Record<string, unknown>;
  const options = item.options;

  if (
    typeof item.question !== "string" ||
    !item.question.trim() ||
    !Array.isArray(options) ||
    options.length < 2 ||
    options.length > 8 ||
    !options.every(
      (option: unknown) =>
        typeof option === "string" && option.trim().length > 0
    )
  ) {
    return null;
  }

  const rawAnswers: unknown[] = Array.isArray(item.answer)
    ? item.answer
    : typeof item.answer === "number"
      ? [item.answer]
      : [];

const answers = Array.from(
  new Set(
    rawAnswers.filter(
      (answer): answer is number =>
        typeof answer === "number" &&
        Number.isInteger(answer) &&
        answer >= 0 &&
        answer < options.length
    )
  )
);

  if (answers.length === 0) return null;

  const marks =
    typeof item.marks === "number" &&
    Number.isFinite(item.marks) &&
    item.marks > 0
      ? item.marks
      : 1;

  const negativeMarks =
    typeof item.negativeMarks === "number" &&
    Number.isFinite(item.negativeMarks) &&
    item.negativeMarks >= 0
      ? item.negativeMarks
      : 0;

  return {
    question: item.question,
    options,
    answer: answers,
    explanation:
      typeof item.explanation === "string" ? item.explanation : "",
    marks,
    negativeMarks,
  };
}

export function readStoredQuestions(value: unknown): StoredQuestion[] {
  // Old database format: a plain array of questions.
  const rawItems = Array.isArray(value)
    ? value
    : value &&
        typeof value === "object" &&
        Array.isArray((value as Record<string, unknown>).items)
      ? ((value as Record<string, unknown>).items as unknown[])
      : [];

  return rawItems
    .map(normaliseQuestion)
    .filter((question): question is StoredQuestion => question !== null);
}

export function readMockTest(value: unknown): MockTestData {
  const object =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  const rawSettings =
    object.settings && typeof object.settings === "object"
      ? (object.settings as Record<string, unknown>)
      : {};

  const settings: TestSettings = {
    durationMinutes:
      typeof rawSettings.durationMinutes === "number" &&
      rawSettings.durationMinutes >= 1 &&
      rawSettings.durationMinutes <= 600
        ? rawSettings.durationMinutes
        : DEFAULT_TEST_SETTINGS.durationMinutes,
    marksPerQuestion:
      typeof rawSettings.marksPerQuestion === "number" &&
      rawSettings.marksPerQuestion > 0 &&
      rawSettings.marksPerQuestion <= 100
        ? rawSettings.marksPerQuestion
        : DEFAULT_TEST_SETTINGS.marksPerQuestion,
    negativeMarks:
      typeof rawSettings.negativeMarks === "number" &&
      rawSettings.negativeMarks >= 0 &&
      rawSettings.negativeMarks <= 100
        ? rawSettings.negativeMarks
        : DEFAULT_TEST_SETTINGS.negativeMarks,
    passingPercentage:
      typeof rawSettings.passingPercentage === "number" &&
      rawSettings.passingPercentage >= 0 &&
      rawSettings.passingPercentage <= 100
        ? rawSettings.passingPercentage
        : DEFAULT_TEST_SETTINGS.passingPercentage,
    shuffleQuestions:
      typeof rawSettings.shuffleQuestions === "boolean"
        ? rawSettings.shuffleQuestions
        : DEFAULT_TEST_SETTINGS.shuffleQuestions,
    shuffleOptions:
      typeof rawSettings.shuffleOptions === "boolean"
        ? rawSettings.shuffleOptions
        : DEFAULT_TEST_SETTINGS.shuffleOptions,
  };

  const sourceItems = Array.isArray(value)
    ? value
    : Array.isArray(object.items)
      ? object.items
      : [];

  const items = sourceItems
    .map(normaliseQuestion)
    .filter((question): question is StoredQuestion => question !== null);

  return { version: 2, settings, items };
}

export function toPublicQuestions(value: unknown): PublicQuestion[] {
  const test = readMockTest(value);

  return test.items.map(({ question, options, marks, negativeMarks }) => ({
    question,
    options,
    marks,
    negativeMarks,
  }));
}