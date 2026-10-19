import Link from "next/link";
import type { ContentCardItem } from "@/lib/content";
import ContentActions from "@/components/ContentActions";

const SUBJECT_LABELS: Record<string, string> = {
  NISM: "NISM", NCFM: "NCFM", FINANCE: "Finance", AI_ML: "AI / Machine Learning",
  BLOCKCHAIN: "Blockchain", DEFI: "DeFi", MATHEMATICS: "Mathematics", GENERAL: "General",
};

export default function ContentCard({ item }: { item: ContentCardItem }) {
  const isTest = item.type === "MOCK_TEST";
  return (
    <article className="content-card reveal" data-reveal>
      {item.coverImageUrl ? <div className="content-cover" style={{ backgroundImage: `linear-gradient(180deg, transparent, var(--cover-shade)), url(${JSON.stringify(item.coverImageUrl).slice(1, -1)})` }} aria-hidden="true" /> : <div className={`content-cover content-cover-${item.type.toLowerCase()}`} aria-hidden="true"><span>{isTest ? "01 / 20" : item.type === "STORY" ? "FIELD NOTES" : item.subject.replace("_", " ")}</span></div>}
      <div className="content-card-body">
        <div className="eyebrow-row">
          <span className="eyebrow-pill">{SUBJECT_LABELS[item.subject] ?? item.subject}</span>
          <span className="content-kind">{isTest ? "Mock test" : item.type.toLowerCase()}</span>
        </div>
        <h3><Link href={`/content/${item.slug}`}>{item.title}</Link></h3>
        <p>{item.excerpt}</p>
        <div className="content-card-meta">
          <ContentActions
  contentId={item.id}
  title={item.title}
  slug={item.slug}
/>
          <span>{isTest ? `${item.durationMinutes ?? "—"} min` : `${item.readingMinutes ?? "—"} min read`}</span>
          <Link href={`/content/${item.slug}`} aria-label={`Open ${item.title}`}>Explore <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </article>
  );
}
