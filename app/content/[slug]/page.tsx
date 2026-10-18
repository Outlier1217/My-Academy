import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MockTestRunner from "@/components/MockTestRunner";
import { db } from "@/lib/prisma";
import { readMockTest, toPublicQuestions } from "@/lib/questions";

export const dynamic = "force-dynamic";
const subjectLabel: Record<string, string> = { NISM: "NISM", NCFM: "NCFM", FINANCE: "Finance", AI_ML: "AI / Machine Learning", BLOCKCHAIN: "Blockchain Technology", DEFI: "DeFi", MATHEMATICS: "Mathematics", GENERAL: "General" };

export default async function ContentDetailPage({ params }: { params: { slug: string } }) {
  const item = await db.contentItem.findFirst({ where: { slug: params.slug, status: "PUBLISHED" } }).catch(() => null);
  if (!item) notFound();
  const mockTest = readMockTest(item.questions);
  const isTest = item.type === "MOCK_TEST";
  const collectionHref = isTest ? "/mock-tests" : item.type === "ARTICLE" ? "/articles" : item.type === "BLOG" ? "/blogs" : "/stories";
  const collectionLabel = isTest ? "mock tests" : item.type === "ARTICLE" ? "articles" : item.type === "BLOG" ? "blogs" : "stories";
  return <><Navbar /><main className="detail-shell">
    <Link href={collectionHref} className="back-link">← Back to {collectionLabel}</Link>
    <article className="detail-article">
      <div className="detail-meta"><span className="eyebrow-pill">{subjectLabel[item.subject] ?? item.subject}</span><span>{item.type.replace("_", " ")}</span><span>{isTest ? `${item.durationMinutes ?? "—"} minutes` : `${item.readingMinutes ?? "—"} min read`}</span></div>
      <h1>{item.title}</h1><p className="detail-excerpt">{item.excerpt}</p>
      {item.coverImageUrl && <img className="detail-cover" src={item.coverImageUrl} alt="" />}
      {isTest ? (
  <MockTestRunner
    slug={item.slug}
    questions={toPublicQuestions(item.questions)}
    durationMinutes={item.durationMinutes}
    settings={{
      ...mockTest.settings,
      durationMinutes:
        item.durationMinutes ?? mockTest.settings.durationMinutes,
    }}
  />
) : (
  <div className="markdown-body">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {item.body}
    </ReactMarkdown>
  </div>
)}
      {item.tags.length > 0 && <div className="tag-list" aria-label="Tags">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
    </article>
  </main><Footer /></>;
}
