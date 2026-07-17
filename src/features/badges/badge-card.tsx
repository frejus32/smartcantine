import { getInitials } from "@/utils/initials";

export type BadgeData = {
  id: string;
  matricule: string;
  nom: string;
  prenoms: string;
  classe: string;
  photo_path: string | null;
  qr: string;
};

/** Carte de badge officiel — format carte, optimisée pour l'impression A4. */
export function BadgeCard({
  badge,
  ecole,
  logoUrl,
}: {
  badge: BadgeData;
  ecole: string;
  logoUrl: string | null;
}) {
  const nomComplet = `${badge.prenoms} ${badge.nom}`;
  return (
    <div className="badge-card flex flex-col overflow-hidden rounded-lg border border-neutral-300 bg-white">
      <div className="flex items-center gap-2 bg-[#1E5AA8] px-3 py-2 text-white">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="size-6 rounded-sm bg-white object-contain" />
        ) : null}
        <span className="truncate text-[11px] font-bold">{ecole}</span>
      </div>
      <div className="flex gap-3 p-3">
        <div className="flex flex-col items-center gap-1">
          {badge.photo_path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/photo?path=${encodeURIComponent(badge.photo_path)}`}
              alt=""
              className="size-16 rounded-md border object-cover"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-md border bg-neutral-100 text-lg font-bold text-neutral-500">
              {getInitials(nomComplet)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-neutral-900">{nomComplet}</p>
          <p className="text-xs text-neutral-600">{badge.classe}</p>
          <p className="font-mono text-[11px] text-neutral-500">{badge.matricule}</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={badge.qr} alt="QR" className="size-16 shrink-0" />
      </div>
    </div>
  );
}
