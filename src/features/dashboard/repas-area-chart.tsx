"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Courbe des repas servis — isolée pour un chargement dynamique (recharts). */
export default function RepasAreaChart({
  data,
}: {
  data: Array<{ jour: string; servis: number }>;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="fillServis" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E5AA8" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#1E5AA8" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EC" vertical={false} />
          <XAxis
            dataKey="jour"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#6B7280" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#6B7280" }}
            width={40}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #E2E6EC", fontSize: 13 }}
            formatter={(v) => [`${v} repas`, "Servis"]}
          />
          <Area
            type="monotone"
            dataKey="servis"
            stroke="#1E5AA8"
            strokeWidth={2}
            fill="url(#fillServis)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
