"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PublicQuestion, TestSettings } from "@/lib/questions";

type Result = {
  score: number;
  maximumScore: number;
  total: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  passed: boolean;
  passingPercentage: number;
  details: {
    index: number;
    correct: boolean;
    selected: number[];
    correctAnswer: number[];
    explanation: string;
    awarded: number;
  }[];
};

type QuestionView = PublicQuestion & { originalIndex: number };

export default function MockTestRunner({
  slug,
  questions,
  durationMinutes,
  settings,
}: {
  slug: string;
  questions: PublicQuestion[];
  durationMinutes: number | null;
  settings?: TestSettings;
}) {
  const duration = settings?.durationMinutes ?? durationMinutes ?? 20;
  const marksPerQuestion = settings?.marksPerQuestion ?? 1;
  const negativeMarks = settings?.negativeMarks ?? 0;
  const passingPercentage = settings?.passingPercentage ?? 40;

  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [review, setReview] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(duration * 60);
  const [reviewScreen, setReviewScreen] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const orderedQuestions = useMemo<QuestionView[]>(() => {
    const indexed = questions.map((question, originalIndex) => ({
      ...question,
      originalIndex,
    }));

    if (settings?.shuffleQuestions) {
      for (let i = indexed.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
      }
    }

    return indexed.map((question) => {
      if (!settings?.shuffleOptions) return question;

      const order = question.options.map((_, index) => index);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }

      return {
        ...question,
        options: order.map((index) => question.options[index]),
        // Answers are submitted using original option indexes.
        originalOptionIndexes: order,
      } as QuestionView & { originalOptionIndexes: number[] };
    });
  // Random order is generated once when the component mounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, settings?.shuffleQuestions, settings?.shuffleOptions]);

  const activeQuestion = orderedQuestions[current];
  const answeredCount = Object.values(answers).filter(
    (answer) => answer.length > 0
  ).length;

  const submit = useCallback(async () => {
    if (submitting || result) return;

    setSubmitting(true);
    setError("");

    try {
      const mappedAnswers: Record<string, number[]> = {};

      orderedQuestions.forEach((question) => {
        const selected = answers[question.originalIndex] ?? [];
        const optionOrder = (
          question as QuestionView & { originalOptionIndexes?: number[] }
        ).originalOptionIndexes;

        mappedAnswers[String(question.originalIndex)] = optionOrder
          ? selected.map((displayIndex) => optionOrder[displayIndex])
          : selected;
      });

      const response = await fetch(
        `/api/mock-tests/${encodeURIComponent(slug)}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: mappedAnswers }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Could not submit the test.");
      }

      setResult(data as Result);
      setReviewScreen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit the test.");
    } finally {
      setSubmitting(false);
    }
  }, [answers, orderedQuestions, result, slug, submitting]);

  useEffect(() => {
    if (result || reviewScreen || submitting || !questions.length) return;

    if (secondsLeft <= 0) {
      void submit();
      return;
    }

    const timer = window.setTimeout(
      () => setSecondsLeft((value) => value - 1),
      1000
    );

    return () => window.clearTimeout(timer);
  }, [secondsLeft, result, reviewScreen, submitting, questions.length, submit]);

  if (!questions.length) {
    return <p className="notice">Questions for this test are being prepared.</p>;
  }

  const formatTime = (value: number) =>
    `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(
      value % 60
    ).padStart(2, "0")}`;

  function toggleOption(displayIndex: number) {
    if (!activeQuestion) return;

    const originalIndex = activeQuestion.originalIndex;
    const selected = answers[originalIndex] ?? [];
    const multiple = activeQuestion.options.length > 0 &&
      // Multi-answer questions can be selected via the "Select all that apply" setting.
      // The builder will store this flag on the question.
      Boolean((activeQuestion as PublicQuestion & { multipleAnswers?: boolean }).multipleAnswers);

    setAnswers((previous) => {
      const existing = previous[originalIndex] ?? [];
      let next: number[];

      if (multiple) {
        next = existing.includes(displayIndex)
          ? existing.filter((value) => value !== displayIndex)
          : [...existing, displayIndex];
      } else {
        next = existing.includes(displayIndex) ? [] : [displayIndex];
      }

      return { ...previous, [originalIndex]: next };
    });
  }

  function displayedSelected(question: QuestionView) {
    const original = answers[question.originalIndex] ?? [];
    const order = (
      question as QuestionView & { originalOptionIndexes?: number[] }
    ).originalOptionIndexes;

    return order
      ? original
          .map((value) => order.indexOf(value))
          .filter((value) => value >= 0)
      : original;
  }

  if (result) {
    return (
      <section className="mock-runner">
        <div className="score-panel">
          <p className="eyebrow">YOUR RESULT</p>
          <h2>{result.passed ? "Congratulations — passed!" : "Test completed"}</h2>
          <strong>
            {result.score} / {result.maximumScore}
          </strong>
          <p>{result.percentage}% · Passing score: {result.passingPercentage}%</p>
          <div className="runner-topline">
            <span>Correct: {result.correctCount}</span>
            <span>Wrong: {result.wrongCount}</span>
            <span>Unanswered: {result.unansweredCount}</span>
          </div>
        </div>

        <h2>Answer review</h2>
        {orderedQuestions.map((question, displayIndex) => {
          const detail = result.details[question.originalIndex];
          const optionOrder = (
            question as QuestionView & { originalOptionIndexes?: number[] }
          ).originalOptionIndexes;
          const correctDisplay = optionOrder
            ? detail.correctAnswer.map((answer) => optionOrder.indexOf(answer))
            : detail.correctAnswer;
          const selectedDisplay = displayedSelected(question);

          return (
            <article className="question-block" key={question.originalIndex}>
              <h3>
                {displayIndex + 1}. {question.question}
              </h3>
              <div className="options-list">
                {question.options.map((option, optionIndex) => {
                  const isCorrect = correctDisplay.includes(optionIndex);
                  const wasSelected = selectedDisplay.includes(optionIndex);

                  return (
                    <div
                      key={optionIndex}
                      className={`answer-option ${
                        isCorrect ? "answer-correct" : ""
                      } ${
                        wasSelected && !isCorrect ? "answer-wrong" : ""
                      }`}
                    >
                      <span className="option-letter">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span>{option}</span>
                      {isCorrect && <span>Correct answer</span>}
                      {wasSelected && !isCorrect && <span>Your answer</span>}
                    </div>
                  );
                })}
              </div>
              <p>
                Marks awarded: {detail.awarded}
                {detail.explanation ? ` · ${detail.explanation}` : ""}
              </p>
            </article>
          );
        })}
      </section>
    );
  }

  if (reviewScreen) {
    return (
      <section className="mock-runner">
        <h2>Review before submitting</h2>
        <div className="runner-topline">
          <span>{questions.length} questions</span>
          <span>{answeredCount} answered</span>
          <span>{questions.length - answeredCount} unanswered</span>
          <span>{formatTime(secondsLeft)} left</span>
        </div>

        <div className="question-nav">
          {orderedQuestions.map((question, index) => {
            const hasAnswer = (answers[question.originalIndex] ?? []).length > 0;
            const marked = review.includes(question.originalIndex);

            return (
              <button
                type="button"
                key={question.originalIndex}
                className={`question-nav-button ${
                  hasAnswer ? "is-answered" : "is-unanswered"
                } ${marked ? "is-review" : ""}`}
                onClick={() => {
                  setCurrent(index);
                  setReviewScreen(false);
                }}
              >
                {index + 1}
                {marked ? " ★" : ""}
              </button>
            );
          })}
        </div>

        <p>Green = answered · Plain = unanswered · ★ = marked for review</p>
        {error && <p className="form-error">{error}</p>}

        <div className="runner-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setReviewScreen(false)}
          >
            Back to test
          </button>
          <button
            type="button"
            className="button button-primary"
            disabled={submitting}
            onClick={() => void submit()}
          >
            {submitting ? "Submitting…" : "Confirm and submit"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mock-runner">
      <div className="runner-topline">
        <span>{questions.length} questions</span>
        <span>{answeredCount} answered</span>
        <span className={secondsLeft < 60 ? "form-error" : ""}>
          Time left: {formatTime(secondsLeft)}
        </span>
      </div>

      <div className="question-nav">
        {orderedQuestions.map((question, index) => {
          const hasAnswer = (answers[question.originalIndex] ?? []).length > 0;
          const marked = review.includes(question.originalIndex);

          return (
            <button
              type="button"
              key={question.originalIndex}
              className={`question-nav-button ${
                hasAnswer ? "is-answered" : "is-unanswered"
              } ${marked ? "is-review" : ""} ${
                current === index ? "is-current" : ""
              }`}
              aria-label={`Question ${index + 1}${
                hasAnswer ? ", answered" : ", unanswered"
              }${marked ? ", marked for review" : ""}`}
              onClick={() => setCurrent(index)}
            >
              {index + 1}
              {marked ? " ★" : ""}
            </button>
          );
        })}
      </div>

      {activeQuestion && (
        <article className="question-block">
          <div className="runner-topline">
            <span>
              Question {current + 1} of {questions.length}
            </span>
            <span>{activeQuestion.marks ?? marksPerQuestion} marks</span>
          </div>

          <h2>{activeQuestion.question}</h2>

          <p className="muted-copy">
            {(activeQuestion as PublicQuestion & { multipleAnswers?: boolean })
              .multipleAnswers
              ? "Select all correct options."
              : "Select one answer."}
          </p>

          <div className="options-list">
            {activeQuestion.options.map((option, optionIndex) => {
              const selected = displayedSelected(activeQuestion).includes(
                optionIndex
              );

              return (
                <label
                  key={optionIndex}
                  className={`answer-option ${selected ? "selected" : ""}`}
                >
                  <input
                    type={
                      (activeQuestion as PublicQuestion & {
                        multipleAnswers?: boolean;
                      }).multipleAnswers
                        ? "checkbox"
                        : "radio"
                    }
                    name={`question-${current}`}
                    checked={selected}
                    onChange={() => toggleOption(optionIndex)}
                  />
                  <span className="option-letter">
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span>{option}</span>
                </label>
              );
            })}
          </div>

          <div className="runner-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() =>
                setReview((previous) =>
                  previous.includes(activeQuestion.originalIndex)
                    ? previous.filter(
                        (index) => index !== activeQuestion.originalIndex
                      )
                    : [...previous, activeQuestion.originalIndex]
                )
              }
            >
              {review.includes(activeQuestion.originalIndex)
                ? "Unmark review"
                : "Mark for review"}
            </button>
            <button
              type="button"
              className="button button-secondary"
              disabled={current === 0}
              onClick={() => setCurrent((value) => value - 1)}
            >
              ← Previous
            </button>
            {current < questions.length - 1 ? (
              <button
                type="button"
                className="button button-primary"
                onClick={() => setCurrent((value) => value + 1)}
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                className="button button-primary"
                onClick={() => setReviewScreen(true)}
              >
                Review and submit →
              </button>
            )}
          </div>
        </article>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
  );
}