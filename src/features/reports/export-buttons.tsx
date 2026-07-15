"use client";

import { FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ExportButtons() {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        onClick={() => toast.success("Rapport PDF généré (démonstration).")}
      >
        <FileText aria-hidden /> Export PDF
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast.success("Export Excel généré (démonstration).")}
      >
        <FileSpreadsheet aria-hidden /> Export Excel
      </Button>
    </div>
  );
}
