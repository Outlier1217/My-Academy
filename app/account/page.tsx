
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getAuthenticatedUserId } from "@/lib/auth";
import { db } from "@/lib/prisma";
import AccountDashboard from "@/components/AccountDashboard";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      profileImageUrl: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <Navbar />

      <main className="login-shell">
        <section className="login-card account-page-card">
          <p className="eyebrow">OUTLIER ACADEMY · YOUR ACCOUNT</p>

          <div className="account-profile-heading">
            {user.profileImageUrl ? (
              <Image
                src={user.profileImageUrl}
                alt={`${user.name}'s profile`}
                width={92}
                height={92}
                unoptimized
                className="account-profile-photo"
              />
            ) : (
              <span className="account-profile-placeholder" aria-hidden="true">
                {user.name.trim().charAt(0).toUpperCase() || "♙"}
              </span>
            )}

            <div>
              <h1>{user.name}</h1>
              <p className="muted-copy">Outlier Academy member</p>
            </div>
          </div>

          <div className="account-details">
            <div>
              <span className="eyebrow">FULL NAME</span>
              <strong>{user.name}</strong>
            </div>

            <div>
              <span className="eyebrow">EMAIL ADDRESS</span>
              <strong>{user.email}</strong>
            </div>

            <div>
              <span className="eyebrow">MEMBER SINCE</span>
              <strong>
                {user.createdAt.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "Asia/Kolkata",
                })}
              </strong>
            </div>
          </div>
          <AccountDashboard />

          <p className="login-footnote">
            Your account details are private to your signed-in session.
          </p>

          <Link href="/" className="button button-primary account-home-link">
            Back to Academy <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </main>

      <Footer />
    </>
  );
}
