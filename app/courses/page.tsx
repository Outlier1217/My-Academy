
import Link from "next/link";
import { db } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const courses = await db.contentItem.findMany({
    where: {
      type: "COURSE",
      status: "PUBLISHED",
    },
    orderBy: [
      { featured: "desc" },
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      title: true,
      slug: true,
      subject: true,
      excerpt: true,
      coverImageUrl: true,
    },
  });

  return (
    <>
      <Navbar />

      <main className="page-shell">
        <div className="page-intro">
          <p className="eyebrow">OUTLIER ACADEMY</p>

          <h1>Explore Courses</h1>

          <p className="page-description">
            Learn mathematics, finance, programming and technology
            with courses from Outlier Academy.
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">✳</span>

            <h2>Courses are coming soon</h2>

            <p>
              We are preparing learning experiences for curious minds.
              Published courses will appear here.
            </p>
          </div>
        ) : (
          <div className="content-grid">
            {courses.map((course) => (
              <article className="content-card" key={course.id}>
                <Link
                  href={`/courses/${course.slug}`}
                  aria-label={`View course: ${course.title}`}
                >
                  {course.coverImageUrl ? (
                    <div className="content-cover">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={course.coverImageUrl}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="content-cover content-cover-course">
                      <span>OUTLIER ACADEMY · COURSE</span>
                    </div>
                  )}
                </Link>

                <div className="content-card-body">
                  <div className="eyebrow-row">
                    <span className="eyebrow-pill">
                      {course.subject.replaceAll("_", " ")}
                    </span>

                    <span className="content-kind">Course</span>
                  </div>

                  <h3>
                    <Link href={`/courses/${course.slug}`}>
                      {course.title}
                    </Link>
                  </h3>

                  <p>{course.excerpt}</p>

                  <div className="content-card-meta">
                    <span>OUTLIER ACADEMY</span>

                    <Link href={`/courses/${course.slug}`}>
                      View course →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
