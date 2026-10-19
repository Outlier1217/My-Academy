import Link from "next/link";
import ContactUsForm from "@/components/ContactUsForm";

export default function Footer() {
  return (
    <footer className="border-t border-current/10 px-6 py-12 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row">
        <div className="max-w-md">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Outlier Academy<span className="text-current/50">.</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-6 opacity-65">
            Learn deeply. Think differently. Explore finance, mathematics,
            artificial intelligence, blockchain and beyond.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <Link href="/articles">Articles</Link>
          <Link href="/blogs">Blogs</Link>
          <Link href="/stories">Stories</Link>
          <Link href="/mock-tests">Mock Tests</Link>
          <a href="https://github.com/Outlier1217" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-current/10 pt-8">
  <ContactUsForm />
</div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-current/10 pt-5 text-xs opacity-55">
        © {new Date().getFullYear()} Outlier Academy. All rights reserved.
      </div>
    </footer>
  );
}
