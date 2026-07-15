import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { CalendarView } from "@/features/calendar/calendar-view";

export const metadata: Metadata = { title: "Calendrier" };

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        title="Calendrier scolaire"
        description="Les quotas mensuels sont calculés automatiquement à partir des jours d'ouverture."
      />
      <CalendarView />
    </>
  );
}
