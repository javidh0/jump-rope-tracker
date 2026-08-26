"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MetricPoint = { date: string; value: number | null };

export default function MetricChart({
  data,
  unit,
  emptyMessage,
}: {
  data: MetricPoint[];
  unit?: string;
  emptyMessage: string;
}) {
  const points = data.filter((d): d is { date: string; value: number } => d.value != null);

  if (points.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            className="fill-zinc-500"
          />
          <YAxis tick={{ fontSize: 11 }} className="fill-zinc-500" width={40} />
          <Tooltip
            formatter={(value) =>
              [`${value}${unit ? ` ${unit}` : ""}`, ""] as [string, string]
            }
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="currentColor"
            strokeWidth={2}
            dot={{ r: 3 }}
            className="text-zinc-900 dark:text-white"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
