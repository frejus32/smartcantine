#!/bin/sh
# =============================================================================
# SmartCantine — Test de concurrence réelle (Sprint 3A).
# 8 connexions PostgreSQL simultanées scannent LE MÊME élève au même instant.
# Attendu : exactement 1 verdict vert, 7 rouges "deja_servi", 1 seul passage,
# solde décrémenté d'exactement 1. Usage : sh concurrence_test.sh <db>
# =============================================================================
set -e
DB="${1:-smartcantine_test}"

AGENT_ID=$(psql -U postgres -d "$DB" -At -c "select id from auth.users where email='agent@colibris.ci'")
ELEVE_ID=$(psql -U postgres -d "$DB" -At -c "select id from public.eleves where matricule='COL-0104'")

# Crédit initial de 5 repas (par le responsable), solde de référence.
psql -U postgres -d "$DB" -q -c "
  select set_config('request.jwt.claims',
    json_build_object('sub', (select id from auth.users where email='responsable@colibris.ci'),
                      'role','authenticated')::text, false),
         set_config('role','authenticated', false);
  select public.crediter_carnet('$ELEVE_ID', 5);"

SOLDE_AVANT=$(psql -U postgres -d "$DB" -At -c "select coalesce(sum(quantite),0) from public.mouvements_repas where eleve_id='$ELEVE_ID'")

# 8 scans strictement parallèles du même élève.
rm -f /tmp/verdicts.txt
for i in 1 2 3 4 5 6 7 8; do
  psql -U postgres -d "$DB" -At -c "
    select set_config('request.jwt.claims',
      json_build_object('sub','$AGENT_ID','role','authenticated')::text, false),
           set_config('role','authenticated', false);
    select public.enregistrer_passage('$ELEVE_ID') ->> 'verdict';" \
    | tail -1 >> /tmp/verdicts.txt &
done
wait

VERTS=$(grep -c '^vert$' /tmp/verdicts.txt || true)
ROUGES=$(grep -c '^rouge$' /tmp/verdicts.txt || true)
PASSAGES=$(psql -U postgres -d "$DB" -At -c "select count(*) from public.passages where eleve_id='$ELEVE_ID' and date_service=current_date and statut<>'annule'")
SOLDE_APRES=$(psql -U postgres -d "$DB" -At -c "select coalesce(sum(quantite),0) from public.mouvements_repas where eleve_id='$ELEVE_ID'")

echo "verdicts: $VERTS vert / $ROUGES rouge — passages actifs: $PASSAGES — solde: $SOLDE_AVANT -> $SOLDE_APRES"

[ "$VERTS" = "1" ]    || { echo "ECHEC : $VERTS verdicts verts (attendu 1)"; exit 1; }
[ "$ROUGES" = "7" ]   || { echo "ECHEC : $ROUGES rouges (attendu 7)"; exit 1; }
[ "$PASSAGES" = "1" ] || { echo "ECHEC : $PASSAGES passages (attendu 1)"; exit 1; }
[ "$((SOLDE_AVANT - SOLDE_APRES))" = "1" ] || { echo "ECHEC : solde decremente de $((SOLDE_AVANT - SOLDE_APRES))"; exit 1; }

echo "=== CONCURRENCE : LA REGLE D'OR TIENT SOUS 8 SCANS SIMULTANES ==="
