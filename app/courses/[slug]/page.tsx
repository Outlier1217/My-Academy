
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContentActions from "@/components/ContentActions";
import CourseReviews from "@/components/CourseReviews";

export const dynamic = "force-dynamic";

function getYouTubeEmbedUrl(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];

      if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) {
        return `https://www.youtube-nocookie.com/embed/${id}`;
      }

      return null;
    }

    if (
      ![
        "youtube.com",
        "m.youtube.com",
        "youtube-nocookie.com",
      ].includes(host)
    ) {
      return null;
    }

    const videoId =
      url.searchParams.get("v") ||
      url.pathname.match(
        /^\/(?:embed|shorts)\/([A-Za-z0-9_-]{11})/
      )?.[1];

    if (videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId)) {
      return `https://www.youtube-nocookie.com/embed/${videoId}`;
    }

    const playlistId = url.searchParams.get("list");

    if (playlistId && /^[A-Za-z0-9_-]+$/.test(playlistId)) {
      return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(
        playlistId
      )}`;
    }

    return null;
  } catch {
    return null;
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const course = await db.contentItem.findFirst({
    where: {
      slug: params.slug,
      type: "COURSE",
      status: "PUBLISHED",
    },
  });

  if (!course) {
    notFound();
  }

  const embedUrl = getYouTubeEmbedUrl(course.youtubeUrl);

  return (
    <>
      <Navbar />

      <main className="detail-shell">
        <article className="detail-article">
          <Link href="/courses" className="back-link">
            ← All courses
          </Link>

          <div className="detail-meta">
            <span className="eyebrow-pill">
              {course.subject.replaceAll("_", " ")}
            </span>

            <span>OUTLIER ACADEMY</span>
          </div>

          <h1>{course.title}</h1>

          <p className="detail-excerpt">{course.excerpt}</p>
          <ContentActions
  contentId={course.id}
  title={course.title}
  slug={course.slug}
  href={`/courses/${course.slug}`}
/>

          {course.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.coverImageUrl}
              alt={course.title}
              className="detail-cover"
            />
          )}

          <section className="course-player">
            <div className="course-player-heading">
              <p className="eyebrow">WATCH & LEARN</p>
              <h2>Course video</h2>
            </div>

            {embedUrl ? (
              <div className="course-video-frame">
                <iframe
                  src={embedUrl}
                  title={`${course.title} — course video`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="notice">
                <p>
                  The video could not be embedded. Please check the
                  YouTube URL in Courses Studio and ensure embedding
                  is enabled for this video.
                </p>
              </div>
            )}
          </section>

          {course.body && (
            <section className="course-about">
              <p className="eyebrow">COURSE OVERVIEW</p>

              <h2>About this course</h2>

              <div className="markdown-body whitespace-pre-wrap">
                {course.body}
              </div>
            </section>
          )}

          <CourseReviews slug={course.slug} />

          <div className="course-back-action">
            <Link href="/courses" className="button button-ghost">
              ← Explore more courses
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}
