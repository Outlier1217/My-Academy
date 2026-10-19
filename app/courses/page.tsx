import Link from "next/link";
import { db } from "@/lib/prisma";

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
    <main className="min-h-screen bg-gray-50 px-4 py-12 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">
            Outlier Academy
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Explore Courses
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Learn mathematics, finance, programming and technology with
            courses from Outlier Academy.
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <h2 className="text-xl font-bold">Courses are coming soon</h2>
            <p className="mt-2 text-gray-600">
              Published courses will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
              >
                {course.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.coverImageUrl}
                    alt={course.title}
                    className="aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-indigo-50 text-indigo-600">
                    <span className="text-lg font-bold">Outlier Academy</span>
                  </div>
                )}

                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    {course.subject.replaceAll("_", " ")}
                  </p>
                  <h2 className="mt-2 text-xl font-bold group-hover:text-indigo-700">
                    {course.title}
                  </h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                    {course.excerpt}
                  </p>
                  <span className="mt-5 inline-flex font-semibold text-indigo-600">
                    View course <span className="ml-2">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}