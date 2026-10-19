
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type Course = {
  id: string;
  title: string;
  slug: string;
  type: "COURSE";
  subject: string;
  excerpt: string;
  body: string;
  coverImageUrl: string | null;
  youtubeUrl: string | null;
  status: CourseStatus;
  createdAt?: string;
  updatedAt?: string;
};

type CourseForm = {
  title: string;
  slug: string;
  subject: string;
  excerpt: string;
  body: string;
  coverImageUrl: string;
  youtubeUrl: string;
  status: CourseStatus;
};

const EMPTY_FORM: CourseForm = {
  title: "",
  slug: "",
  subject: "GENERAL",
  excerpt: "",
  body: "",
  coverImageUrl: "",
  youtubeUrl: "",
  status: "DRAFT",
};

const SUBJECTS = [
  ["GENERAL", "General"],
  ["MATHEMATICS", "Mathematics"],
  ["NISM", "NISM"],
  ["NCFM", "NCFM"],
  ["FINANCE", "Finance"],
  ["AI_ML", "AI & Machine Learning"],
  ["BLOCKCHAIN", "Blockchain"],
  ["DEFI", "DeFi"],
] as const;

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isYouTubeUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return (
      ["youtube.com", "m.youtube.com", "youtu.be", "youtube-nocookie.com"].includes(host) &&
      (url.protocol === "https:" || url.protocol === "http:")
    );
  } catch {
    return false;
  }
}

function readCourses(payload: unknown): Course[] {
  if (Array.isArray(payload)) return payload as Course[];

  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    for (const key of ["items", "content", "data"]) {
      if (Array.isArray(data[key])) return data[key] as Course[];
    }
  }

  return [];
}

export default function CoursesStudio() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<CourseForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/content", {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Could not load courses.");
      }

      setCourses(readCourses(payload).filter((item) => item.type === "COURSE"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load courses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  function updateField<K extends keyof CourseForm>(
    key: K,
    value: CourseForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startNewCourse() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setNotice("");
  }

  function editCourse(course: Course) {
    setEditingId(course.id);
    setForm({
      title: course.title,
      slug: course.slug,
      subject: course.subject,
      excerpt: course.excerpt,
      body: course.body,
      coverImageUrl: course.coverImageUrl || "",
      youtubeUrl: course.youtubeUrl || "",
      status: course.status,
    });
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadCover(file?: File) {
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Please select a JPG, PNG, WEBP or GIF image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Cover image must be 5 MB or smaller.");
      return;
    }

    setUploading(true);
    setError("");
    setNotice("");

    try {
      const data = new FormData();
      data.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: data,
      });
      const result = await response.json();

      if (!response.ok || !result.url) {
        throw new Error(result?.error || "Image upload failed.");
      }

      updateField("coverImageUrl", result.url);
      setNotice("Cover image uploaded successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function saveCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!form.youtubeUrl.trim() || !isYouTubeUrl(form.youtubeUrl.trim())) {
      setError("Please enter a valid YouTube video or playlist URL.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || makeSlug(form.title),
        type: "COURSE",
        subject: form.subject,
        excerpt: form.excerpt.trim(),
        body: form.body.trim(),
        coverImageUrl: form.coverImageUrl || "",
        youtubeUrl: form.youtubeUrl.trim(),
        tags: [],
        questions: [],
        status: form.status,
        featured: false,
        readingMinutes: null,
        durationMinutes: null,
      };

      const response = await fetch(
        editingId ? `/api/admin/content/${editingId}` : "/api/admin/content",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Could not save course.");
      }

      setNotice(
        form.status === "PUBLISHED"
          ? "Course saved. It is marked as published."
          : "Course saved successfully.",
      );

      setEditingId(null);
      setForm(EMPTY_FORM);
      await loadCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save course.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(course: Course, status: CourseStatus) {
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/admin/content/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: course.title,
          slug: course.slug,
          type: "COURSE",
          subject: course.subject,
          excerpt: course.excerpt,
          body: course.body,
          coverImageUrl: course.coverImageUrl || "",
          youtubeUrl: course.youtubeUrl || "",
          tags: [],
          questions: [],
          status,
          featured: false,
          readingMinutes: null,
          durationMinutes: null,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "Status update failed.");

      setNotice(`Course status changed to ${status}.`);
      await loadCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed.");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber">
            Outlier Academy
          </p>
          <h2 className="mt-1 text-2xl font-bold">Courses Studio</h2>
          <p className="mt-1 text-sm text-muted">
            Manage course details, cover images and YouTube lessons.
          </p>
        </div>
        <button
          type="button"
          onClick={startNewCourse}
          className="rounded-xl bg-amber text-ink px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          + New course
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-error bg-surface2 p-3 text-sm text-error">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="rounded-xl border border-teal bg-emerald-50 p-3 text-sm text-teal">
          {notice}
        </div>
      )}

      <form onSubmit={saveCourse} className="space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-sm md:p-7">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold">{editingId ? "Edit course" : "Create a course"}</h3>
          {editingId && (
            <button type="button" onClick={startNewCourse} className="text-sm font-medium text-muted underline">
              Cancel editing
            </button>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-medium">
            Course title *
            <input
              required
              minLength={3}
              maxLength={180}
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((current) => ({
                  ...current,
                  title,
                  slug: editingId ? current.slug : makeSlug(title),
                }));
              }}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2.5"
              placeholder="Complete Python Course"
            />
          </label>

          <label className="block text-sm font-medium">
            URL slug
            <input
              value={form.slug}
              onChange={(e) => updateField("slug", makeSlug(e.target.value))}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2.5"
              placeholder="complete-python-course"
            />
          </label>

          <label className="block text-sm font-medium">
            Subject *
            <select
              value={form.subject}
              onChange={(e) => updateField("subject", e.target.value)}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2.5"
            >
              {SUBJECTS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium">
            Publication status
            <select
              value={form.status}
              onChange={(e) => updateField("status", e.target.value as CourseStatus)}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2.5"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
        </div>

        <label className="block text-sm font-medium">
          Short description *
          <textarea
            required
            minLength={5}
            maxLength={500}
            rows={3}
            value={form.excerpt}
            onChange={(e) => updateField("excerpt", e.target.value)}
            className="mt-1 w-full rounded-xl border border-border px-3 py-2.5"
            placeholder="What will students learn in this course?"
          />
        </label>

        <label className="block text-sm font-medium">
          Full course description
          <textarea
            rows={6}
            value={form.body}
            onChange={(e) => updateField("body", e.target.value)}
            className="mt-1 w-full rounded-xl border border-border px-3 py-2.5"
            placeholder="Course overview, syllabus, prerequisites and learning outcomes..."
          />
        </label>

        <label className="block text-sm font-medium">
          YouTube video or playlist URL *
          <input
            type="url"
            required
            value={form.youtubeUrl}
            onChange={(e) => updateField("youtubeUrl", e.target.value)}
            className="mt-1 w-full rounded-xl border border-border px-3 py-2.5"
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <span className="mt-1 block text-xs font-normal text-muted">
            Paste a public or unlisted YouTube video/playlist link. Embedding must be enabled for that video.
          </span>
        </label>

        <div>
          <label className="block text-sm font-medium">
            Course cover image
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={uploading}
              onChange={(e) => {
                void uploadCover(e.target.files?.[0]);
                e.currentTarget.value = "";
              }}
              className="mt-2 block w-full text-sm"
            />
          </label>
          <p className="mt-1 text-xs text-muted">JPG, PNG, WEBP or GIF; maximum 5 MB.</p>

          {uploading && <p className="mt-2 text-sm text-amber">Uploading image…</p>}

          {form.coverImageUrl && (
            <div className="mt-3 max-w-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.coverImageUrl}
                alt="Course cover preview"
                className="aspect-video w-full rounded-xl border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => updateField("coverImageUrl", "")}
                className="mt-2 text-sm text-error underline"
              >
                Remove cover image
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-5">
          <button
            type="submit"
            disabled={saving || uploading}
            className="rounded-xl bg-amber text-ink px-5 py-2.5 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Update course" : "Save course"}
          </button>
          <a href="/courses" target="_blank" rel="noreferrer" className="rounded-xl border border-border px-5 py-2.5 font-semibold">
            Preview courses page
          </a>
        </div>
      </form>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-bold">Your courses</h3>
          <p className="text-sm text-muted">Edit a course or change its publication status.</p>
        </div>

        {loading ? (
          <p className="text-sm text-muted">Loading courses…</p>
        ) : courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
            No courses yet. Create your first course above.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <article key={course.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
                {course.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.coverImageUrl} alt="" className="aspect-video w-full object-cover" />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-surface2 text-sm text-muted">
                    No cover image
                  </div>
                )}
                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-surface2 px-2.5 py-1 text-xs font-semibold">{course.status}</span>
                    <span className="text-xs text-muted">{course.subject.replaceAll("_", " ")}</span>
                  </div>
                  <h4 className="font-bold">{course.title}</h4>
                  <p className="line-clamp-3 text-sm text-muted">{course.excerpt}</p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <button type="button" onClick={() => editCourse(course)} className="text-sm font-semibold text-amber">
                      Edit
                    </button>
                    {course.status !== "PUBLISHED" ? (
                      <button type="button" onClick={() => void changeStatus(course, "PUBLISHED")} className="text-sm font-semibold text-teal">
                        Publish
                      </button>
                    ) : (
                      <button type="button" onClick={() => void changeStatus(course, "DRAFT")} className="text-sm font-semibold text-amber">
                        Unpublish
                      </button>
                    )}
                    {course.status !== "ARCHIVED" && (
                      <button type="button" onClick={() => void changeStatus(course, "ARCHIVED")} className="text-sm font-semibold text-muted">
                        Archive
                      </button>
                    )}
                    {course.status === "PUBLISHED" && (
                      <a href={`/courses/${course.slug}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-amber">
                        View course ↗
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
