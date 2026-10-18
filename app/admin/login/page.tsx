import Link from "next/link";
import AdminLoginForm from "@/components/AdminLoginForm";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AdminLoginPage() {
  return <><Navbar /><main className="login-shell"><section className="login-card reveal is-visible"><p className="eyebrow">PRIVATE WORKSPACE</p><h1>Welcome back.</h1><p className="page-description">Sign in to manage articles, blogs, stories and practice tests.</p><AdminLoginForm /><p className="login-footnote">This area is only for the configured administrator. <Link href="/" className="text-link">Return to the academy ↗</Link></p></section></main><Footer /></>;
}
