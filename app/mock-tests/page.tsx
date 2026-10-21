import type { Subject } from "@prisma/client";
import { getPublishedContent } from "@/lib/content";
import MockTestListingClient from "@/components/MockTestListingClient";

export const dynamic = "force-dynamic";

const SUBJECTS: Subject[] = [
  "NISM",
  "NCFM",
  "FINANCE",
  "AI_ML",
  "BLOCKCHAIN",
  "DEFI",
  "MATHEMATICS",
];

export default async function MockTestsPage({
  searchParams,
}: {
  searchParams?: { subject?: string };
}) {
  const rawSubject = searchParams?.subject?.toUpperCase();
  const subject = SUBJECTS.find((item) => item === rawSubject);

  const items = await getPublishedContent({
    type: "MOCK_TEST",
    subject,
    take: 60,
  });

  return (
    <MockTestListingClient
      items={items}
      initialSubject={subject ?? "ALL"}
    />
  );
}
