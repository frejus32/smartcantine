import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_SCANS } from "@/lib/mock/data";
import { getInitials } from "@/utils/initials";

const VERDICT_BADGE = {
  vert: { label: "Servi", variant: "success" as const },
  rouge: { label: "Refusé", variant: "danger" as const },
  orange: { label: "À régulariser", variant: "warning" as const },
};

export function ActiviteRecente() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité récente</CardTitle>
        <Badge variant="neutral">Service de 11h30</Badge>
      </CardHeader>
      <CardContent className="divide-y">
        {MOCK_SCANS.map((scan) => {
          const verdict = VERDICT_BADGE[scan.verdict];
          const nomComplet = scan.eleve.prenoms + " " + scan.eleve.nom;
          return (
            <div key={scan.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Avatar className="size-9">
                <AvatarFallback className="text-xs">{getInitials(nomComplet)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{nomComplet}</p>
                <p className="text-muted-foreground truncate text-xs">{scan.detail}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge variant={verdict.variant}>{verdict.label}</Badge>
                <span className="text-muted-foreground text-xs tabular-nums">{scan.heure}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
