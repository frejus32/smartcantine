import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/** Exports de rapports — Sprint 5. Formats PDF, Excel, CSV, côté client. */

function telecharger(blob: Blob, nom: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  a.click();
  URL.revokeObjectURL(url);
}

export type LigneTableau = Record<string, string | number>;

export function exporterCSV(lignes: LigneTableau[], nom: string) {
  const ws = XLSX.utils.json_to_sheet(lignes);
  const csv = XLSX.utils.sheet_to_csv(ws);
  telecharger(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${nom}.csv`);
}

export function exporterExcel(lignes: LigneTableau[], nom: string, feuille = "Rapport") {
  const ws = XLSX.utils.json_to_sheet(lignes);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, feuille);
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  telecharger(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${nom}.xlsx`,
  );
}

export function exporterPDF(
  titre: string,
  sousTitre: string,
  colonnes: string[],
  lignes: Array<Array<string | number>>,
  nom: string,
) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor("#1E5AA8");
  doc.text("SmartCantine", 14, 18);
  doc.setFontSize(13);
  doc.setTextColor("#1A202C");
  doc.text(titre, 14, 27);
  doc.setFontSize(10);
  doc.setTextColor("#6B7280");
  doc.text(sousTitre, 14, 33);
  autoTable(doc, {
    startY: 38,
    head: [colonnes],
    body: lignes,
    headStyles: { fillColor: [30, 90, 168] },
    styles: { fontSize: 9 },
  });
  doc.save(`${nom}.pdf`);
}
