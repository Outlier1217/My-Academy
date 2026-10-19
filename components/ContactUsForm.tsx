
"use client";

import { useEffect, useState, type FormEvent } from "react";

type CurrentUser = {
  name: string;
  email: string;
};

export default function ContactUsForm() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!active || !data.user) return;

        setUser(data.user);
        setName(data.user.name);
        setEmail(data.user.email);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to submit your message.");
      }

      setMessage("");
      setStatus("Thanks! Your message has been received.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="w-full max-w-xl">
      <h2 className="text-lg font-semibold">Contact Us</h2>
      <p className="mt-2 text-sm opacity-70">
        Have a question or suggestion? Send us a message.
      </p>

      <p className="mt-3 text-sm">
        Email:{" "}
        <a
          className="underline underline-offset-4"
          href="mailto:mustakaalam10@gmail.com"
        >
          mustakaalam10@gmail.com
        </a>
      </p>

      <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
        <label className="grid gap-1 text-sm">
          Name
          <input
            className="w-full rounded-lg border border-current/20 bg-transparent px-3 py-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            required
            disabled={Boolean(user)}
            autoComplete="name"
          />
        </label>

        <label className="grid gap-1 text-sm">
          Email
          <input
            className="w-full rounded-lg border border-current/20 bg-transparent px-3 py-2"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={254}
            required
            disabled={Boolean(user)}
            autoComplete="email"
          />
        </label>

        <label className="grid gap-1 text-sm">
          Message
          <textarea
            className="w-full rounded-lg border border-current/20 bg-transparent px-3 py-2"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            minLength={1}
            maxLength={5000}
            rows={4}
            required
          />
        </label>

        <button
          className="button button-primary justify-self-start"
          type="submit"
          disabled={busy}
        >
          {busy ? "Sending..." : "Send message"}
        </button>

        {status && (
          <p role="status" aria-live="polite" className="text-sm">
            {status}
          </p>
        )}
      </form>
    </section>
  );
}
