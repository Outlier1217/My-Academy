"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Item = {
  id: string; title: string; slug: string; type: "ARTICLE" | "BLOG" | "STORY" | "MOCK_TEST";
  subject: string; excerpt: string; body: string; coverImageUrl: string | null; tags: string[];
  questions: unknown; status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; featured: boolean;
  readingMinutes: number | null; durationMinutes: number | null; updatedAt: string;
};

type Draft = {
  title: string; slug: string; type: Item["type"]; subject: string; excerpt: string; body: string;
  coverImageUrl: string; tags: string; status: Item["status"]; featured: boolean;
  readingMinutes: string; durationMinutes: string; questionsJson: string;
};
const EMPTY: Draft = { title: "", slug: "", type: "ARTICLE", subject: "GENERAL", excerpt: "", body: "", coverImageUrl: "", tags: "", status: "DRAFT", featured: false, readingMinutes: "5", durationMinutes: "20", questionsJson: "[]" };
const SUBJECTS = [ ["GENERAL", "General"], ["NISM", "NISM"], ["NCFM", "NCFM"], ["FINANCE", "Finance"], ["AI_ML", "AI / Machine Learning"], ["BLOCKCHAIN", "Blockchain Technology"], ["DEFI", "DeFi"], ["MATHEMATICS", "Mathematics"] ];
const TYPES = [["ARTICLE", "Article"], ["BLOG", "Blog"], ["STORY", "Story"], ["MOCK_TEST", "Mock Test"]];

function toDraft(item: Item): Draft {
  return { title: item.title, slug: item.slug, type: item.type, subject: item.subject, excerpt: item.excerpt, body: item.body, coverImageUrl: item.coverImageUrl ?? "", tags: item.tags.join(", "), status: item.status, featured: item.featured, readingMinutes: item.readingMinutes ? String(item.readingMinutes) : "", durationMinutes: item.durationMinutes ? String(item.durationMinutes) : "", questionsJson: JSON.stringify(item.questions ?? [], null, 2) };
}

export default function AdminDashboard() {
  const [items, setItems] = useState<Item[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/content", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load content.");
      setItems(data.items as Item[]);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load content."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadItems(); }, [loadItems]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function resetForm() { setDraft(EMPTY); setEditingId(null); setError(""); setMessage(""); }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    let questions: unknown[] = [];
    try {
      questions = draft.type === "MOCK_TEST" ? JSON.parse(draft.questionsJson || "[]") as unknown[] : [];
      if (!Array.isArray(questions)) throw new Error("Mock test questions must be a JSON array.");
      const payload = {
        title: draft.title, slug: draft.slug, type: draft.type, subject: draft.subject,
        excerpt: draft.excerpt, body: draft.body, coverImageUrl: draft.coverImageUrl,
        tags: draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean), status: draft.status,
        featured: draft.featured,
        readingMinutes: draft.readingMinutes ? Number(draft.readingMinutes) : null,
        durationMinutes: draft.type === "MOCK_TEST" && draft.durationMinutes ? Number(draft.durationMinutes) : null,
        questions,
      };
      const response = await fetch(editingId ? `/api/admin/content/${editingId}` : "/api/admin/content", {
        method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save content.");
      setMessage(editingId ? "Content updated." : "Content created.");
      setDraft(EMPTY); setEditingId(null);
      await loadItems();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save content."); }
    finally { setBusy(false); }
  }

  async function remove(item: Item) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    setError(""); setMessage("");
    try {
      const response = await fetch(`/api/admin/content/${item.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not delete content.");
      if (editingId === item.id) resetForm();
      setMessage("Content deleted."); await loadItems();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not delete content."); }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.assign("/admin/login");
  }

  const published = items.filter((item) => item.status === "PUBLISHED").length;
  const drafts = items.filter((item) => item.status === "DRAFT").length;

  return <main className="admin-shell">
    <header className="admin-topbar"><a href="/" className="brand"><span className="brand-mark">O<span>.</span></span><span className="brand-name">Outlier <b>Academy</b></span></a><div><span className="admin-mode-label">CONTENT STUDIO</span><button className="button button-secondary button-small" onClick={logout}>Sign out</button></div></header>
    <div className="admin-content">
      <div className="admin-heading"><div><p className="eyebrow">OUTLIER ACADEMY / ADMIN</p><h1>Content studio</h1><p>Write, organize and publish learning material in one place.</p></div><a href="/" className="text-link">View website ↗</a></div>
      <div className="admin-stats"><div><span>Total items</span><strong>{items.length}</strong></div><div><span>Published</span><strong>{published}</strong></div><div><span>Drafts</span><strong>{drafts}</strong></div><div><span>Mock tests</span><strong>{items.filter((item) => item.type === "MOCK_TEST").length}</strong></div></div>
      {(error || message) && <p className={error ? "form-error notice-line" : "form-success notice-line"} role="status">{error || message}</p>}
      <div className="admin-columns">
        <section className="admin-panel admin-editor-panel">
          <div className="panel-heading"><div><p className="eyebrow">{editingId ? "EDIT ITEM" : "NEW ITEM"}</p><h2>{editingId ? "Update content" : "Create content"}</h2></div>{editingId && <button type="button" className="text-link" onClick={resetForm}>Cancel edit</button>}</div>
          <form className="content-editor" onSubmit={save}>
            <label>Title<input required minLength={3} maxLength={180} value={draft.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Introduction to derivatives" /></label>
            <div className="form-row"><label>Content type<select value={draft.type} onChange={(e) => update("type", e.target.value as Draft["type"])}>{TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Subject<select value={draft.subject} onChange={(e) => update("subject", e.target.value)}>{SUBJECTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
            <label>URL slug <span className="field-hint">Optional — generated from title when blank</span><input value={draft.slug} onChange={(e) => update("slug", e.target.value)} placeholder="intro-to-derivatives" /></label>
            <label>Short description<textarea required maxLength={500} rows={2} value={draft.excerpt} onChange={(e) => update("excerpt", e.target.value)} placeholder="What will the reader learn?" /></label>
            <label>Body <span className="field-hint">Markdown supported: headings, links, lists, code and tables.</span><textarea required rows={10} value={draft.body} onChange={(e) => update("body", e.target.value)} placeholder="# Start writing…" /></label>
            <label>Cover image URL <span className="field-hint">Optional; use a hosted image URL.</span><input type="url" value={draft.coverImageUrl} onChange={(e) => update("coverImageUrl", e.target.value)} placeholder="https://…" /></label>
            <label>Tags <span className="field-hint">Comma separated</span><input value={draft.tags} onChange={(e) => update("tags", e.target.value)} placeholder="risk, derivatives, beginners" /></label>
            <div className="form-row"><label>Reading time (minutes)<input type="number" min={1} max={600} value={draft.readingMinutes} onChange={(e) => update("readingMinutes", e.target.value)} /></label>{draft.type === "MOCK_TEST" && <label>Test duration (minutes)<input type="number" min={1} max={600} value={draft.durationMinutes} onChange={(e) => update("durationMinutes", e.target.value)} /></label>}</div>
            {draft.type === "MOCK_TEST" && <label>Mock test questions (JSON) <span className="field-hint">Each question: question, options array, answer as zero-based option index, optional explanation. Example in SETUP.md.</span><textarea className="json-editor" rows={10} spellCheck={false} value={draft.questionsJson} onChange={(e) => update("questionsJson", e.target.value)} /></label>}
            <div className="form-row"><label>Publication status<select value={draft.status} onChange={(e) => update("status", e.target.value as Draft["status"])}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></label><label className="checkbox-label"><input type="checkbox" checked={draft.featured} onChange={(e) => update("featured", e.target.checked)} /> Feature on homepage</label></div>
            <button type="submit" disabled={busy} className="button button-primary">{busy ? "Saving…" : editingId ? "Save changes →" : "Save content →"}</button>
          </form>
        </section>
        <section className="admin-panel admin-library-panel">
          <div className="panel-heading"><div><p className="eyebrow">LIBRARY</p><h2>Existing content</h2></div><span className="count-chip">{items.length}</span></div>
          {loading ? <p className="muted-copy">Loading saved content…</p> : items.length === 0 ? <p className="muted-copy">Nothing here yet. Add your first article, blog, story or mock test using the form.</p> : <div className="admin-library-list">{items.map((item) => <article className="admin-library-item" key={item.id}><div className="library-item-main"><div className="eyebrow-row"><span className="eyebrow-pill">{item.type.replace("_", " ")}</span><span className={`status-label status-${item.status.toLowerCase()}`}>{item.status}</span></div><h3>{item.title}</h3><p>{item.subject.replace("_", " ")} · Updated {new Date(item.updatedAt).toLocaleDateString()}</p><code>/{item.slug}</code></div><div className="library-item-actions"><button className="text-link" onClick={() => { setDraft(toDraft(item)); setEditingId(item.id); setError(""); setMessage(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button><button className="danger-link" onClick={() => void remove(item)}>Delete</button></div></article>)}</div>}
        </section>
      </div>
      <p className="admin-footnote">Publishing makes an item visible publicly. Drafts remain private. Use a strong password, keep .env out of Git, and back up PostgreSQL regularly.</p>
    </div>
  </main>;
}
