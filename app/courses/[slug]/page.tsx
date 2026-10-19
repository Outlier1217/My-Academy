
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/prisma";

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

    if (!["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) {
      return null;
    }

    const videoId =
      url.searchParams.get("v") ||
      url.pathname.match(/^\/(?:embed|shorts)\/([A-Za-z0-9_-]{11})/)?.[1];

    if (videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId)) {
      return `https://www.youtube-nocookie.com/embed/${videoId}`;
    }

    const playlistId = url.searchParams.get("list");
    if (playlistId && /^[A-Za-z0-9_-]+$/.test(playlistId)) {
      return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(playlistId)}`;
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

  if (!course) notFound();

  const embedUrl = getYouTubeEmbedUrl(course.youtubeUrl);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900 sm:px-6">
      <article className="mx-auto max-w-5xl">
        <Link
          href="/courses"
          className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          ← All courses
        </Link>

        {course.coverImageUrl && (
          <div className="mt-6 overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={course.coverImageUrl}
              alt={course.title}
              className="max-h-[440px] w-full object-cover"
            />
          </div>
        )}

        <div className="mt-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">
            {course.subject.replaceAll("_", " ")}
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
            {course.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-gray-600">
            {course.excerpt}
          </p>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-black shadow-sm">
          {embedUrl ? (
            <div className="aspect-video">
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
            <div className="bg-white p-6 text-gray-700">
              <p className="font-semibold">Video could not be embedded.</p>
              <p className="mt-2 text-sm">
                Please check the YouTube URL in Courses Studio and confirm
                that embedding is enabled for this video.
              </p>
            </div>
          )}
        </section>

        {course.body && (
          <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold">About this course</h2>
            <div className="mt-4 whitespace-pre-wrap leading-8 text-gray-700">
              {course.body}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
