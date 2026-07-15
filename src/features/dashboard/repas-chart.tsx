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
import { MOCK_SERIE_REPAS } from "@/lib/mock/data";

export function RepasChart() {
  return (
    <div
      className="h-64 w-full"
      role="img"
      aria-label="Repas servis sur les 14 derniers jours de service"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={MOCK_SERIE_REPAS} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
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
            interval={2}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#6B7280" }}
            width={44}
            domain={[180, 280]}
          />
          <Tooltip
            cursor={{ stroke: "#CBD2DB" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #E2E6EC",
              boxShadow: "0 4px 12px rgb(26 32 44 / 0.10)",
              fontSize: 13,
            }}
            formatter={(value) => [String(value) + " repas", "Servis"]}
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
