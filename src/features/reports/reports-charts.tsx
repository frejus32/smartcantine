"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MOCK_SERIE_REPAS } from "@/lib/mock/data";

const PAR_CLASSE = [
  { classe: "PS A", servis: 24 },
  { classe: "CM2 B", servis: 58 },
  { classe: "5e Rubis", servis: 67 },
  { classe: "3e Diamant", servis: 64 },
];

const AXIS = { tickLine: false, axisLine: false, tick: { fontSize: 12, fill: "#6B7280" } } as const;
const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "1px solid #E2E6EC",
  boxShadow: "0 4px 12px rgb(26 32 44 / 0.10)",
  fontSize: 13,
} as const;

export function RepasParClasseChart() {
  return (
    <div className="h-56 w-full" role="img" aria-label="Repas servis aujourd'hui par classe">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={PAR_CLASSE} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EC" vertical={false} />
          <XAxis dataKey="classe" {...AXIS} />
          <YAxis {...AXIS} />
          <Tooltip
            cursor={{ fill: "#EAF1F9" }}
            contentStyle={TOOLTIP_STYLE}
            formatter={(v) => [String(v) + " repas", "Servis"]}
          />
          <Bar dataKey="servis" fill="#1E5AA8" radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TendanceChart() {
  return (
    <div className="h-56 w-full" role="img" aria-label="Tendance des repas servis">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={MOCK_SERIE_REPAS} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EC" vertical={false} />
          <XAxis dataKey="jour" {...AXIS} interval={2} />
          <YAxis {...AXIS} width={44} domain={[180, 280]} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v) => [String(v) + " repas", "Servis"]}
          />
          <Line
            type="monotone"
            dataKey="servis"
            stroke="#1E5AA8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
