
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SavedContent = {
  id: string;
  title: string;
  slug: string;
  type: string;
  subject: string;
  excerpt: string;
  coverImageUrl: string | null;
};

type SavedEntry = {
  id: string;
  createdAt: string;
  content: SavedContent;
};

type Attempt = {
  id: string;
  testTitle: string;
  testSlug: string;
  score: number;
  maximumScore: number;
  percentage: number;
  passed: boolean;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  shareToken: string | null;
  createdAt: string;
};

type AccountData = {
  bookmarks: SavedEntry[];
  favourites: SavedEntry[];
  attempts: Attempt[];
};

function contentHref(content: SavedContent) {
  return content.type === "COURSE"
    ? `/courses/${content.slug}`
    : `/content/${content.slug}`;
}

function SavedSection({
  title,
  items,
}: {
  title: string;
  items: SavedEntry[];
}) {
  return (
    <section className="account-content-section">
      <h2>{title} <span>({items.length})</span></h2>

      {items.length === 0 ? (
        <p className="muted-copy">
          Nothing saved here yet. Explore the Academy and save content you like.
        </p>
      ) : (
        <div className="account-saved-list">
          {items.map(({ id, content }) => (
            <article className="account-saved-item" key={id}>
              <div>
                <span className="eyebrow">
                  {content.type.replace("_", " ")} · {content.subject.replace("_", " ")}
                </span>
                <h3>
                  <Link href={contentHref(content)}>{content.title}</Link>
                </h3>
                <p>{content.excerpt}</p>
              </div>
              <Link className="text-link" href={contentHref(content)}>
                Open ↗
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function AccountDashboard() {
  const [data, setData] = useState<AccountData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      try {
        const response = await fetch("/api/account", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to load account data.");
        }

        if (active) setData(result);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load account data."
          );
        }
      }
    }

    void loadAccount();

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (!data) {
    return <p className="muted-copy">Loading your saved content…</p>;
  }

  return (
    <div className="account-dashboard-content">
      <SavedSection title="Bookmarks" items={data.bookmarks} />
      <SavedSection title="Favourites" items={data.favourites} />

      <section className="account-content-section">
        <h2>Mock Test History <span>({data.attempts.length})</span></h2>

        {data.attempts.length === 0 ? (
          <p className="muted-copy">
            Your completed mock tests will appear here when you take a test
            while signed in.
          </p>
        ) : (
          <div className="account-saved-list">
            {data.attempts.map((attempt) => (
              <article className="account-saved-item" key={attempt.id}>
                <div>
                  <span className="eyebrow">
                    {new Date(attempt.createdAt).toLocaleDateString("en-IN")}
                  </span>
                  <h3>{attempt.testTitle}</h3>
                  <p>
                    Score: {attempt.score}/{attempt.maximumScore} ·{" "}
                    {attempt.percentage.toFixed(1)}% ·{" "}
                    {attempt.passed ? "Passed" : "Not passed"}
                  </p>
                  <p className="muted-copy">
                    Correct: {attempt.correctCount} · Wrong: {attempt.wrongCount} ·
                    Unanswered: {attempt.unansweredCount}
                  </p>
                  <Link
                    className="text-link"
                    href={`/content/${attempt.testSlug}`}
                  >
                    Open test ↗
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
