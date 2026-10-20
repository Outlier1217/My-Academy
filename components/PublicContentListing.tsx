
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContentCard from "@/components/ContentCard";
import { getPublishedContent, type ContentSort } from "@/lib/content";
import type { ContentType, Subject } from "@prisma/client";

const SUBJECTS: { value: Subject; label: string }[] = [
  { value: "NISM", label: "NISM" },
  { value: "NCFM", label: "NCFM" },
  { value: "FINANCE", label: "Finance" },
  { value: "AI_ML", label: "AI / Machine Learning" },
  { value: "BLOCKCHAIN", label: "Blockchain" },
  { value: "DEFI", label: "DeFi" },
  { value: "MATHEMATICS", label: "Mathematics" },
  { value: "GENERAL", label: "General" },
];

export default async function PublicContentListing({
  type,
  title,
  eyebrow,
  description,
  subject,
  query,
  sort = "newest",
}: {
  type: ContentType;
  title: string;
  eyebrow: string;
  description: string;
  subject?: Subject;
  query?: string;
  sort?: ContentSort;
}) {
  const items = await getPublishedContent({
    type,
    subject,
    query,
    sort,
  });

  const collectionPath =
    type === "MOCK_TEST"
      ? "/mock-tests"
      : type === "ARTICLE"
        ? "/articles"
        : "/blogs";

  const hasFilters = Boolean(
    query?.trim() || subject || sort !== "newest",
  );

  return (
    <>
      <Navbar />

      <main className="page-shell">
        <div className="page-intro reveal" data-reveal>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="page-description">{description}</p>
        </div>

        <section
          className="listing-tools"
          aria-label="Search and filter content"
        >
          <form
            action={collectionPath}
            method="get"
            className="listing-search-form"
          >
            <label className="listing-search">
              <span className="sr-only">
                Search {title.toLowerCase()}
              </span>

              <span
                className="listing-search-icon"
                aria-hidden="true"
              >
                ⌕
              </span>

              <input
                type="search"
                name="q"
                defaultValue={query ?? ""}
                placeholder={`Search ${title.toLowerCase()}...`}
                maxLength={120}
              />
            </label>

            <label className="listing-filter">
              <span>Subject</span>

              <select
                name="subject"
                defaultValue={subject ?? ""}
              >
                <option value="">All subjects</option>

                {SUBJECTS.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="listing-filter">
              <span>Sort by</span>

              <select
                name="sort"
                defaultValue={sort}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="title">Title A–Z</option>
              </select>
            </label>

            <button
              type="submit"
              className="button button-primary listing-search-button"
            >
              Search
            </button>

            {hasFilters && (
              <Link
                href={collectionPath}
                className="listing-clear"
              >
                Clear filters
              </Link>
            )}
          </form>

          <p className="listing-result-count">
            {items.length}{" "}
            {items.length === 1 ? "result" : "results"} found

            {query?.trim() && (
              <>
                {" "}for{" "}
                <strong>“{query.trim()}”</strong>
              </>
            )}
          </p>
        </section>

        {items.length > 0 ? (
          <section
            className="content-grid"
            aria-label={title}
          >
            {items.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
              />
            ))}
          </section>
        ) : (
          <section
            className="empty-state reveal"
            data-reveal
          >
            <div className="empty-icon" aria-hidden="true">
              ⌕
            </div>

            <h2>No matching results</h2>

            <p>
              Try another keyword or subject, or clear the
              filters to see all published content.
            </p>

            <Link
              href={collectionPath}
              className="text-link"
            >
              Clear search and filters{" "}
              <span aria-hidden="true">↗</span>
            </Link>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
