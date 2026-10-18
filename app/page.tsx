import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContentCard from "@/components/ContentCard";
import { getPublishedContent } from "@/lib/content";

const LEARNING_PATHS = [
  { n: "01", title: "Finance & certifications", copy: "Prepare for NISM and NCFM, then deepen your understanding of markets and risk.", href: "/mock-tests", label: "Explore finance", icon: "↗" },
  { n: "02", title: "AI & machine learning", copy: "Move from the math behind a model to the systems that make it useful.", href: "/articles", label: "Read articles", icon: "⌘" },
  { n: "03", title: "Blockchain & DeFi", copy: "Understand protocols, on-chain systems and decentralized finance from first principles.", href: "/blogs", label: "Read the journal", icon: "◇" },
  { n: "04", title: "Mathematics", copy: "Explore concepts through interactive simulations, not memorization alone.", href: "/math", label: "Enter the math lab", icon: "∑" },
];

export default async function HomePage() {
  const recent = await getPublishedContent({ take: 3 });
  return <><Navbar />
    <main>
      <section className="hero-section">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-kicker reveal" data-reveal><span className="status-dot" /> INDEPENDENT LEARNING LAB <span className="kicker-rule" /> FARIDABAD, INDIA</div>
          <h1 className="hero-title reveal" data-reveal>Learn deeply.<br /><em>Think differently.</em><br />Build what matters.</h1>
          <p className="hero-description reveal" data-reveal>Outlier Academy is a home for curious minds — from finance and mathematics to AI, blockchain and the ideas connecting them.</p>
          <div className="hero-actions reveal" data-reveal><Link href="/articles" className="button button-primary">Start exploring <span aria-hidden="true">↗</span></Link><Link href="#learning-paths" className="button button-ghost">Find your path <span aria-hidden="true">↓</span></Link></div>
          <div className="hero-footnote reveal" data-reveal><span>01 — READ</span><span>02 — EXPERIMENT</span><span>03 — APPLY</span></div>
        </div>
        <div className="hero-art reveal" data-reveal aria-label="A visual map of ideas feeding into an outlier mindset">
          <div className="orbit orbit-one" data-parallax="0.025" /><div className="orbit orbit-two" data-parallax="-0.02" /><div className="orbit orbit-three" data-parallax="0.015" />
          <div className="art-node node-math">∑<small>MATHEMATICS</small></div><div className="art-node node-ai">⌘<small>AI / ML</small></div><div className="art-node node-finance">↗<small>FINANCE</small></div><div className="art-node node-chain">◇<small>BLOCKCHAIN</small></div>
          <div className="art-core"><span>OUTLIER</span><strong>O<span>.</span></strong><small>ACADEMY</small></div>
          <div className="art-coordinates">IDEAS / 28.4089° N<br />KNOWLEDGE / 77.3178° E</div>
        </div>
        <div className="hero-bottom"><span>INDEPENDENT BY DESIGN</span><span>SCROLL TO EXPLORE ↓</span></div>
      </section>

      <section id="learning-paths" className="section-shell learning-section">
        <div className="section-heading reveal" data-reveal><div><p className="eyebrow">A MAP FOR THE CURIOUS</p><h2>Choose a direction.<br /><em>Keep asking why.</em></h2></div><p>One place to read, practice and connect ideas across disciplines. Start with a question; follow it further than the syllabus.</p></div>
        <div className="path-grid">{LEARNING_PATHS.map((path) => <article className="path-card reveal" data-reveal key={path.n}><div className="path-top"><span className="path-number">{path.n} / PATH</span><span className="path-icon">{path.icon}</span></div><h3>{path.title}</h3><p>{path.copy}</p><Link href={path.href}>{path.label} <span aria-hidden="true">→</span></Link></article>)}</div>
      </section>

      <section className="manifesto-section"><div className="manifesto-inner reveal" data-reveal><p className="eyebrow">THE OUTLIER WAY</p><blockquote>“Understanding begins when you stop asking <em>what to remember</em> and start asking <em>how it works.</em>”</blockquote><div className="manifesto-signature"><span className="signature-mark">O.</span><span><strong>Mustak Aalam</strong><small>Founder · Outlier Academy</small></span></div></div><div className="manifesto-aside" aria-hidden="true">THINK<br />BEYOND<br /><em>THE OBVIOUS.</em></div></section>

      <section className="section-shell latest-section"><div className="section-heading reveal" data-reveal><div><p className="eyebrow">FRESH FROM THE STUDIO</p><h2>Ideas in motion.</h2></div><Link href="/articles" className="text-link">Explore the library ↗</Link></div>
        {recent.length ? <div className="content-grid">{recent.map((item) => <ContentCard key={item.id} item={item} />)}</div> : <div className="publish-preview reveal" data-reveal><div className="publish-preview-mark">✳</div><div><p className="eyebrow">YOUR IDEAS, YOUR PLATFORM</p><h3>The first article is yours to publish.</h3><p>Use the content studio to add your articles, blogs, stories and subject-wise mock tests. Published work appears here automatically.</p><Link href="/admin/login" className="text-link">Open content studio ↗</Link></div><div className="publish-code">CONTENT<br /><span>→</span> POSTGRESQL<br /><span>→</span> KNOWLEDGE</div></div>}
      </section>

      <section className="profile-section"><div className="profile-copy reveal" data-reveal><p className="eyebrow">BUILT IN THE OPEN</p><h2>Curiosity is better<br />when it is <em>shared.</em></h2><p>I'm Mustak — a mathematics graduate, educator and builder exploring the meeting point of finance, software and emerging technology.</p><Link href="https://github.com/Outlier1217" target="_blank" rel="noreferrer noopener" className="button button-secondary">Follow the work on GitHub ↗</Link></div><div className="profile-links reveal" data-reveal><a href="https://github.com/Outlier1217" target="_blank" rel="noreferrer noopener"><span>01</span><strong>GitHub</strong><small>Code & experiments</small><b>↗</b></a><a href="https://www.linkedin.com/in/mustak1217" target="_blank" rel="noreferrer noopener"><span>02</span><strong>LinkedIn</strong><small>Professional journey</small><b>↗</b></a><a href="https://quilvion.xyz/" target="_blank" rel="noreferrer noopener"><span>03</span><strong>Projects</strong><small>Quilvion & more</small><b>↗</b></a><a href="https://x.com/Mustak1217" target="_blank" rel="noreferrer noopener"><span>04</span><strong>X / Twitter</strong><small>Ideas in public</small><b>↗</b></a><a href="https://www.instagram.com/mustak_1217" target="_blank" rel="noreferrer noopener"><span>05</span><strong>Instagram</strong><small>Behind the scenes</small><b>↗</b></a><a href="https://t.me/Outlier_Lab/1" target="_blank" rel="noreferrer noopener"><span>06</span><strong>Telegram</strong><small>Outlier Lab community</small><b>↗</b></a></div></section>
    </main><Footer /></>;
}
