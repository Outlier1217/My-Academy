
"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function JoinPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handlePhotoChange(file: File | null) {
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : "");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      let profileImageUrl = "";

      if (photo) {
        const formData = new FormData();
        formData.append("file", photo);

        const uploadResponse = await fetch("/api/auth/profile-image", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || "Image upload failed.");
        }

        profileImageUrl = uploadData.url;
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
          profileImageUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create your account.");
      }

      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="login-shell">
        <section className="login-card">
          <p className="eyebrow">OUTLIER ACADEMY · MEMBERSHIP</p>
          <h1>Join the community.</h1>
          <p className="muted-copy">
            Create your account to make your learning experience personal.
          </p>

          <form className="admin-login-form" onSubmit={handleSubmit}>
            <div className="profile-upload">
              <button
                type="button"
                className="profile-photo-button"
                onClick={() => fileRef.current?.click()}
                aria-label="Choose a profile photo"
              >
                {preview ? (
                  <Image
                    src={preview}
                    alt="Profile preview"
                    width={88}
                    height={88}
                    unoptimized
                    className="profile-photo-preview"
                  />
                ) : (
                  <span className="profile-default-icon" aria-hidden="true">
                    ♙
                  </span>
                )}
              </button>

              <div>
                <strong>Profile photo</strong>
                <p className="field-hint">Optional · JPG, PNG or GIF · Max 5 MB</p>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => fileRef.current?.click()}
                >
                  Choose image
                </button>
                {photo && (
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => {
                      handlePhotoChange(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif"
                hidden
                onChange={(event) =>
                  handlePhotoChange(event.target.files?.[0] ?? null)
                }
              />
            </div>

            <label>
              Full name
              <input
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                minLength={2}
                maxLength={100}
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>

            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                maxLength={254}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                minLength={8}
                maxLength={72}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <label>
              Confirm password
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Enter password again"
                minLength={8}
                maxLength={72}
                required
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
              />
            </label>

            {error && <p className="form-error" role="alert">{error}</p>}

            <button
              className="button button-primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Join Now"}
            </button>
          </form>

          <p className="login-footnote">
            Already have an account?{" "}
            <Link className="text-link" href="/login">
              Login
            </Link>
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
