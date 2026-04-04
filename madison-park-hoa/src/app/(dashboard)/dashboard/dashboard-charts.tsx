"use client"

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { ViolationByCategory, ViolationByMonth, OccupancyBreakdown } from "./dashboard-data"

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
]

function formatCategory(cat: string) {
  return cat
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function ViolationsCategoryChart({
  data,
}: {
  data: ViolationByCategory[]
}) {
  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No violation data yet.
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="category"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={90}
          paddingAngle={2}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label={(props: any) =>
            `${formatCategory(props.name || "")} (${props.value})`
          }
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) => [
            value,
            formatCategory(String(name)),
          ]}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

const OCCUPANCY_COLORS: Record<string, string> = {
  owner_occupied: "#10b981",
  rental: "#3b82f6",
}

const OCCUPANCY_LABELS: Record<string, string> = {
  owner_occupied: "Owner Occupied",
  rental: "Rental",
}

export function OccupancyChart({ data }: { data: OccupancyBreakdown[] }) {
  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No occupancy data yet.
      </p>
    )
  }

  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="type"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={90}
          paddingAngle={2}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label={(props: any) => {
            const pct = total > 0 ? Math.round((props.value / total) * 100) : 0
            return `${OCCUPANCY_LABELS[props.name] || props.name} (${pct}%)`
          }}
          labelLine={false}
        >
          {data.map((entry) => (
            <Cell
              key={entry.type}
              fill={OCCUPANCY_COLORS[entry.type] || "#94a3b8"}
            />
          ))}
        </Pie>
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) => [
            `${value} properties`,
            OCCUPANCY_LABELS[String(name)] || String(name),
          ]}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function ViolationsMonthChart({ data }: { data: ViolationByMonth[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="count"
          name="Violations"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
