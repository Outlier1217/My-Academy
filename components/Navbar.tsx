
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeProvider";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Articles", href: "/articles" },
  { label: "Blogs", href: "/blogs" },
  { label: "Stories", href: "/stories" },
  { label: "Mock Tests", href: "/mock-tests" },
  { label: "Projects", href: "/projects" },
  { label: "Courses", href: "/courses" },
];

type User = {
  id: string;
  name: string;
  email: string;
  profileImageUrl: string | null;
};

export default function Navbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });
        const data = await response.json();

        if (active && response.ok) {
          setUser(data.user ?? null);
        }
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setAuthChecked(true);
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      ) {
        setAccountOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountOpen(false);
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function closeMenu() {
    setMenuOpen(false);
  }

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      setUser(null);
      setAccountOpen(false);
      closeMenu();
      router.refresh();
    } catch {
      window.alert("Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Main navigation">
        <Link
          href="/"
          className="brand"
          aria-label="Outlier Academy home"
          onClick={closeMenu}
        >
          <span className="brand-mark">
            <Image
              src="/outlier_logo.png"
              alt=""
              width={40}
              height={40}
              priority
              className="h-10 w-10 object-contain"
            />
          </span>
          <span className="brand-name">
            Outlier <b>Academy</b>
          </span>
        </Link>

        <div className="nav-links desktop-nav-links">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="nav-actions">
          <ThemeToggle />

          {authChecked && !user && (
            <Link href="/join" className="nav-join">
              Join <span aria-hidden="true">↗</span>
            </Link>
          )}

          {user && (
            <div className="account-menu" ref={accountRef}>
              <button
                type="button"
                className="account-avatar-button"
                aria-label="Open account menu"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                onClick={() => setAccountOpen((open) => !open)}
              >
                {user.profileImageUrl ? (
                  <Image
                    src={user.profileImageUrl}
                    alt=""
                    width={40}
                    height={40}
                    unoptimized
                    className="account-avatar-image"
                  />
                ) : (
                  <span className="account-avatar-fallback" aria-hidden="true">
                    {user.name.trim().charAt(0).toUpperCase() || "♙"}
                  </span>
                )}
              </button>

              {accountOpen && (
                <div className="account-dropdown" role="menu">
                  <div className="account-dropdown-user">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>

                  <Link
                    href="/account"
                    role="menuitem"
                    onClick={() => setAccountOpen(false)}
                  >
                    My account <span aria-hidden="true">↗</span>
                  </Link>

                  <button
                    type="button"
                    role="menuitem"
                    disabled={loggingOut}
                    onClick={handleLogout}
                  >
                    {loggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className={`hamburger-icon ${menuOpen ? "is-open" : ""}`}>
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </nav>

      <div
        id="mobile-navigation"
        className={`mobile-nav-panel ${menuOpen ? "is-open" : ""}`}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div className="mobile-nav-links">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              tabIndex={menuOpen ? 0 : -1}
              onClick={closeMenu}
            >
              <span>{item.label}</span>
              <span aria-hidden="true">↗</span>
            </Link>
          ))}

          {authChecked && !user && (
            <>
              <Link
                href="/join"
                tabIndex={menuOpen ? 0 : -1}
                onClick={closeMenu}
              >
                <span>Join</span>
                <span aria-hidden="true">↗</span>
              </Link>
              <Link
                href="/login"
                tabIndex={menuOpen ? 0 : -1}
                onClick={closeMenu}
              >
                <span>Login</span>
                <span aria-hidden="true">↗</span>
              </Link>
            </>
          )}

          {user && (
            <>
              <Link
                href="/account"
                tabIndex={menuOpen ? 0 : -1}
                onClick={closeMenu}
              >
                <span>My account</span>
                <span aria-hidden="true">↗</span>
              </Link>
              <button
                type="button"
                tabIndex={menuOpen ? 0 : -1}
                disabled={loggingOut}
                onClick={handleLogout}
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
