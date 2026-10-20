
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props) {
  const project = await db.project.findFirst({
    where: { slug: params.slug, status: "PUBLISHED" },
    select: { title: true, summary: true },
  });

  if (!project) {
    return { title: "Project not found | Outlier Academy" };
  }

  return {
    title: `${project.title} | Outlier Academy Projects`,
    description: project.summary,
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const project = await db.project.findFirst({
    where: { slug: params.slug, status: "PUBLISHED" },
  });

  if (!project) notFound();

  return (
    <>
      <Navbar />

      <main className="page-shell project-detail">
        <Link href="/projects" className="text-link">
          ← All projects
        </Link>

        <header className="section-heading">
          {project.featured && (
            <p className="eyebrow">FEATURED PROJECT</p>
          )}
          <p className="eyebrow">OUTLIER ACADEMY / PROJECT LAB</p>
          <h1>{project.title}</h1>
          <p className="project-tagline">{project.tagline}</p>
          <p>{project.summary}</p>
        </header>

        <div className="project-detail-cover">
          {project.coverImageUrl.startsWith("/") ? (
            <Image
              src={project.coverImageUrl}
              alt={project.title}
              width={1600}
              height={900}
              sizes="(max-width: 900px) 100vw, 1200px"
              priority
              className="project-image"
            />
          ) : (
            <img
              src={project.coverImageUrl}
              alt={project.title}
              className="project-image"
            />
          )}
        </div>

        <section className="project-detail-content">
          <h2>About this project</h2>
          <div className="project-description">{project.description}</div>

          {project.techStack.length > 0 && (
            <>
              <h2>Technology stack</h2>
              <div className="project-tags">
                {project.techStack.map((tech) => (
                  <span key={tech}>{tech}</span>
                ))}
              </div>
            </>
          )}

          <div className="project-actions">
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary"
              >
                Open live demo ↗
              </a>
            )}

            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-secondary"
              >
                View GitHub repository ↗
              </a>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
