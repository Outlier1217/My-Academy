
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeProvider";

const NAV_ITEMS = [
  { label: "Articles", href: "/articles" },
  { label: "Blogs", href: "/blogs" },
  { label: "Stories", href: "/stories" },
  { label: "Mock Tests", href: "/mock-tests" },
  { label: "Mathematics", href: "/math" },
  { label: "Courses", href: "/courses" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
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

          <Link href="/admin/login" className="nav-admin">
            Admin <span aria-hidden="true">↗</span>
          </Link>

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

          <Link
            href="/admin/login"
            className="mobile-admin-link"
            tabIndex={menuOpen ? 0 : -1}
            onClick={closeMenu}
          >
            Admin Dashboard <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
