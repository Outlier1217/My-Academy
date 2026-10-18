import PublicContentListing from "@/components/PublicContentListing";
import type { Subject } from "@prisma/client";

export const dynamic = "force-dynamic";
const SUBJECTS: Subject[] = ["NISM", "NCFM", "FINANCE", "AI_ML", "BLOCKCHAIN", "DEFI", "MATHEMATICS"];
export default async function MockTestsPage({ searchParams }: { searchParams?: { subject?: string } }) {
  const rawSubject = searchParams?.subject?.toUpperCase();
  const subject = SUBJECTS.find((item) => item === rawSubject);
  return <PublicContentListing type="MOCK_TEST" title="Practice until it clicks." eyebrow="THE PRACTICE LAB / MOCK TESTS" description="Practice sets for NISM, NCFM, finance, AI and machine learning, blockchain, DeFi and mathematics. Results are checked server-side." subject={subject} />;
}
