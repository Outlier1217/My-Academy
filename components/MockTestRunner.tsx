"use client";

import { useState } from "react";
import type { PublicQuestion } from "@/lib/questions";

type Result = {
  score: number; total: number; percentage: number;
  details: { index: number; correct: boolean; selected: number | null; correctAnswer: number; explanation: string }[];
};

export default function MockTestRunner({ slug, questions, durationMinutes }: { slug: string; questions: PublicQuestion[]; durationMinutes: number | null }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!questions.length) return <p className="notice">Questions for this test are being prepared.</p>;

  async function submit() {
    setSubmitting(true); setError("");
    try {
      const response = await fetch(`/api/mock-tests/${encodeURIComponent(slug)}/submit`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: Object.fromEntries(Object.entries(answers).map(([key, value]) => [key, value])) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not submit test.");
      setResult(data as Result);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not submit test."); }
    finally { setSubmitting(false); }
  }

  return (
    <section className="mock-runner">
      <div className="runner-topline"><span>{questions.length} questions</span><span>{durationMinutes ? `${durationMinutes} minute(s)` : "Practice mode"}</span><span>{Object.keys(answers).length} answered</span></div>
      {questions.map((question, index) => (
        <fieldset key={`${index}-${question.question}`} className="question-block" disabled={!!result}>
          <legend><span className="question-number">{String(index + 1).padStart(2, "0")}</span>{question.question}</legend>
          <div className="options-list">
            {question.options.map((option, optionIndex) => {
              const detail = result?.details[index];
              const correctAnswer = detail?.correctAnswer === optionIndex;
              const selectedWrong = detail?.selected === optionIndex && !detail.correct;
              return <label key={optionIndex} className={`answer-option ${answers[index] === optionIndex ? "selected" : ""} ${result && correctAnswer ? "answer-correct" : ""} ${result && selectedWrong ? "answer-wrong" : ""}`}>
                <input type="radio" name={`question-${index}`} checked={answers[index] === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [index]: optionIndex }))} />
                <span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span>
              </label>;
            })}
          </div>
          {result?.details[index]?.explanation && <p className="answer-explanation">{result.details[index].explanation}</p>}
        </fieldset>
      ))}
      {error && <p className="form-error" role="alert">{error}</p>}
      {result ? <div className="score-panel"><p className="eyebrow">Your result</p><strong>{result.score} / {result.total}</strong><p>{result.percentage}% correct. Review the answers and explanations above.</p><button className="button button-secondary" onClick={() => { setAnswers({}); setResult(null); setError(""); }}>Try again</button></div> : <button className="button button-primary" onClick={submit} disabled={submitting}>{submitting ? "Checking answers…" : "Submit answers →"}</button>}
    </section>
  );
}
