import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContentCard from "@/components/ContentCard";
import { getPublishedContent } from "@/lib/content";
import type { ContentType, Subject } from "@prisma/client";

export default async function PublicContentListing({
  type, title, eyebrow, description, subject,
}: {
  type: ContentType; title: string; eyebrow: string; description: string; subject?: Subject;
}) {
  const items = await getPublishedContent({ type, subject, take: 60 });
  return (
    <>
      <Navbar />
      <main className="page-shell">
        <div className="page-intro reveal" data-reveal>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="page-description">{description}</p>
        </div>
        {items.length ? (
          <section className="content-grid" aria-label={title}>
            {items.map((item) => <ContentCard key={item.id} item={item} />)}
          </section>
        ) : (
          <section className="empty-state reveal" data-reveal>
            <div className="empty-icon" aria-hidden="true">✳</div>
            <h2>The next idea starts here.</h2>
            <p>This section is ready. New content will appear as soon as it is published from the Outlier Academy admin panel.</p>
            <Link href="/" className="text-link">Back to home <span aria-hidden="true">↗</span></Link>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
