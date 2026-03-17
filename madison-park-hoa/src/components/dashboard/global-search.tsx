"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Building2, AlertTriangle, Wrench, Search } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

type SearchResult = {
  id: string
  label: string
  sublabel?: string
  href: string
  type: "property" | "violation" | "vendor"
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Cmd+K listener
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    const supabase = createClient()
    const term = `%${q}%`

    const [propRes, violRes, vendorRes] = await Promise.all([
      // Properties by address or resident name
      supabase
        .from("properties")
        .select("id, address, residents(full_name, is_current)")
        .or(`address.ilike.${term}`)
        .limit(5),
      // Violations by description or category
      supabase
        .from("violations")
        .select("id, category, description, properties(address)")
        .or(`description.ilike.${term},category.ilike.${term}`)
        .limit(5),
      // Vendors by name
      supabase
        .from("vendors")
        .select("id, name, specialty")
        .ilike("name", term)
        .limit(5),
    ])

    const items: SearchResult[] = []

    // Properties
    if (propRes.data) {
      for (const p of propRes.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentRes = (p.residents as any[])?.find(
          (r: { is_current: boolean }) => r.is_current
        )
        items.push({
          id: `prop-${p.id}`,
          label: p.address,
          sublabel: currentRes?.full_name || undefined,
          href: `/dashboard/properties/${p.id}`,
          type: "property",
        })
      }
    }

    // Also search residents by name and include their properties
    if (q.length >= 2) {
      const { data: resData } = await supabase
        .from("residents")
        .select("id, full_name, property_id, properties(id, address)")
        .ilike("full_name", term)
        .eq("is_current", true)
        .limit(5)

      if (resData) {
        for (const r of resData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const prop = r.properties as any
          if (prop && !items.some((i) => i.id === `prop-${prop.id}`)) {
            items.push({
              id: `prop-${prop.id}`,
              label: prop.address,
              sublabel: r.full_name,
              href: `/dashboard/properties/${prop.id}`,
              type: "property",
            })
          }
        }
      }
    }

    // Violations
    if (violRes.data) {
      for (const v of violRes.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prop = v.properties as any
        items.push({
          id: `viol-${v.id}`,
          label: `${v.category}: ${(v.description || "").slice(0, 50)}`,
          sublabel: prop?.address || undefined,
          href: `/dashboard/violations`,
          type: "violation",
        })
      }
    }

    // Vendors
    if (vendorRes.data) {
      for (const vd of vendorRes.data) {
        items.push({
          id: `vendor-${vd.id}`,
          label: vd.name,
          sublabel: vd.specialty || undefined,
          href: `/dashboard/vendors`,
          type: "vendor",
        })
      }
    }

    setResults(items)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 250)
    return () => clearTimeout(timer)
  }, [query, search])

  function handleSelect(href: string) {
    setOpen(false)
    setQuery("")
    setResults([])
    router.push(href)
  }

  const iconMap = {
    property: Building2,
    violation: AlertTriangle,
    vendor: Wrench,
  }

  const propertyResults = results.filter((r) => r.type === "property")
  const violationResults = results.filter((r) => r.type === "violation")
  const vendorResults = results.filter((r) => r.type === "vendor")

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex"
      >
        <Search className="h-4 w-4" />
        <span>Search…</span>
        <kbd className="ml-2 rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search properties, violations, vendors…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {loading ? "Searching…" : "No results found."}
          </CommandEmpty>

          {propertyResults.length > 0 && (
            <CommandGroup heading="Properties">
              {propertyResults.map((r) => {
                const Icon = iconMap[r.type]
                return (
                  <CommandItem
                    key={r.id}
                    value={r.label}
                    onSelect={() => handleSelect(r.href)}
                  >
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span>{r.label}</span>
                      {r.sublabel && (
                        <span className="text-xs text-muted-foreground">
                          {r.sublabel}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}

          {violationResults.length > 0 && (
            <CommandGroup heading="Violations">
              {violationResults.map((r) => {
                const Icon = iconMap[r.type]
                return (
                  <CommandItem
                    key={r.id}
                    value={r.label}
                    onSelect={() => handleSelect(r.href)}
                  >
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span>{r.label}</span>
                      {r.sublabel && (
                        <span className="text-xs text-muted-foreground">
                          {r.sublabel}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}

          {vendorResults.length > 0 && (
            <CommandGroup heading="Vendors">
              {vendorResults.map((r) => {
                const Icon = iconMap[r.type]
                return (
                  <CommandItem
                    key={r.id}
                    value={r.label}
                    onSelect={() => handleSelect(r.href)}
                  >
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span>{r.label}</span>
                      {r.sublabel && (
                        <span className="text-xs text-muted-foreground">
                          {r.sublabel}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
