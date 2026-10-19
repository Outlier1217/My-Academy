
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ContentActionsProps = {
  contentId: string;
  title: string;
  slug: string;
  href?: string;
};

export default function ContentActions({
  contentId,
  title,
  slug,
  href,
}: ContentActionsProps) {
  const router = useRouter();
  const contentUrl = href ?? `/content/${slug}`;

  const [loggedIn, setLoggedIn] = useState(false);
  const [bookmark, setBookmark] = useState(false);
  const [favourite, setFavourite] = useState(false);
  const [loading, setLoading] = useState<"bookmark" | "favourite" | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const response = await fetch(
          `/api/account/saved?contentId=${encodeURIComponent(contentId)}`,
          { cache: "no-store" }
        );

        if (!active) return;

        if (response.status === 401) {
          setLoggedIn(false);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setLoggedIn(true);
          setBookmark(Boolean(data.bookmark));
          setFavourite(Boolean(data.favourite));
        }
      } catch {
        // Sharing remains available if account status cannot be loaded.
      }
    }

    void loadStatus();

    return () => {
      active = false;
    };
  }, [contentId]);

  async function toggleSaved(kind: "bookmark" | "favourite") {
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent(contentUrl)}`);
      return;
    }

    const currentlySaved = kind === "bookmark" ? bookmark : favourite;
    setLoading(kind);
    setMessage("");

    try {
      const response = await fetch("/api/account/saved", {
        method: currentlySaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, kind }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        setLoggedIn(false);
        router.push(`/login?next=${encodeURIComponent(contentUrl)}`);
        return;
      }

      if (!response.ok) {
        setMessage(data.error || "Unable to update saved content.");
        return;
      }

      if (kind === "bookmark") {
        setBookmark(!currentlySaved);
      } else {
        setFavourite(!currentlySaved);
      }

      setMessage(
        currentlySaved
          ? kind === "bookmark"
            ? "Bookmark removed."
            : "Removed from favourites."
          : kind === "bookmark"
            ? "Bookmarked successfully."
            : "Added to favourites."
      );
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function shareContent() {
    const url = `${window.location.origin}${contentUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setMessage("Link copied. Share it with anyone!");
      } else {
        window.prompt("Copy this link to share:", url);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        window.prompt("Copy this link to share:", url);
      }
    }
  }

  return (
    <div className="content-actions">
      <button
        type="button"
        className={`content-action-button${bookmark ? " is-active" : ""}`}
        onClick={() => void toggleSaved("bookmark")}
        disabled={loading !== null}
        aria-pressed={bookmark}
        title={bookmark ? "Remove bookmark" : "Bookmark this content"}
      >
        <span aria-hidden="true">{bookmark ? "🔖" : "♧"}</span>
        {loading === "bookmark"
          ? "Saving…"
          : bookmark
            ? "Bookmarked"
            : "Bookmark"}
      </button>

      <button
        type="button"
        className={`content-action-button${favourite ? " is-active" : ""}`}
        onClick={() => void toggleSaved("favourite")}
        disabled={loading !== null}
        aria-pressed={favourite}
        title={favourite ? "Remove from favourites" : "Add to favourites"}
      >
        <span aria-hidden="true">{favourite ? "♥" : "♡"}</span>
        {loading === "favourite"
          ? "Saving…"
          : favourite
            ? "Favourited"
            : "Favourite"}
      </button>

      <button
        type="button"
        className="content-action-button"
        onClick={() => void shareContent()}
      >
        <span aria-hidden="true">↗</span>
        Share
      </button>

      {message && (
        <p className="content-action-message" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
