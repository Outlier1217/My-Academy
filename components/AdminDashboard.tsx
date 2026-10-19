
"use client";

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import MockTestStudio from "@/components/MockTestStudio";
import CoursesStudio from "@/components/CoursesStudio";
import UserManagementPanel from "@/components/UserManagementPanel";
import ContactMessagesPanel from "@/components/ContactMessagesPanel";
import CourseReviewsAdminPanel from "@/components/CourseReviewsAdminPanel";
import TestimonialsStudio from "@/components/TestimonialsStudio";

type ContentType = "ARTICLE" | "BLOG" | "STORY" | "MOCK_TEST";
type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type Section =
  | "content"
  | "tests"
  | "courses"
  | "users"
  | "messages"
  | "reviews"
  | "testimonials";

type Item = {
  id: string;
  title: string;
  slug: string;
  type: ContentType;
  subject: string;
  excerpt: string;
  body: string;
  coverImageUrl: string | null;
  tags: string[];
  questions: unknown;
  status: ContentStatus;
  featured: boolean;
  readingMinutes: number | null;
  durationMinutes: number | null;
  updatedAt: string;
};

type Draft = {
  title: string;
  slug: string;
  type: Exclude<ContentType, "MOCK_TEST">;
  subject: string;
  excerpt: string;
  body: string;
  coverImageUrl: string;
  tags: string;
  status: ContentStatus;
  featured: boolean;
  readingMinutes: string;
};

const EMPTY: Draft = {
  title: "",
  slug: "",
  type: "ARTICLE",
  subject: "GENERAL",
  excerpt: "",
  body: "",
  coverImageUrl: "",
  tags: "",
  status: "DRAFT",
  featured: false,
  readingMinutes: "5",
};

const SUBJECTS = [
  ["GENERAL", "General"],
  ["NISM", "NISM"],
  ["NCFM", "NCFM"],
  ["FINANCE", "Finance"],
  ["AI_ML", "AI / Machine Learning"],
  ["BLOCKCHAIN", "Blockchain Technology"],
  ["DEFI", "DeFi"],
  ["MATHEMATICS", "Mathematics"],
];

const CONTENT_TYPES = [
  { value: "ARTICLE", label: "Article" },
  { value: "BLOG", label: "Blog" },
  { value: "STORY", label: "Story" },
] as const;

function toDraft(item: Item): Draft {
  return {
    title: item.title,
    slug: item.slug,
    type: item.type === "MOCK_TEST" ? "ARTICLE" : item.type,
    subject: item.subject,
    excerpt: item.excerpt,
    body: item.body,
    coverImageUrl: item.coverImageUrl ?? "",
    tags: item.tags.join(", "),
    status: item.status,
    featured: item.featured,
    readingMinutes: item.readingMinutes
      ? String(item.readingMinutes)
      : "",
  };
}

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<Section>("content");
  const [items, setItems] = useState<Item[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const contentItems = items.filter((item) => item.type !== "MOCK_TEST");
  const published = contentItems.filter(
    (item) => item.status === "PUBLISHED"
  ).length;
  const drafts = contentItems.filter(
    (item) => item.status === "DRAFT"
  ).length;
  const mockTests = items.filter(
    (item) => item.type === "MOCK_TEST"
  ).length;

  const loadItems = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/content", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not load content.");
      }

      setItems(data.items as Item[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load content.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setDraft(EMPTY);
    setEditingId(null);
    setError("");
    setMessage("");
  }

  async function uploadCoverImage(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Image upload failed.");
      }
      if (typeof data.url !== "string") {
        throw new Error("The server did not return an image URL.");
      }

      update("coverImageUrl", data.url);
      setMessage("Cover image uploaded successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image upload failed.");
    } finally {
      setUploading(false);
      input.value = "";
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        title: draft.title.trim(),
        slug: draft.slug.trim(),
        type: draft.type,
        subject: draft.subject,
        excerpt: draft.excerpt.trim(),
        body: draft.body,
        coverImageUrl: draft.coverImageUrl,
        tags: draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        status: draft.status,
        featured: draft.featured,
        readingMinutes: draft.readingMinutes
          ? Number(draft.readingMinutes)
          : null,
        durationMinutes: null,
        questions: [],
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
        throw new Error(data.error ?? "Could not save content.");
      }

      setMessage(editingId ? "Content updated." : "Content created.");
      resetForm();
      await loadItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save content.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: Item) {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/content/${item.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not delete content.");
      }

      if (editingId === item.id) resetForm();

      setMessage("Content deleted.");
      await loadItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete content.");
    }
  }

  async function logout() {
    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Could not sign out.");
      window.location.assign("/admin/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign out.");
    }
  }

  function startEditing(item: Item) {
    if (item.type === "MOCK_TEST") {
      setActiveSection("tests");
      return;
    }

    setDraft(toDraft(item));
    setEditingId(item.id);
    setError("");
    setMessage("");
    setActiveSection("content");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <a href="/" className="brand">
          <span className="brand-mark">O<span>.</span></span>
          <span className="brand-name">Outlier <b>Academy</b></span>
        </a>

        <div>
          <span className="admin-mode-label">ADMIN STUDIO</span>{" "}
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={() => void logout()}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="admin-content">
        <div className="admin-heading">
          <div>
            <p className="eyebrow">OUTLIER ACADEMY / ADMIN</p>
            <h1>Learning Studio</h1>
            <p>Manage learning content and assessments from separate workspaces.</p>
          </div>
          <a href="/" className="text-link">View website ↗</a>
        </div>

        <nav className="form-row" aria-label="Admin sections" style={{ marginBottom: 24 }}>
          <button
            type="button"
            className={activeSection === "content" ? "button button-primary" : "button button-secondary"}
            onClick={() => setActiveSection("content")}
          >
            Content Studio
          </button>
          <button
            type="button"
            className={activeSection === "tests" ? "button button-primary" : "button button-secondary"}
            onClick={() => setActiveSection("tests")}
          >
            Mock Test Studio
          </button>

          <button
  type="button"
  onClick={() => setActiveSection("courses")}
  className={activeSection === "courses"
    ? "rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white"
    : "rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700"}
>
  Courses Studio
</button>
<button
  type="button"
  className={
    activeSection === "users"
      ? "button button-primary"
      : "button button-secondary"
  }
  onClick={() => setActiveSection("users")}
>
  Users
</button>
<button
  type="button"
  className={
    activeSection === "messages"
      ? "button button-primary"
      : "button button-secondary"
  }
  onClick={() => setActiveSection("messages")}
>
  Contact Messages
</button>
<button
  type="button"
  className={
    activeSection === "reviews"
      ? "button button-primary"
      : "button button-secondary"
  }
  onClick={() => setActiveSection("reviews")}
>
  Course Reviews
</button>

<button
  type="button"
  className={
    activeSection === "testimonials"
      ? "button button-primary"
      : "button button-secondary"
  }
  onClick={() => setActiveSection("testimonials")}
>
  Success Stories
</button>
        </nav>

        <div className="admin-stats">
          <div><span>Content items</span><strong>{contentItems.length}</strong></div>
          <div><span>Published</span><strong>{published}</strong></div>
          <div><span>Drafts</span><strong>{drafts}</strong></div>
          <div><span>Mock tests</span><strong>{mockTests}</strong></div>
        </div>

        {activeSection === "content" ? (
          <>
            {(error || message) && (
              <p className={error ? "form-error notice-line" : "form-success notice-line"} role="status">
                {error || message}
              </p>
            )}

            <div className="admin-columns">
              <section className="admin-panel admin-editor-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">{editingId ? "EDIT CONTENT" : "NEW CONTENT"}</p>
                    <h2>{editingId ? "Update content" : "Create content"}</h2>
                  </div>
                  {editingId && (
                    <button type="button" className="text-link" onClick={resetForm}>
                      Cancel edit
                    </button>
                  )}
                </div>

                <form className="content-editor" onSubmit={save}>
                  <label>
                    Title
                    <input
                      required
                      minLength={3}
                      maxLength={180}
                      value={draft.title}
                      onChange={(e) => update("title", e.target.value)}
                      placeholder="e.g. Introduction to derivatives"
                    />
                  </label>

                  <div className="form-row">
                    <label>
                      Content type
                      <select
                        value={draft.type}
                        onChange={(e) => update("type", e.target.value as Draft["type"])}
                      >
                        {CONTENT_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Subject
                      <select value={draft.subject} onChange={(e) => update("subject", e.target.value)}>
                        {SUBJECTS.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label>
                    URL slug
                    <span className="field-hint">Optional — generated from title when blank</span>
                    <input value={draft.slug} onChange={(e) => update("slug", e.target.value)} placeholder="intro-to-derivatives" />
                  </label>

                  <label>
                    Short description
                    <textarea required maxLength={500} rows={2} value={draft.excerpt} onChange={(e) => update("excerpt", e.target.value)} placeholder="What will the reader learn?" />
                  </label>

                  <label>
                    Body
                    <span className="field-hint">Markdown supported: headings, links, lists, code and tables.</span>
                    <textarea required rows={10} value={draft.body} onChange={(e) => update("body", e.target.value)} placeholder="# Start writing..." />
                  </label>

                  <label>
                    Upload cover image
                    <span className="field-hint">JPG, PNG, WEBP or GIF. Maximum size: 5 MB.</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={uploadCoverImage}
                      disabled={uploading}
                    />
                    {uploading && <span className="field-hint">Uploading image...</span>}

                    {draft.coverImageUrl && (
                      <div>
                        <img
                          src={draft.coverImageUrl}
                          alt="Cover image preview"
                          style={{ display: "block", width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 8, marginTop: 8 }}
                        />
                        <span className="field-hint">Image uploaded. Save content to keep this image URL.</span>
                        <button type="button" className="text-link" onClick={() => update("coverImageUrl", "")}>
                          Remove cover image
                        </button>
                      </div>
                    )}
                  </label>

                  <label>
                    Tags <span className="field-hint">Comma separated</span>
                    <input value={draft.tags} onChange={(e) => update("tags", e.target.value)} placeholder="risk, derivatives, beginners" />
                  </label>

                  <label>
                    Reading time (minutes)
                    <input type="number" min={1} max={600} value={draft.readingMinutes} onChange={(e) => update("readingMinutes", e.target.value)} />
                  </label>

                  <div className="form-row">
                    <label>
                      Publication status
                      <select value={draft.status} onChange={(e) => update("status", e.target.value as ContentStatus)}>
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </label>

                    <label className="checkbox-label">
                      <input type="checkbox" checked={draft.featured} onChange={(e) => update("featured", e.target.checked)} />
                      Feature on homepage
                    </label>
                  </div>

                  <button type="submit" disabled={busy || uploading} className="button button-primary">
                    {busy ? "Saving..." : editingId ? "Save changes →" : "Save content →"}
                  </button>
                </form>
              </section>

              <section className="admin-panel admin-library-panel">
                <div className="panel-heading">
                  <div><p className="eyebrow">LIBRARY</p><h2>Existing content</h2></div>
                  <span className="count-chip">{contentItems.length}</span>
                </div>

                {loading ? (
                  <p className="muted-copy">Loading saved content...</p>
                ) : contentItems.length === 0 ? (
                  <p className="muted-copy">No articles, blogs or stories yet.</p>
                ) : (
                  <div className="admin-library-list">
                    {contentItems.map((item) => (
                      <article className="admin-library-item" key={item.id}>
                        <div className="library-item-main">
                          <div className="eyebrow-row">
                            <span className="eyebrow-pill">{item.type.replace("_", " ")}</span>
                            <span className={`status-label status-${item.status.toLowerCase()}`}>{item.status}</span>
                          </div>
                          <h3>{item.title}</h3>
                          <p>{item.subject.replace("_", " ")} · Updated {new Date(item.updatedAt).toLocaleDateString()}</p>
                          <code>/{item.slug}</code>
                        </div>
                        <div className="library-item-actions">
                          <button type="button" className="text-link" onClick={() => startEditing(item)}>Edit</button>
                          <button type="button" className="danger-link" onClick={() => void remove(item)}>Delete</button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
          ) : activeSection === "tests" ? (
            <MockTestStudio />
          ) : activeSection === "courses" ? (
            <CoursesStudio />
          ) : activeSection === "users" ? (
            <UserManagementPanel />
          ) : activeSection === "messages" ? (
            <ContactMessagesPanel />
          ) : activeSection === "reviews" ? (
            <CourseReviewsAdminPanel />
          ) : (
            <TestimonialsStudio />
          )}

        <p className="admin-footnote">
          Publishing makes an item visible publicly. Drafts remain private.
          Keep environment files out of Git and back up PostgreSQL regularly.
        </p>
      </div>
    </main>
  );
}
