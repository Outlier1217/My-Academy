
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type ProjectStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type Project = {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  summary: string;
  description: string;
  coverImageUrl: string;
  demoUrl: string | null;
  repoUrl: string | null;
  techStack: string[];
  status: ProjectStatus;
  featured: boolean;
  sortOrder: number;
  publishedAt: string | null;
  createdAt: string;
};

type ProjectForm = {
  title: string;
  slug: string;
  tagline: string;
  summary: string;
  description: string;
  coverImageUrl: string;
  demoUrl: string;
  repoUrl: string;
  techStack: string;
  status: ProjectStatus;
  featured: boolean;
  sortOrder: string;
};

const EMPTY_FORM: ProjectForm = {
  title: "",
  slug: "",
  tagline: "",
  summary: "",
  description: "",
  coverImageUrl: "",
  demoUrl: "",
  repoUrl: "",
  techStack: "",
  status: "DRAFT",
  featured: false,
  sortOrder: "0",
};

function toForm(project: Project): ProjectForm {
  return {
    title: project.title,
    slug: project.slug,
    tagline: project.tagline,
    summary: project.summary,
    description: project.description,
    coverImageUrl: project.coverImageUrl,
    demoUrl: project.demoUrl ?? "",
    repoUrl: project.repoUrl ?? "",
    techStack: project.techStack.join(", "),
    status: project.status,
    featured: project.featured,
    sortOrder: String(project.sortOrder),
  };
}

export default function ProjectsStudio() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/projects", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not load projects.");
      }

      setProjects(data.projects as Project[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  function update<K extends keyof ProjectForm>(
    key: K,
    value: ProjectForm[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    setMessage("");
  }

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function uploadCover(file: File) {
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
      setMessage("Cover image uploaded. Save the project to apply it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        title: form.title.trim(),
        slug: generateSlug(form.slug || form.title),
        tagline: form.tagline.trim(),
        summary: form.summary.trim(),
        description: form.description.trim(),
        coverImageUrl: form.coverImageUrl.trim(),
        demoUrl: form.demoUrl.trim(),
        repoUrl: form.repoUrl.trim(),
        techStack: form.techStack
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        status: form.status,
        featured: form.featured,
        sortOrder: Number(form.sortOrder),
      };

      const response = await fetch(
        editingId
          ? `/api/admin/projects/${editingId}`
          : "/api/admin/projects",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not save project.");
      }

      setMessage(editingId ? "Project updated." : "Project created.");
      resetForm();
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save project.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(project: Project) {
    if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not delete project.");
      }

      if (editingId === project.id) resetForm();

      setMessage("Project deleted.");
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete project.");
    }
  }

  return (
    <div className="admin-columns">
      <section className="admin-panel admin-editor-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">
              {editingId ? "EDIT PROJECT" : "PROJECT STUDIO"}
            </p>
            <h2>{editingId ? "Update project" : "Create project"}</h2>
          </div>

          {editingId && (
            <button
              type="button"
              className="text-link"
              onClick={resetForm}
            >
              Cancel edit
            </button>
          )}
        </div>

        {(error || message) && (
          <p
            className={error ? "form-error notice-line" : "form-success notice-line"}
            role="status"
          >
            {error || message}
          </p>
        )}

        <form className="content-editor" onSubmit={save}>
          <label>
            Project title
            <input
              required
              maxLength={150}
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((current) => ({
                  ...current,
                  title,
                  slug:
                    !editingId || !current.slug
                      ? generateSlug(title)
                      : current.slug,
                }));
              }}
              placeholder="e.g. Quilvion"
            />
          </label>

          <label>
            URL slug
            <input
              required
              maxLength={180}
              value={form.slug}
              onChange={(e) => update("slug", generateSlug(e.target.value))}
              placeholder="quilvion"
            />
            <span className="field-hint">
              Project URL: /projects/{form.slug || "your-project"}
            </span>
          </label>

          <label>
            Tagline
            <input
              required
              maxLength={300}
              value={form.tagline}
              onChange={(e) => update("tagline", e.target.value)}
              placeholder="A short headline for your project"
            />
          </label>

          <label>
            Short summary
            <textarea
              required
              maxLength={1000}
              rows={3}
              value={form.summary}
              onChange={(e) => update("summary", e.target.value)}
              placeholder="Explain what the project does."
            />
          </label>

          <label>
            Full description
            <textarea
              required
              maxLength={30000}
              rows={9}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Describe features, architecture, challenges and results."
            />
          </label>

          <label>
            Cover image
            <span className="field-hint">
              JPG, PNG, WEBP or GIF. Maximum 5 MB.
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadCover(file);
                e.currentTarget.value = "";
              }}
            />
            {uploading && <span className="field-hint">Uploading...</span>}
          </label>

          {form.coverImageUrl && (
            <div>
              <img
                src={form.coverImageUrl}
                alt="Project cover preview"
                style={{
                  display: "block",
                  width: "100%",
                  maxHeight: 240,
                  objectFit: "cover",
                  borderRadius: 10,
                  marginTop: 8,
                }}
              />
              <button
                type="button"
                className="text-link"
                onClick={() => update("coverImageUrl", "")}
              >
                Remove cover image
              </button>
            </div>
          )}

          <label>
            Cover image URL
            <input
              required
              maxLength={2048}
              value={form.coverImageUrl}
              onChange={(e) => update("coverImageUrl", e.target.value)}
              placeholder="/uploads/project-cover.webp"
            />
          </label>

          <label>
            Technology stack
            <input
              value={form.techStack}
              onChange={(e) => update("techStack", e.target.value)}
              placeholder="Next.js, TypeScript, PostgreSQL"
            />
            <span className="field-hint">Separate technologies with commas.</span>
          </label>

          <label>
            Live demo URL (optional)
            <input
              type="url"
              maxLength={2048}
              value={form.demoUrl}
              onChange={(e) => update("demoUrl", e.target.value)}
              placeholder="https://example.com"
            />
          </label>

          <label>
            GitHub repository URL (optional)
            <input
              type="url"
              maxLength={2048}
              value={form.repoUrl}
              onChange={(e) => update("repoUrl", e.target.value)}
              placeholder="https://github.com/username/project"
            />
          </label>

          <div className="form-row">
            <label>
              Publication status
              <select
                value={form.status}
                onChange={(e) =>
                  update("status", e.target.value as ProjectStatus)
                }
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>

            <label>
              Display order
              <input
                type="number"
                min={0}
                max={100000}
                required
                value={form.sortOrder}
                onChange={(e) => update("sortOrder", e.target.value)}
              />
            </label>
          </div>

          <label>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => update("featured", e.target.checked)}
            />{" "}
            Feature this project
          </label>

          <button
            type="submit"
            className="button button-primary"
            disabled={busy || uploading}
          >
            {busy
              ? "Saving..."
              : editingId
                ? "Update project"
                : "Create project"}
          </button>
        </form>
      </section>

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">PROJECT LIBRARY</p>
            <h2>Manage projects</h2>
          </div>
          <span>{projects.length} total</span>
        </div>

        {loading ? (
          <p>Loading projects...</p>
        ) : projects.length === 0 ? (
          <p>No projects yet. Create your first project using the form.</p>
        ) : (
          <div className="content-editor">
            {projects.map((project) => (
              <article
                key={project.id}
                className="admin-panel"
                style={{ padding: 16 }}
              >
                {project.coverImageUrl && (
                  <img
                    src={project.coverImageUrl}
                    alt=""
                    loading="lazy"
                    style={{
                      width: "100%",
                      maxHeight: 170,
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                )}

                <p className="eyebrow">
                  {project.status} {project.featured ? " / FEATURED" : ""}
                </p>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                <p className="field-hint">
                  /projects/{project.slug} · Order: {project.sortOrder}
                </p>

                <div className="form-row">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => {
                      setForm(toForm(project));
                      setEditingId(project.id);
                      setError("");
                      setMessage("");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => void remove(project)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
