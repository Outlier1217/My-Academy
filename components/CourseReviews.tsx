
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Review = {
  id: string;
  name: string;
  rating: number;
  feedback: string;
  createdAt: string;
};

type CurrentUser = {
  name: string;
  email: string;
};

type ReviewData = {
  reviews: Review[];
  count: number;
  averageRating: number;
};

export default function CourseReviews({ slug }: { slug: string }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [data, setData] = useState<ReviewData>({
    reviews: [],
    count: 0,
    averageRating: 0,
  });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    const response = await fetch(
      `/api/courses/${encodeURIComponent(slug)}/reviews`,
      { cache: "no-store" }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to load reviews.");
    }

    setData(result);
  }, [slug]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [userResponse, reviewsResponse] = await Promise.all([
          fetch("/api/auth/me", { cache: "no-store" }),
          fetch(`/api/courses/${encodeURIComponent(slug)}/reviews`, {
            cache: "no-store",
          }),
        ]);

        const userData = await userResponse.json();
        const reviewData = await reviewsResponse.json();

        if (!reviewsResponse.ok) {
          throw new Error(reviewData.error || "Unable to load reviews.");
        }

        if (!active) return;

        if (userData.user) {
          setUser(userData.user);
          setName(userData.user.name);
          setEmail(userData.user.email);
        }

        setData(reviewData);
      } catch (error) {
        if (active) {
          setStatus(
            error instanceof Error
              ? error.message
              : "Unable to load reviews."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [slug]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");

    try {
      const response = await fetch(
        `/api/courses/${encodeURIComponent(slug)}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, rating, feedback }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to submit review.");
      }

      setFeedback("");
      setRating(5);
      setStatus("Thank you! Your review has been submitted.");

      await loadReviews();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to submit review."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-12 border-t border-current/10 pt-8">
      <p className="text-sm uppercase tracking-widest opacity-60">
        Learner feedback
      </p>

      <h2 className="mt-2 text-2xl font-semibold">Course Reviews</h2>

      <p className="mt-2 text-sm opacity-75">
        {data.count > 0
          ? `${data.averageRating.toFixed(1)} out of 5 · ${data.count} ${
              data.count === 1 ? "review" : "reviews"
            }`
          : "No reviews yet. Be the first to share your experience."}
      </p>

      <form className="mt-6 grid max-w-xl gap-4" onSubmit={handleSubmit}>
        {!user && (
          <>
            <label className="grid gap-1 text-sm">
              Your name
              <input
                className="w-full rounded-lg border border-current/20 bg-transparent px-3 py-2"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                autoComplete="name"
                required
              />
            </label>

            <label className="grid gap-1 text-sm">
              Your email
              <input
                className="w-full rounded-lg border border-current/20 bg-transparent px-3 py-2"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={254}
                autoComplete="email"
                required
              />
            </label>
          </>
        )}

        <fieldset>
          <legend className="mb-2 text-sm font-medium">
            Your rating
          </legend>

          <div className="flex gap-2" aria-label="Choose a rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                aria-pressed={rating === value}
                className="text-3xl leading-none"
                style={{
                  color: value <= rating ? "#eab308" : "currentColor",
                  opacity: value <= rating ? 1 : 0.35,
                }}
              >
                ★
              </button>
            ))}
          </div>
        </fieldset>

        <label className="grid gap-1 text-sm">
          Your feedback
          <textarea
            className="w-full rounded-lg border border-current/20 bg-transparent px-3 py-2"
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            maxLength={3000}
            rows={4}
            placeholder="What did you learn from this course?"
            required
          />
        </label>

        <button
          type="submit"
          className="button button-primary justify-self-start"
          disabled={busy}
        >
          {busy ? "Submitting..." : "Submit review"}
        </button>

        {status && (
          <p role="status" aria-live="polite" className="text-sm">
            {status}
          </p>
        )}
      </form>

      <div className="mt-8 grid max-w-3xl gap-4">
        {loading ? (
          <p className="text-sm opacity-60">Loading reviews...</p>
        ) : data.reviews.length === 0 ? (
          <p className="text-sm opacity-60">Reviews will appear here.</p>
        ) : (
          data.reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-xl border border-current/10 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">{review.name}</h3>
                <span className="text-sm opacity-65">
                  {new Date(review.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              <p
                className="mt-2 text-lg"
                style={{ color: "#eab308" }}
                aria-label={`${review.rating} out of 5 stars`}
              >
                {"★".repeat(review.rating)}
                <span className="opacity-30">
                  {"★".repeat(5 - review.rating)}
                </span>
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                {review.feedback}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
