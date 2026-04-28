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

  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => {
              const pct = total > 0 ? Math.round((Number(value) / total) * 100) : 0
              return [`${value} (${pct}%)`, formatCategory(String(name))]
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 px-2">
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.count / total) * 100) : 0
          return (
            <div key={d.category} className="flex items-center gap-1.5 text-[11px]">
              <span
                className="h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-muted-foreground">
                {formatCategory(d.category)} <strong>{d.count}</strong> ({pct}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
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
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="type"
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={80}
            paddingAngle={2}
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
            formatter={(value: any, name: any) => {
              const pct = total > 0 ? Math.round((Number(value) / total) * 100) : 0
              return [`${value} (${pct}%)`, OCCUPANCY_LABELS[String(name)] || String(name)]
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 px-2">
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.count / total) * 100) : 0
          const label = OCCUPANCY_LABELS[d.type] || d.type
          return (
            <div key={d.type} className="flex items-center gap-1.5 text-xs">
              <span
                className="h-3 w-3 rounded-sm shrink-0"
                style={{ backgroundColor: OCCUPANCY_COLORS[d.type] || "#94a3b8" }}
              />
              <span>
                {label}: <strong>{d.count}</strong> ({pct}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
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
