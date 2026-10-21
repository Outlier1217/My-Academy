"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContentCard from "@/components/ContentCard";
import type { ContentCardItem } from "@/lib/content";

const SUBJECTS = [
  ["ALL", "All subjects"],
  ["NISM", "NISM"],
  ["NCFM", "NCFM"],
  ["FINANCE", "Finance"],
  ["AI_ML", "AI / Machine Learning"],
  ["BLOCKCHAIN", "Blockchain"],
  ["DEFI", "DeFi"],
  ["MATHEMATICS", "Mathematics"],
  ["GENERAL", "General"],
];

export default function MockTestListingClient({
  items,
  initialSubject = "ALL",
}: {
  items: ContentCardItem[];
  initialSubject?: string;
}) {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState(initialSubject);
  const [selectedTestId, setSelectedTestId] = useState("");

  const normalizedQuery = query.trim().toLocaleLowerCase();

  const subjectItems = items.filter(
    (item) => subject === "ALL" || item.subject === subject
  );

  const filteredItems = subjectItems.filter((item) => {
    const matchesQuery = item.title
      .toLocaleLowerCase()
      .includes(normalizedQuery);

    const matchesSelectedTest =
      !selectedTestId || item.id === selectedTestId;

    return matchesQuery && matchesSelectedTest;
  });

  function clearFilters() {
    setQuery("");
    setSubject(initialSubject);
    setSelectedTestId("");
  }

  return (
    <>
      <Navbar />

      <main className="page-shell">
        <div className="page-intro reveal" data-reveal>
          <p className="eyebrow">THE PRACTICE LAB / MOCK TESTS</p>
          <h1>Practice until it clicks.</h1>
          <p className="page-description">
            Practice sets for NISM, NCFM, finance, AI and machine learning,
            blockchain, DeFi and mathematics. Results are checked server-side.
          </p>
        </div>

        <section className="mock-test-filters" aria-label="Search mock tests">
          <label className="mock-test-search">
            <span className="mock-test-filter-label">Search by title</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search practice tests by title..."
              autoComplete="off"
            />
          </label>

          <label>
            <span className="mock-test-filter-label">Subject</span>
            <select
              value={subject}
              onChange={(event) => {
                setSubject(event.target.value);
                setSelectedTestId("");
              }}
            >
              {SUBJECTS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mock-test-filter-label">Test title</span>
            <select
              value={selectedTestId}
              onChange={(event) => setSelectedTestId(event.target.value)}
            >
              <option value="">All test titles</option>
              {subjectItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>

          <div className="mock-test-filter-footer">
            <p aria-live="polite">
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "result" : "results"} found
            </p>

            {(query ||
              selectedTestId ||
              subject !== initialSubject) && (
              <button
                type="button"
                className="text-link"
                onClick={clearFilters}
              >
                Clear search
              </button>
            )}
          </div>
        </section>

        {filteredItems.length > 0 ? (
          <section className="content-grid" aria-label="Mock test results">
            {filteredItems.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </section>
        ) : (
          <section className="empty-state reveal">
            <div className="empty-icon" aria-hidden="true">
              ⌕
            </div>
            <h2>No mock tests found.</h2>
            <p>Try another test title or choose a different subject.</p>
            <button
              type="button"
              className="button button-secondary"
              onClick={clearFilters}
            >
              Clear search
            </button>
            <Link href="/" className="text-link">
              Back to home <span aria-hidden="true">↗</span>
            </Link>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
