import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeProvider";

const NAV_ITEMS = [
  { label: "Articles", href: "/articles" },
  { label: "Blogs", href: "/blogs" },
  { label: "Stories", href: "/stories" },
  { label: "Mock Tests", href: "/mock-tests" },
  { label: "Mathematics", href: "/math" },
];

export default function Navbar() {
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Main navigation">
        <Link href="/" className="brand" aria-label="Outlier Academy home">
          <span className="brand-mark">O<span>.</span></span>
          <span className="brand-name">Outlier <b>Academy</b></span>
        </Link>
        <div className="nav-links">
          {NAV_ITEMS.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </div>
        <div className="nav-actions">
          <ThemeToggle />
          <Link href="/admin/login" className="nav-admin">Admin <span aria-hidden="true">↗</span></Link>
        </div>
      </nav>
    </header>
  );
}
