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

/* Indigo / Violet / Emerald palette */
const COLORS = [
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#10b981", // emerald-500
  "#06b6d4", // cyan-500
  "#f59e0b", // amber-500
  "#ec4899", // pink-500
  "#3b82f6", // blue-500
  "#14b8a6", // teal-500
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
      <p className="py-12 text-center text-sm text-slate-400">
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
            innerRadius={50}
            outerRadius={82}
            paddingAngle={3}
            strokeWidth={2}
            stroke="#ffffff"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
              padding: "8px 14px",
              fontSize: "12px",
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => {
              const pct = total > 0 ? Math.round((Number(value) / total) * 100) : 0
              return [`${value} (${pct}%)`, formatCategory(String(name))]
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 px-2">
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.count / total) * 100) : 0
          return (
            <div key={d.category} className="flex items-center gap-2 text-xs">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-slate-600">
                {formatCategory(d.category)}
              </span>
              <span className="font-semibold text-slate-800">{d.count}</span>
              <span className="text-slate-400">({pct}%)</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const OCCUPANCY_COLORS: Record<string, string> = {
  owner_occupied: "#10b981",
  rental: "#6366f1",
}

const OCCUPANCY_LABELS: Record<string, string> = {
  owner_occupied: "Owner Occupied",
  rental: "Rental",
}

export function OccupancyChart({ data }: { data: OccupancyBreakdown[] }) {
  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-400">
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
            innerRadius={50}
            outerRadius={82}
            paddingAngle={3}
            strokeWidth={2}
            stroke="#ffffff"
          >
            {data.map((entry) => (
              <Cell
                key={entry.type}
                fill={OCCUPANCY_COLORS[entry.type] || "#94a3b8"}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
              padding: "8px 14px",
              fontSize: "12px",
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => {
              const pct = total > 0 ? Math.round((Number(value) / total) * 100) : 0
              return [`${value} (${pct}%)`, OCCUPANCY_LABELS[String(name)] || String(name)]
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-1.5 px-2">
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.count / total) * 100) : 0
          const label = OCCUPANCY_LABELS[d.type] || d.type
          return (
            <div key={d.type} className="flex items-center gap-2 text-xs">
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: OCCUPANCY_COLORS[d.type] || "#94a3b8" }}
              />
              <span className="text-slate-600">{label}</span>
              <span className="font-semibold text-slate-800">{d.count}</span>
              <span className="text-slate-400">({pct}%)</span>
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
      <BarChart data={data} barCategoryGap="20%">
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "none",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
            padding: "8px 14px",
            fontSize: "12px",
          }}
          cursor={{ fill: "rgba(99, 102, 241, 0.06)" }}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
          iconType="circle"
          iconSize={8}
        />
        <Bar
          dataKey="count"
          name="Violations"
          fill="url(#barGradient)"
          radius={[6, 6, 0, 0]}
        />
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  )
}
