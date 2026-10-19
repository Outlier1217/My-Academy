
"use client";

import { useCallback, useEffect, useState } from "react";

type Review = {
  id: string;
  name: string;
  rating: number;
  feedback: string;
  createdAt: string;
  content: { id?: string; title: string; slug: string };
};

export default function CourseReviewsAdminPanel() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<Review | null>(null);
  const [busy, setBusy] = useState(false);

  const loadReviews = useCallback(async () => {
    const response = await fetch("/api/admin/course-reviews", {
      cache: "no-store",
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to load course reviews.");
    }

    setReviews(data.reviews);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/admin/course-reviews", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load course reviews.");
        }

        if (active) setReviews(data.reviews);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load reviews.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  async function saveReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/course-reviews/${encodeURIComponent(editing.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editing.name,
            rating: editing.rating,
            feedback: editing.feedback,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update review.");
      }

      setEditing(null);
      await loadReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update review.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteReview(review: Review) {
    if (!window.confirm(`Delete this review by ${review.name}? This cannot be undone.`)) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/course-reviews/${encodeURIComponent(review.id)}`,
        { method: "DELETE" }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete review.");
      }

      if (editing?.id === review.id) setEditing(null);
      await loadReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete review.");
    } finally {
      setBusy(false);
    }
  }

  const visibleReviews = reviews.filter((review) =>
    review.content.title.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <p>Loading course reviews...</p>;

  return (
    <section className="grid gap-5">
      <div>
        <h2 className="text-2xl font-semibold">Course Reviews</h2>
        <p className="mt-1 text-sm opacity-70">
          {reviews.length} total reviews · Edit ratings and feedback or remove reviews.
        </p>
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <input
        className="w-full max-w-md rounded-lg border border-current/20 bg-transparent px-3 py-2"
        placeholder="Filter by course title..."
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
      />

      {editing && (
        <form onSubmit={saveReview} className="grid max-w-2xl gap-3 rounded-xl border border-current/15 p-5">
          <h3 className="text-lg font-semibold">Edit review</h3>
          <p className="text-sm opacity-70">{editing.content.title}</p>

          <label className="grid gap-1 text-sm">
            Reviewer name
            <input
              className="rounded-lg border border-current/20 bg-transparent px-3 py-2"
              value={editing.name}
              onChange={(event) => setEditing({ ...editing, name: event.target.value })}
              maxLength={100}
              required
            />
          </label>

          <label className="grid gap-1 text-sm">
            Rating
            <select
              className="rounded-lg border border-current/20 bg-transparent px-3 py-2"
              value={editing.rating}
              onChange={(event) => setEditing({ ...editing, rating: Number(event.target.value) })}
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>{value} / 5 stars</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            Feedback
            <textarea
              className="rounded-lg border border-current/20 bg-transparent px-3 py-2"
              value={editing.feedback}
              onChange={(event) => setEditing({ ...editing, feedback: event.target.value })}
              maxLength={3000}
              rows={5}
              required
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button className="button button-primary" disabled={busy} type="submit">
              {busy ? "Saving..." : "Save changes"}
            </button>
            <button className="button button-secondary" type="button" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {visibleReviews.length === 0 ? (
        <p className="rounded-xl border border-current/10 p-5 text-sm opacity-70">
          No matching course reviews.
        </p>
      ) : (
        <div className="grid gap-4">
          {visibleReviews.map((review) => (
            <article key={review.id} className="rounded-xl border border-current/10 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{review.content.title}</p>
                  <p className="mt-1 text-sm opacity-70">
                    {review.name} · {new Date(review.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <span className="text-lg" style={{ color: "#eab308" }}>
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{review.feedback}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button className="button button-secondary" type="button" onClick={() => setEditing({ ...review })}>
                  Edit review
                </button>
                <button className="button button-secondary" type="button" disabled={busy} onClick={() => void deleteReview(review)}>
                  Delete review
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
