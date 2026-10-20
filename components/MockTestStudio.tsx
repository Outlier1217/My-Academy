
"use client";

import { useCallback, useEffect, useState } from "react";

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type Question = {
  id: string;
  question: string;
  options: string[];
  answers: number[];
  multipleAnswers: boolean;
  explanation: string;
  marks: number;
  negativeMarks: number;
};

type Settings = {
  durationMinutes: number;
  marksPerQuestion: number;
  negativeMarks: number;
  passingPercentage: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
};

type TestItem = {
  id: string;
  title: string;
  slug: string;
  type: "ARTICLE" | "BLOG" | "STORY" | "MOCK_TEST";
  coverImageUrl: string | null;
  subject: string;
  excerpt: string;
  body: string;
  status: Status;
  featured: boolean;
  tags: string[];
  questions: unknown;
  durationMinutes: number | null;
  readingMinutes: number | null;
};

const DEFAULT_SETTINGS: Settings = {
  durationMinutes: 20,
  marksPerQuestion: 1,
  negativeMarks: 0,
  passingPercentage: 40,
  shuffleQuestions: false,
  shuffleOptions: false,
};

function createQuestion(): Question {
  return {
    id: crypto.randomUUID(),
    question: "",
    options: ["", "", "", ""],
    answers: [],
    multipleAnswers: false,
    explanation: "",
    marks: 1,
    negativeMarks: 0,
  };
}

// CSV parser supports quoted cells, commas, escaped quotes and line breaks inside quoted cells.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

function decodeTest(value: unknown) {
  const data =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  const rawSettings =
    data.settings && typeof data.settings === "object"
      ? (data.settings as Record<string, unknown>)
      : {};

  const rawItems = Array.isArray(data.items)
    ? data.items
    : Array.isArray(value)
      ? value
      : [];

  const questions: Question[] = rawItems
    .filter(
      (item): item is Record<string, unknown> =>
        !!item && typeof item === "object"
    )
    .map((item) => {
      const options = Array.isArray(item.options)
        ? item.options.filter(
            (option): option is string => typeof option === "string"
          )
        : [];

      const rawAnswers = Array.isArray(item.answer)
        ? item.answer
        : typeof item.answer === "number"
          ? [item.answer]
          : [];

      return {
        id: crypto.randomUUID(),
        question: typeof item.question === "string" ? item.question : "",
        options,
        answers: rawAnswers.filter(
          (answer): answer is number =>
            typeof answer === "number" &&
            Number.isInteger(answer) &&
            answer >= 0 &&
            answer < options.length
        ),
        multipleAnswers: item.multipleAnswers === true,
        explanation:
          typeof item.explanation === "string" ? item.explanation : "",
        marks:
          typeof item.marks === "number" ? item.marks : 1,
        negativeMarks:
          typeof item.negativeMarks === "number"
            ? item.negativeMarks
            : 0,
      };
    });

  const settings: Settings = {
    durationMinutes:
      typeof rawSettings.durationMinutes === "number"
        ? rawSettings.durationMinutes
        : DEFAULT_SETTINGS.durationMinutes,
    marksPerQuestion:
      typeof rawSettings.marksPerQuestion === "number"
        ? rawSettings.marksPerQuestion
        : DEFAULT_SETTINGS.marksPerQuestion,
    negativeMarks:
      typeof rawSettings.negativeMarks === "number"
        ? rawSettings.negativeMarks
        : DEFAULT_SETTINGS.negativeMarks,
    passingPercentage:
      typeof rawSettings.passingPercentage === "number"
        ? rawSettings.passingPercentage
        : DEFAULT_SETTINGS.passingPercentage,
    shuffleQuestions: rawSettings.shuffleQuestions === true,
    shuffleOptions: rawSettings.shuffleOptions === true,
  };

  return { settings, questions };
}

export default function MockTestStudio() {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [subject, setSubject] = useState("NISM");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("Complete the mock test and review your results.");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [status, setStatus] = useState<Status>("DRAFT");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadTests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/content", {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load tests.");
      setTests(
        (data.items as TestItem[]).filter(
          (item) => item.type === "MOCK_TEST"
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load tests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTests();
  }, [loadTests]);

  function reset() {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setSubject("NISM");
    setExcerpt("");
    setBody("Complete the mock test and review your results.");
    setCoverImageUrl("");
    setUploadingImage(false);
    setStatus("DRAFT");
    setSettings(DEFAULT_SETTINGS);
    setQuestions([]);
    setActive(0);
    setError("");
    setMessage("");
  }

  function editTest(test: TestItem) {
    const decoded = decodeTest(test.questions);
    setEditingId(test.id);
    setTitle(test.title);
    setSlug(test.slug);
    setSubject(test.subject);
    setExcerpt(test.excerpt);
    setBody(test.body);
    setCoverImageUrl(test.coverImageUrl ?? "");
    setStatus(test.status);
    setSettings({
      ...decoded.settings,
      durationMinutes:
        test.durationMinutes ?? decoded.settings.durationMinutes,
    });
    setQuestions(decoded.questions);
    setActive(0);
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadCoverImage(file: File) {
    setError("");
    setMessage("");
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not upload cover image.");
      if (typeof data.url !== "string") throw new Error("Upload response did not include an image URL.");
      setCoverImageUrl(data.url);
      setMessage("Cover image uploaded. Save the mock test to keep this image.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload cover image.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function importCsv(file: File) {
    setError("");
    setMessage("");
    try {
      const rows = parseCsv(await file.text());
      if (rows.length < 2) throw new Error("CSV must contain a header and at least one question.");
      const headers = rows[0].map((value) => value.trim().toLowerCase().replace(/\s+/g, ""));
      const column = (...names: string[]) => headers.findIndex((value) => names.includes(value));
      const qCol = column("question", "questiontext", "q");
      const answerCol = column("answer", "answers", "correctanswer", "correctanswers");
      if (qCol < 0) throw new Error('CSV needs a "question" column.');
      if (answerCol < 0) throw new Error('CSV needs an "answer" column (for example A or A|C).');
      const optionCols = [
        column("optiona", "option1", "a"),
        column("optionb", "option2", "b"),
        column("optionc", "option3", "c"),
        column("optiond", "option4", "d"),
        column("optione", "option5", "e"),
        column("optionf", "option6", "f"),
        column("optiong", "option7", "g"),
        column("optionh", "option8", "h"),
      ];
      const multipleCol = column("multipleanswers", "multiple", "ismultiple");
      const explanationCol = column("explanation");
      const marksCol = column("marks");
      const negativeCol = column("negativemarks", "negativemark");
      const optionsCol = column("options");
      const imported: Question[] = [];

      rows.slice(1).forEach((values, rowOffset) => {
        const questionText = (values[qCol] ?? "").trim();
        if (!questionText) return;
        let options = optionCols.map((idx) => idx >= 0 ? (values[idx] ?? "").trim() : "");
        if (options.every((value) => !value) && optionsCol >= 0) {
          options = (values[optionsCol] ?? "").split("|").map((value) => value.trim());
        }
        while (options.length && !options[options.length - 1]) options.pop();
        if (options.length < 2 || options.some((value) => !value)) {
          throw new Error(`CSV row ${rowOffset + 2}: provide at least two complete options.`);
        }
        const answerTokens = (values[answerCol] ?? "").trim().split(/[|;]/).map((v) => v.trim().toUpperCase()).filter(Boolean);
        const answers = answerTokens.map((token) => /^[A-H]$/.test(token) ? token.charCodeAt(0) - 65 : /^\d+$/.test(token) ? Number(token) - 1 : -1);
        if (!answers.length || answers.some((answer) => answer < 0 || answer >= options.length) || new Set(answers).size !== answers.length) {
          throw new Error(`CSV row ${rowOffset + 2}: answer must be option letters or 1-based numbers, e.g. A or A|C.`);
        }
        const multipleAnswers = multipleCol >= 0
          ? ["true", "yes", "1"].includes((values[multipleCol] ?? "").trim().toLowerCase())
          : answers.length > 1;
        if (!multipleAnswers && answers.length !== 1) {
          throw new Error(`CSV row ${rowOffset + 2}: set multipleAnswers=true for multiple correct answers.`);
        }
        const readNumber = (idx: number, fallback: number) => {
          if (idx < 0 || !(values[idx] ?? "").trim()) return fallback;
          const n = Number(values[idx]);
          return Number.isFinite(n) && n >= 0 ? n : fallback;
        };
        imported.push({
          id: crypto.randomUUID(), question: questionText, options, answers, multipleAnswers,
          explanation: explanationCol >= 0 ? values[explanationCol] ?? "" : "",
          marks: readNumber(marksCol, settings.marksPerQuestion),
          negativeMarks: readNumber(negativeCol, settings.negativeMarks),
        });
      });
      if (!imported.length) throw new Error("No valid questions found in the CSV.");
      setQuestions((current) => [...current, ...imported]);
      setActive(questions.length);
      setMessage(`Imported ${imported.length} question(s). Review them and save the test.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not import CSV.");
    }
  }

  function downloadCsvTemplate() {
    const csv = [
      "question,optionA,optionB,optionC,optionD,answer,multipleAnswers,explanation,marks,negativeMarks",
      '"Which one is a primary market?","IPO","Stock exchange","Mutual fund","Bank deposit","A",false,"An IPO is part of the primary market.",1,0.25',
      '"Select both examples of equity instruments","Equity shares","Preference shares","Fixed deposit","Treasury bill","A|B",true,"Both equity and preference shares are equity instruments.",2,0.5',
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mock-test-questions-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function updateQuestion(index: number, changes: Partial<Question>) {
    setQuestions((current) =>
      current.map((question, i) =>
        i === index ? { ...question, ...changes } : question
      )
    );
  }

  function toggleAnswer(index: number, optionIndex: number) {
    const question = questions[index];
    if (!question) return;

    const answers = question.multipleAnswers
      ? question.answers.includes(optionIndex)
        ? question.answers.filter((answer) => answer !== optionIndex)
        : [...question.answers, optionIndex]
      : [optionIndex];

    updateQuestion(index, { answers });
  }

  
async function deleteTest(test: TestItem) {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${test.title}"?\n\nThis action cannot be undone.`
  );

  if (!confirmed) return;

  setError("");
  setMessage("");
  setDeletingId(test.id);

  try {
    const response = await fetch(
      `/api/admin/content/${test.id}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error ?? "Could not delete mock test."
      );
    }

    if (editingId === test.id) {
      reset();
    }

    setTests((current) =>
      current.filter((item) => item.id !== test.id)
    );

    setMessage(`"${test.title}" deleted successfully.`);
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Could not delete mock test."
    );
  } finally {
    setDeletingId(null);
  }
}


  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (questions.length === 0) {
      setError("Add at least one question before saving.");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.question.trim()) {
        setError(`Enter the text for question ${i + 1}.`);
        setActive(i);
        return;
      }
      if (
        question.options.length < 2 ||
        question.options.some((option) => !option.trim())
      ) {
        setError(`Complete all options in question ${i + 1}.`);
        setActive(i);
        return;
      }
      if (
        question.answers.length === 0 ||
        question.answers.some(
          (answer) => answer < 0 || answer >= question.options.length
        )
      ) {
        setError(`Select the correct answer for question ${i + 1}.`);
        setActive(i);
        return;
      }
      if (!question.multipleAnswers && question.answers.length !== 1) {
        setError(`Select exactly one correct answer for question ${i + 1}.`);
        setActive(i);
        return;
      }
    }

    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        type: "MOCK_TEST",
        subject,
        excerpt: excerpt.trim(),
        body,
        coverImageUrl: coverImageUrl || "",
        tags: ["mock-test"],
        status,
        featured: false,
        readingMinutes: null,
        durationMinutes: settings.durationMinutes,
        questions: {
          version: 2,
          settings,
          items: questions.map(({ id, ...question }) => ({
            ...question,
            answer: question.answers,
          })),
        },
      };

      const response = await fetch(
        editingId
          ? `/api/admin/content/${editingId}`
          : "/api/admin/content",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Could not save mock test.");
      }

      setMessage(editingId ? "Mock test updated." : "Mock test created.");
      reset();
      await loadTests();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save mock test.");
    } finally {
      setBusy(false);
    }
  }

  const current = questions[active];

  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">OUTLIER ACADEMY / ASSESSMENTS</p>
          <h2>Mock Test Studio</h2>
          <p>Create, edit and publish tests independently from articles.</p>
        </div>
        <button type="button" className="button button-secondary" onClick={reset}>
          + New test
        </button>
      </div>

      {(error || message) && (
        <p className={error ? "form-error notice-line" : "form-success notice-line"}>
          {error || message}
        </p>
      )}

      <form className="content-editor" onSubmit={save}>
        <h3>{editingId ? "Edit mock test" : "Create a mock test"}</h3>

        <label>
          Test title
          <input required minLength={3} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. NISM Series VIII — Practice Test 1" />
        </label>

        <div className="form-row">
          <label>
            Subject
            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="NISM">NISM</option>
              <option value="NCFM">NCFM</option>
              <option value="FINANCE">Finance</option>
              <option value="MATHEMATICS">Mathematics</option>
              <option value="AI_ML">AI / ML</option>
              <option value="BLOCKCHAIN">Blockchain</option>
              <option value="DEFI">DeFi</option>
              <option value="GENERAL">General</option>
            </select>
          </label>
          <label>
            URL slug (optional)
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="nism-series-viii-test-1" />
          </label>
        </div>

        <label>
          Short description
          <textarea required minLength={5} maxLength={500} rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="What does this test cover?" />
        </label>

        <div className="content-editor">
          <h3>Cover image</h3>
          <p className="field-hint">Optional image for this mock test. JPG, PNG, WEBP or GIF, maximum 5 MB.</p>
          <label>
            Upload cover image
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploadingImage} onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadCoverImage(file);
              event.currentTarget.value = "";
            }} />
          </label>
          {uploadingImage && <p className="muted-copy">Uploading image...</p>}
          {coverImageUrl && <div className="form-row">
            <img src={coverImageUrl} alt="Mock test cover preview" style={{ display: "block", width: "min(100%, 320px)", maxHeight: 180, objectFit: "cover", borderRadius: 12 }} />
            <div>
              <p className="field-hint">Cover image selected</p>
              <button type="button" className="danger-link" onClick={() => setCoverImageUrl("")}>Remove cover image</button>
            </div>
          </div>}
        </div>

        <div className="form-row">
          <label>
            Duration (minutes)
            <input type="number" min={1} max={600} value={settings.durationMinutes} onChange={(e) => setSettings({ ...settings, durationMinutes: Number(e.target.value) })} />
          </label>
          <label>
            Default marks per question
            <input type="number" min={0.01} max={100} step="any" value={settings.marksPerQuestion} onChange={(e) => setSettings({ ...settings, marksPerQuestion: Number(e.target.value) })} />
          </label>
        </div>

        <div className="form-row">
          <label>
            Default negative marks
            <input type="number" min={0} max={100} step="any" value={settings.negativeMarks} onChange={(e) => setSettings({ ...settings, negativeMarks: Number(e.target.value) })} />
          </label>
          <label>
            Passing percentage
            <input type="number" min={0} max={100} value={settings.passingPercentage} onChange={(e) => setSettings({ ...settings, passingPercentage: Number(e.target.value) })} />
          </label>
        </div>

        <label className="checkbox-label">
          <input type="checkbox" checked={settings.shuffleQuestions} onChange={(e) => setSettings({ ...settings, shuffleQuestions: e.target.checked })} />
          Shuffle question order
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={settings.shuffleOptions} onChange={(e) => setSettings({ ...settings, shuffleOptions: e.target.checked })} />
          Shuffle answer options
        </label>

        <div className="panel-heading">
          <div>
            <p className="eyebrow">QUESTION BUILDER</p>
            <h3>Questions ({questions.length})</h3>
          </div>
          <div className="form-row">
            <button type="button" className="button button-secondary" onClick={downloadCsvTemplate}>Download CSV template</button>
            <label className="button button-secondary">
              Upload CSV
              <input type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importCsv(file);
                event.currentTarget.value = "";
              }} />
            </label>
            <button type="button" className="button button-secondary" onClick={() => {
              setQuestions((current) => [...current, createQuestion()]);
              setActive(questions.length);
            }}>+ Add question</button>
          </div>
        </div>
        <p className="field-hint">CSV columns: question, optionA, optionB, optionC, optionD, answer, multipleAnswers, explanation, marks, negativeMarks. Use A or B for one correct answer, or A|C for multiple correct answers. Import adds questions to the current list.</p>

        {questions.length > 0 && (
          <div className="form-row">
            <label>
              Choose question
              <select value={active} onChange={(e) => setActive(Number(e.target.value))}>
                {questions.map((question, index) => (
                  <option key={question.id} value={index}>
                    {index + 1}. {question.question.trim() || "Untitled question"}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <span className="field-hint">Question {active + 1} of {questions.length}</span>
              <button type="button" className="danger-link" onClick={() => {
                setQuestions((current) => current.filter((_, i) => i !== active));
                setActive(Math.max(0, Math.min(active, questions.length - 2)));
              }}>
                Remove question
              </button>
            </div>
          </div>
        )}

        {current && (
          <>
            <label>
              Question text
              <textarea required rows={3} value={current.question} onChange={(e) => updateQuestion(active, { question: e.target.value })} placeholder="Enter the question..." />
            </label>

            <label className="checkbox-label">
              <input type="checkbox" checked={current.multipleAnswers} onChange={(e) => updateQuestion(active, { multipleAnswers: e.target.checked, answers: e.target.checked ? current.answers : current.answers.slice(0, 1) })} />
              Allow multiple correct answers
            </label>

            <div className="eyebrow">ANSWER OPTIONS</div>
            {current.options.map((option, optionIndex) => (
              <div key={optionIndex} className="form-row">
                <label>
                  Option {String.fromCharCode(65 + optionIndex)}
                  <input required value={option} onChange={(e) => updateQuestion(active, { options: current.options.map((value, i) => i === optionIndex ? e.target.value : value) })} placeholder={`Enter option ${optionIndex + 1}`} />
                </label>
                <label className="checkbox-label">
                  <input type={current.multipleAnswers ? "checkbox" : "radio"} name={`correct-${current.id}`} checked={current.answers.includes(optionIndex)} onChange={() => toggleAnswer(active, optionIndex)} />
                  Correct answer
                </label>
                {current.options.length > 2 && (
                  <button type="button" className="danger-link" onClick={() => {
                    updateQuestion(active, {
                      options: current.options.filter((_, i) => i !== optionIndex),
                      answers: current.answers.filter((answer) => answer !== optionIndex).map((answer) => answer > optionIndex ? answer - 1 : answer),
                    });
                  }}>
                    Remove option
                  </button>
                )}
              </div>
            ))}

            {current.options.length < 8 && (
              <button type="button" className="button button-secondary" onClick={() => updateQuestion(active, { options: [...current.options, ""] })}>
                + Add option
              </button>
            )}

            <label>
              Explanation (shown after submission)
              <textarea rows={3} value={current.explanation} onChange={(e) => updateQuestion(active, { explanation: e.target.value })} placeholder="Explain why the answer is correct..." />
            </label>

            <div className="form-row">
              <label>
                Marks for this question
                <input type="number" min={0.01} max={100} step="any" value={current.marks} onChange={(e) => updateQuestion(active, { marks: Number(e.target.value) })} />
              </label>
              <label>
                Negative marks
                <input type="number" min={0} max={100} step="any" value={current.negativeMarks} onChange={(e) => updateQuestion(active, { negativeMarks: Number(e.target.value) })} />
              </label>
            </div>

            <div className="form-row">
              <button type="button" className="button button-secondary" disabled={active === 0} onClick={() => setActive((value) => value - 1)}>← Previous</button>
              <button type="button" className="button button-secondary" disabled={active === questions.length - 1} onClick={() => setActive((value) => value + 1)}>Next →</button>
            </div>
          </>
        )}

        {questions.length === 0 && (
          <p className="muted-copy">No questions yet. Select “Add question” to start building your test.</p>
        )}

        <label>
          Publication status
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>

        <button type="submit" disabled={busy} className="button button-primary">
          {busy ? "Saving..." : editingId ? "Save test changes →" : "Create mock test →"}
        </button>
      </form>

      <div className="panel-heading">
        <div>
          <p className="eyebrow">TEST LIBRARY</p>
          <h3>Existing mock tests</h3>
        </div>
        <span className="count-chip">{tests.length}</span>
      </div>

      {loading ? (
        <p className="muted-copy">Loading mock tests...</p>
      ) : tests.length === 0 ? (
        <p className="muted-copy">No mock tests created yet.</p>
      ) : (
        <div className="admin-library-list">
          {tests.map((test) => (
            <article className="admin-library-item" key={test.id}>
              <div className="library-item-main">
                <span className={`status-label status-${test.status.toLowerCase()}`}>{test.status}</span>
                <h3>{test.title}</h3>
                <p>{test.subject.replace("_", " ")} · /{test.slug}</p>
              </div>

              <div className="library-item-actions">
                <button
                  type="button"
                  className="text-link"
                  onClick={() => editTest(test)}
                  disabled={deletingId !== null}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="danger-link"
                  onClick={() => void deleteTest(test)}
                  disabled={deletingId !== null}
                >
                  {deletingId === test.id ? "Deleting..." : "Delete"}
                </button>
              </div>

            </article>
          ))}
        </div>
      )}
    </section>
  );
}
