
"use client";

import { useCallback, useEffect, useState } from "react";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function ContactMessagesPanel() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    const response = await fetch("/api/admin/contact-messages", {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to load contact messages.");
    }

    setMessages(data.messages);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/admin/contact-messages", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load contact messages.");
        }

        if (active) setMessages(data.messages);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Something went wrong."
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
  }, []);

  async function toggleRead(message: ContactMessage) {
    setUpdatingId(message.id);
    setError("");

    try {
      const response = await fetch("/api/admin/contact-messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: message.id,
          isRead: !message.isRead,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update message.");
      }

      await loadMessages();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update message."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return <p className="text-sm opacity-70">Loading contact messages...</p>;
  }

  return (
    <section className="grid gap-5">
      <div>
        <h2 className="text-2xl font-semibold">Contact Messages</h2>
        <p className="mt-2 text-sm opacity-70">
          {messages.filter((message) => !message.isRead).length} unread ·{" "}
          {messages.length} messages
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {messages.length === 0 ? (
        <p className="rounded-xl border border-current/10 p-5 text-sm opacity-70">
          No contact messages received yet.
        </p>
      ) : (
        <div className="grid gap-4">
          {messages.map((message) => (
            <article
              key={message.id}
              className="rounded-xl border border-current/10 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    {message.name}
                    {!message.isRead && (
                      <span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                        Unread
                      </span>
                    )}
                  </h3>

                  <a
                    href={`mailto:${message.email}`}
                    className="mt-1 inline-block text-sm underline underline-offset-4"
                  >
                    {message.email}
                  </a>
                </div>

                <time className="text-xs opacity-60">
                  {new Date(message.createdAt).toLocaleString("en-IN")}
                </time>
              </div>

              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6">
                {message.message}
              </p>

              <button
                type="button"
                className="button button-secondary mt-4"
                onClick={() => void toggleRead(message)}
                disabled={updatingId === message.id}
              >
                {updatingId === message.id
                  ? "Updating..."
                  : message.isRead
                    ? "Mark as unread"
                    : "Mark as read"}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
