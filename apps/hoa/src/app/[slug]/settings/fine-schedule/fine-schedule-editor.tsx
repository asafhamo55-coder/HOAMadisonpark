"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  saveFineSchedule,
  upsertViolationCategory,
} from "@/app/actions/tenant-settings"

type Row = {
  id: string
  name: string
  slug: string
  default_fine_cents: number
  first_offense_cents: number | null
  second_offense_cents: number | null
  third_offense_cents: number | null
}

type ExtraRow = {
  category: string
  first_offense_cents: number
  second_offense_cents: number
  third_offense_cents: number
}

export function FineScheduleEditor({
  categories,
  extra,
}: {
  categories: Row[]
  extra: ExtraRow[]
}) {
  const [pending, start] = useTransition()
  const [rows, setRows] = useState<Row[]>(categories)
  const [extras, setExtras] = useState<ExtraRow[]>(extra)

  const dollars = (cents: number | null) =>
    cents == null ? "" : (cents / 100).toFixed(2)
  const toCents = (v: string) =>
    v.trim() === "" ? 0 : Math.round(Number(v) * 100)

  const updateRow = (id: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const addExtra = () =>
    setExtras((xs) => [
      ...xs,
      {
        category: "",
        first_offense_cents: 0,
        second_offense_cents: 0,
        third_offense_cents: 0,
      },
    ])

  const updateExtra = (i: number, patch: Partial<ExtraRow>) =>
    setExtras((xs) =>
      xs.map((x, idx) => (idx === i ? { ...x, ...patch } : x)),
    )
  const removeExtra = (i: number) =>
    setExtras((xs) => xs.filter((_, idx) => idx !== i))

  const onSave = () => {
    start(async () => {
      // Save each modified violation_category row.
      for (const row of rows) {
        const res = await upsertViolationCategory({
          id: row.id,
          name: row.name,
          slug: row.slug,
          default_fine_cents: row.default_fine_cents ?? 0,
          first_offense_cents: row.first_offense_cents ?? 0,
          second_offense_cents: row.second_offense_cents ?? 0,
          third_offense_cents: row.third_offense_cents ?? 0,
          active: true,
          sort_order: 0,
        })
        if (!res.ok) {
          toast.error(`Save failed for ${row.name}: ${res.error}`)
          return
        }
      }
      // Save the freeform extra rows into finance.fine_schedule[].
      const res = await saveFineSchedule(extras.filter((x) => x.category))
      if (!res.ok) toast.error(res.error)
      else toast.success("Fine schedule saved")
    })
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          By violation category
        </h2>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2 w-32">1st offense</th>
                <th className="px-3 py-2 w-32">2nd offense</th>
                <th className="px-3 py-2 w-32">3rd offense</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-slate-500"
                  >
                    No active violation categories. Add some on the
                    Violation categories tab.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {r.name}
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        inputMode="decimal"
                        value={dollars(r.first_offense_cents)}
                        onChange={(e) =>
                          updateRow(r.id, {
                            first_offense_cents: toCents(e.target.value),
                          })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        inputMode="decimal"
                        value={dollars(r.second_offense_cents)}
                        onChange={(e) =>
                          updateRow(r.id, {
                            second_offense_cents: toCents(e.target.value),
                          })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        inputMode="decimal"
                        value={dollars(r.third_offense_cents)}
                        onChange={(e) =>
                          updateRow(r.id, {
                            third_offense_cents: toCents(e.target.value),
                          })
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Additional ad-hoc rows
          </h2>
          <Button type="button" variant="secondary" size="sm" onClick={addExtra}>
            + Add row
          </Button>
        </div>
        {extras.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
            No ad-hoc rows. Use these for one-off rules that don&apos;t map to
            a violation category.
          </p>
        ) : (
          <div className="space-y-2">
            {extras.map((x, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_8rem_8rem_8rem_auto] items-center gap-2"
              >
                <Input
                  placeholder="Description"
                  value={x.category}
                  onChange={(e) =>
                    updateExtra(i, { category: e.target.value })
                  }
                />
                <Input
                  inputMode="decimal"
                  placeholder="1st"
                  value={dollars(x.first_offense_cents)}
                  onChange={(e) =>
                    updateExtra(i, {
                      first_offense_cents: toCents(e.target.value),
                    })
                  }
                />
                <Input
                  inputMode="decimal"
                  placeholder="2nd"
                  value={dollars(x.second_offense_cents)}
                  onChange={(e) =>
                    updateExtra(i, {
                      second_offense_cents: toCents(e.target.value),
                    })
                  }
                />
                <Input
                  inputMode="decimal"
                  placeholder="3rd"
                  value={dollars(x.third_offense_cents)}
                  onChange={(e) =>
                    updateExtra(i, {
                      third_offense_cents: toCents(e.target.value),
                    })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExtra(i)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-center gap-3">
        <Button onClick={onSave} disabled={pending}>
          {pending ? "Saving…" : "Save fine schedule"}
        </Button>
      </div>
    </div>
  )
}
