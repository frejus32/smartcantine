import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: { text: string; tone: "success" | "warning" | "danger" | "neutral" };
  tone?: "primary" | "success" | "warning" | "danger";
};

const TONE_STYLES = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-destructive-soft text-destructive",
} as const;

export function KpiCard({ label, value, icon: Icon, delta, tone = "primary" }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-4 sm:p-6">
        <div className="space-y-1.5">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {label}
          </p>
          <p className="text-[32px] leading-10 font-bold tabular-nums">{value}</p>
          {delta ? (
            <Badge
              variant={
                delta.tone === "neutral"
                  ? "neutral"
                  : delta.tone === "danger"
                    ? "danger"
                    : delta.tone
              }
            >
              {delta.text}
            </Badge>
          ) : null}
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-md",
            TONE_STYLES[tone],
          )}
        >
          <Icon className="size-5" aria-hidden />
        </div>
      </CardContent>
    </Card>
  );
}
