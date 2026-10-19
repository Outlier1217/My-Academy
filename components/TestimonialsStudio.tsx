
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Testimonial = {
  id: string;
  name: string;
  imageUrl: string;
  about: string;
  message: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
};

type Draft = {
  name: string;
  imageUrl: string;
  about: string;
  message: string;
  sortOrder: number;
  isPublished: boolean;
};

const EMPTY: Draft = {
  name: "",
  imageUrl: "",
  about: "",
  message: "",
  sortOrder: 0,
  isPublished: false,
};

export default function TestimonialsStudio() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadItems = useCallback(async () => {
    const response = await fetch("/api/admin/testimonials", { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to load success stories.");
    }

    setItems(data.testimonials);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/admin/testimonials", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load success stories.");
        }

        if (active) setItems(data.testimonials);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load stories.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function startEdit(item: Testimonial) {
    setEditingId(item.id);
    setDraft({
      name: item.name,
      imageUrl: item.imageUrl,
      about: item.about,
      message: item.message,
      sortOrder: item.sortOrder,
      isPublished: item.isPublished,
    });
    setError("");
    setNotice("");
  }

  
async function uploadCandidateImage(
  event: React.ChangeEvent<HTMLInputElement>
) {
  const input = event.currentTarget;
  const file = input.files?.[0];

  if (!file) return;

  setUploading(true);
  setError("");
  setNotice("");

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Image upload failed.");
    }

    if (typeof data.url !== "string") {
      throw new Error("The server did not return an image URL.");
    }

    update("imageUrl", data.url);
    setNotice("Candidate image uploaded successfully.");
  } catch (err) {
    setError(err instanceof Error ? err.message : "Image upload failed.");
  } finally {
    setUploading(false);
    input.value = "";
  }
}


  function resetForm() {
    setEditingId(null);
    setDraft(EMPTY);
    setError("");
    setNotice("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        editingId
          ? `/api/admin/testimonials/${encodeURIComponent(editingId)}`
          : "/api/admin/testimonials",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save success story.");
      }

      resetForm();
      setNotice(editingId ? "Success story updated." : "Success story created.");
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save success story.");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublish(item: Testimonial) {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/admin/testimonials/${encodeURIComponent(item.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublished: !item.isPublished }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to change publishing status.");
      }

      setNotice(item.isPublished ? "Story unpublished." : "Story published.");
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update story.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(item: Testimonial) {
    if (!window.confirm(`Delete the success story for ${item.name}? This cannot be undone.`)) {
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/admin/testimonials/${encodeURIComponent(item.id)}`,
        { method: "DELETE" }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete story.");
      }

      if (editingId === item.id) resetForm();
      setNotice("Success story deleted.");
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete story.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p>Loading success stories...</p>;

  return (
    <section className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Success Stories</h2>
        <p className="mt-1 text-sm opacity-70">
          Create candidate testimonials for the homepage. Only published stories appear publicly.
        </p>
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {notice && <p role="status" className="text-sm text-green-700">{notice}</p>}

      <form onSubmit={save} className="grid max-w-3xl gap-4 rounded-xl border border-current/15 p-5">
        <h3 className="text-lg font-semibold">
          {editingId ? "Edit success story" : "Add candidate story"}
        </h3>

        <label className="grid gap-1 text-sm">
          Candidate name
          <input
            className="rounded-lg border border-current/20 bg-transparent px-3 py-2"
            value={draft.name}
            onChange={(event) => update("name", event.target.value)}
            maxLength={100}
            required
          />
        </label>

        
<label className="grid gap-2 text-sm">
  Candidate image

  <span className="text-xs opacity-70">
    JPG, PNG, WEBP or GIF · Maximum 5 MB
  </span>

  <input
    type="file"
    accept="image/jpeg,image/png,image/webp,image/gif"
    onChange={uploadCandidateImage}
    disabled={uploading || busy}
    className="block w-full rounded-lg border border-current/20 bg-transparent p-3 text-sm"
  />

  {uploading && (
    <span role="status" className="text-sm opacity-70">
      Uploading image...
    </span>
  )}

  {draft.imageUrl && (
    <div className="mt-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={draft.imageUrl}
        alt="Candidate image preview"
        className="h-32 w-32 rounded-xl border border-current/10 object-cover"
      />

      <button
        type="button"
        className="button button-secondary mt-2"
        disabled={uploading || busy}
        onClick={() => update("imageUrl", "")}
      >
        Remove image
      </button>
    </div>
  )}

  {!draft.imageUrl && (
    <span className="text-xs opacity-70">
      Select a photo from your computer to upload it.
    </span>
  )}
</label>


        <label className="grid gap-1 text-sm">
          About the candidate
          <textarea
            className="rounded-lg border border-current/20 bg-transparent px-3 py-2"
            value={draft.about}
            onChange={(event) => update("about", event.target.value)}
            maxLength={1000}
            rows={3}
            required
          />
        </label>

        <label className="grid gap-1 text-sm">
          Candidate message / testimonial
          <textarea
            className="rounded-lg border border-current/20 bg-transparent px-3 py-2"
            value={draft.message}
            onChange={(event) => update("message", event.target.value)}
            maxLength={3000}
            rows={5}
            required
          />
        </label>

        <label className="grid gap-1 text-sm">
          Display order (smaller numbers appear first)
          <input
            className="rounded-lg border border-current/20 bg-transparent px-3 py-2"
            type="number"
            min={0}
            max={100000}
            value={draft.sortOrder}
            onChange={(event) => update("sortOrder", Number(event.target.value))}
            required
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.isPublished}
            onChange={(event) => update("isPublished", event.target.checked)}
          />
          Publish on homepage
        </label>

        <div className="flex flex-wrap gap-2">
          <button className="button button-primary" type="submit" disabled={busy}>
            {busy ? "Saving..." : editingId ? "Save changes" : "Create story"}
          </button>

          {editingId && (
            <button className="button button-secondary" type="button" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">All candidate stories ({items.length})</h3>

        {items.length === 0 ? (
          <p className="rounded-xl border border-current/10 p-5 text-sm opacity-70">
            No candidate stories yet. Create one above.
          </p>
        ) : (
          items.map((item) => (
            <article key={item.id} className="flex flex-col gap-4 rounded-xl border border-current/10 p-4 sm:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-24 w-24 rounded-xl border border-current/10 object-cover"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-semibold">{item.name}</h4>
                  <span className="rounded-full border border-current/15 px-2 py-1 text-xs">
                    {item.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="mt-1 text-sm opacity-70">{item.about}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm">{item.message}</p>
                <p className="mt-2 text-xs opacity-60">Display order: {item.sortOrder}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="button button-secondary" onClick={() => startEdit(item)}>
                    Edit
                  </button>
                  <button type="button" className="button button-secondary" disabled={busy} onClick={() => void togglePublish(item)}>
                    {item.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button type="button" className="button button-secondary" disabled={busy} onClick={() => void deleteItem(item)}>
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
