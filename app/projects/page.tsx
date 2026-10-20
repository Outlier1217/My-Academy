
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Projects | Outlier Academy",
  description:
    "Explore real-world projects built with web development, AI, machine learning and blockchain technology.",
};

export default async function ProjectsPage() {
  const projects = await db.project.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [
      { featured: "desc" },
      { sortOrder: "asc" },
      { publishedAt: "desc" },
    ],
    select: {
      title: true,
      slug: true,
      tagline: true,
      summary: true,
      coverImageUrl: true,
      techStack: true,
      featured: true,
      demoUrl: true,
      repoUrl: true,
    },
  });

  return (
    <>
      <Navbar />

      <main className="page-shell projects-page">
        <section className="section-heading">
          <p className="eyebrow">OUTLIER ACADEMY / PROJECT LAB</p>
          <h1>Ideas turned into real projects.</h1>
          <p>
            Explore practical projects across web development, AI, machine
            learning, finance and blockchain.
          </p>
        </section>

        {projects.length === 0 ? (
          <section className="admin-panel">
            <h2>Projects coming soon</h2>
            <p>New projects will appear here after they are published.</p>
          </section>
        ) : (
          <section className="project-grid">
            {projects.map((project) => (
              <article className="project-card" key={project.slug}>
                <Link
                  href={`/projects/${project.slug}`}
                  className="project-cover"
                  aria-label={`View ${project.title}`}
                >
                  {project.coverImageUrl.startsWith("/") ? (
                    <Image
                      src={project.coverImageUrl}
                      alt={project.title}
                      width={1200}
                      height={675}
                      sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 600px"
                      className="project-image"
                    />
                  ) : (
                    <img
                      src={project.coverImageUrl}
                      alt={project.title}
                      className="project-image"
                      loading="lazy"
                    />
                  )}
                </Link>

                <div className="project-card-body">
                  {project.featured && (
                    <p className="eyebrow">FEATURED PROJECT</p>
                  )}

                  <h2>
                    <Link href={`/projects/${project.slug}`}>
                      {project.title}
                    </Link>
                  </h2>

                  <p className="project-tagline">{project.tagline}</p>
                  <p>{project.summary}</p>

                  {project.techStack.length > 0 && (
                    <div className="project-tags">
                      {project.techStack.map((tech) => (
                        <span key={tech}>{tech}</span>
                      ))}
                    </div>
                  )}

                  <div className="project-actions">
                    <Link
                      href={`/projects/${project.slug}`}
                      className="button button-primary"
                    >
                      View project →
                    </Link>

                    {project.demoUrl && (
                      <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button button-secondary"
                      >
                        Live demo ↗
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
