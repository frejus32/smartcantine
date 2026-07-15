import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { StudentsTable } from "@/features/students/students-table";

export const metadata: Metadata = { title: "Élèves" };

export default function StudentsPage() {
  return (
    <>
      <PageHeader
        title="Élèves"
        description="Inscriptions, soldes de repas et badges QR — 4 classes, année 2026-2027."
      />
      <StudentsTable />
    </>
  );
}
