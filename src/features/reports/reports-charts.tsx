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

const AXIS = { tickLine: false, axisLine: false, tick: { fontSize: 12, fill: "#6B7280" } } as const;
const TOOLTIP = { borderRadius: 8, border: "1px solid #E2E6EC", fontSize: 13 } as const;

export function BarChartParClasse({ data }: { data: Array<{ classe: string; servis: number }> }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EC" vertical={false} />
          <XAxis dataKey="classe" {...AXIS} />
          <YAxis {...AXIS} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "#EAF1F9" }}
            contentStyle={TOOLTIP}
            formatter={(v) => [`${v} repas`, "Servis"]}
          />
          <Bar dataKey="servis" fill="#1E5AA8" radius={[6, 6, 0, 0]} maxBarSize={56} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LineChartMensuel({ data }: { data: Array<{ jour: string; servis: number }> }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EC" vertical={false} />
          <XAxis dataKey="jour" {...AXIS} />
          <YAxis {...AXIS} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP} formatter={(v) => [`${v} repas`, "Servis"]} />
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
