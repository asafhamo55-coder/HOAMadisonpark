/**
 * CSV / XLSX bulk import for properties + residents.
 *
 * - Browser-side: parsing is done with `papaparse` (CSV) and `xlsx` /
 *   SheetJS (Excel). Both are MIT-licensed, free, and work in the
 *   browser without a network round-trip — keeps preview/mapping
 *   responsive.
 * - Server-side: the validated rows are POSTed to a server action
 *   that batch-inserts under the tenant's RLS context.
 *
 * Required column: `address`.
 * Optional columns: lot_number, owner_name, owner_email, owner_phone,
 *                   type, move_in_date, city, state, zip.
 *
 * Up to 5,000 rows per import. The 1,000-row benchmark is tracked in
 * the validation gate; we cap at 5,000 to protect the Supabase free-tier
 * write rate.
 */

import Papa from "papaparse"
import * as XLSX from "xlsx"

export const IMPORT_ROW_LIMIT = 5000

export type RawRow = Record<string, unknown>

export type CanonicalRow = {
  address: string
  lot_number?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  owner_name?: string | null
  owner_email?: string | null
  owner_phone?: string | null
  type?: string | null
  move_in_date?: string | null
}

export type ColumnMapping = Partial<Record<keyof CanonicalRow, string>>

export type RowError = {
  rowIndex: number // zero-based, after header
  field: keyof CanonicalRow | "row"
  message: string
}

export type ParsedFile = {
  filename: string
  headers: string[]
  rows: RawRow[]
  truncated: boolean
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ZIP_RE = /^\d{5}(-\d{4})?$/
// Loose phone: 10+ digits accepted, allow common formatting characters.
const PHONE_RE = /^[+]?[\d\s().-]{7,}$/

const HEADER_GUESSES: Record<keyof CanonicalRow, RegExp[]> = {
  address: [/^address(\s*line\s*1)?$/i, /^street(\s*address)?$/i, /^addr$/i],
  lot_number: [/^lot[\s_]*(number|#|no)?$/i, /^lot$/i, /^unit$/i],
  city: [/^city$/i, /^town$/i],
  state: [/^state$/i, /^st$/i, /^province$/i],
  zip: [/^zip(\s*code)?$/i, /^postal(\s*code)?$/i],
  owner_name: [
    /^owner(\s*name)?$/i,
    /^resident(\s*name)?$/i,
    /^full[\s_]*name$/i,
    /^name$/i,
  ],
  owner_email: [/^owner(\s*email)?$/i, /^email(\s*address)?$/i, /^e[-\s]*mail$/i],
  owner_phone: [/^owner(\s*phone)?$/i, /^phone(\s*number)?$/i, /^mobile$/i],
  type: [/^type$/i, /^owner(\s*ship)?(\s*type)?$/i, /^relationship$/i],
  move_in_date: [/^move[-\s_]*in(\s*date)?$/i, /^start(\s*date)?$/i],
}

/** Auto-detect the column mapping by trying the regexes above against headers. */
export function autoMap(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const used = new Set<string>()
  ;(Object.keys(HEADER_GUESSES) as Array<keyof CanonicalRow>).forEach((field) => {
    const patterns = HEADER_GUESSES[field]
    for (const h of headers) {
      if (used.has(h)) continue
      if (patterns.some((re) => re.test(h.trim()))) {
        mapping[field] = h
        used.add(h)
        break
      }
    }
  })
  return mapping
}

/** Parse a CSV file in the browser. */
export function parseCsv(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
      complete: (result) => {
        const allRows = (result.data ?? []) as RawRow[]
        const truncated = allRows.length > IMPORT_ROW_LIMIT
        const rows = truncated ? allRows.slice(0, IMPORT_ROW_LIMIT) : allRows
        resolve({
          filename: file.name,
          headers: result.meta.fields ?? [],
          rows,
          truncated,
        })
      },
      error: (err) => reject(err),
    })
  })
}

/** Parse an XLSX/XLS file in the browser. */
export async function parseXlsx(file: File): Promise<ParsedFile> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: "array" })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) {
    return { filename: file.name, headers: [], rows: [], truncated: false }
  }
  const sheet = wb.Sheets[sheetName]
  const json = XLSX.utils.sheet_to_json<RawRow>(sheet, {
    defval: "",
    raw: false, // get strings so date detection is consistent
  })
  // Headers: read row 1 explicitly (in case json was empty).
  const headerRow = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    blankrows: false,
  })[0] as string[] | undefined
  const headers = (headerRow ?? Object.keys(json[0] ?? {})).map((h) =>
    String(h).trim(),
  )
  const truncated = json.length > IMPORT_ROW_LIMIT
  const rows = (truncated ? json.slice(0, IMPORT_ROW_LIMIT) : json).map(
    (r) => {
      const out: RawRow = {}
      headers.forEach((h) => {
        out[h] = r[h] ?? ""
      })
      return out
    },
  )
  return { filename: file.name, headers, rows, truncated }
}

/** Dispatch on file extension. */
export async function parseFile(file: File): Promise<ParsedFile> {
  const lower = file.name.toLowerCase()
  if (lower.endsWith(".csv") || lower.endsWith(".tsv")) return parseCsv(file)
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return parseXlsx(file)
  throw new Error(`Unsupported file type: ${file.name}`)
}

/**
 * Apply a column mapping to raw rows, normalizing values into the canonical
 * shape. Also returns row-level errors.
 */
export function applyMapping(
  rows: RawRow[],
  mapping: ColumnMapping,
): { rows: CanonicalRow[]; errors: RowError[] } {
  const errors: RowError[] = []
  const seenAddresses = new Set<string>()

  const out: CanonicalRow[] = rows.map((raw, idx) => {
    function pick(field: keyof CanonicalRow): string | null {
      const col = mapping[field]
      if (!col) return null
      const v = raw[col]
      if (v === undefined || v === null) return null
      const s = String(v).trim()
      return s.length > 0 ? s : null
    }

    const address = pick("address")
    if (!address) {
      errors.push({
        rowIndex: idx,
        field: "address",
        message: "Address is required.",
      })
    } else {
      const norm = address.toLowerCase().replace(/\s+/g, " ")
      if (seenAddresses.has(norm)) {
        errors.push({
          rowIndex: idx,
          field: "address",
          message: "Duplicate address within this file.",
        })
      }
      seenAddresses.add(norm)
    }

    const email = pick("owner_email")
    if (email && !EMAIL_RE.test(email)) {
      errors.push({
        rowIndex: idx,
        field: "owner_email",
        message: `Invalid email format: ${email}`,
      })
    }

    const zip = pick("zip")
    if (zip && !ZIP_RE.test(zip)) {
      errors.push({
        rowIndex: idx,
        field: "zip",
        message: `Invalid ZIP code: ${zip}`,
      })
    }

    const phone = pick("owner_phone")
    if (phone && !PHONE_RE.test(phone)) {
      errors.push({
        rowIndex: idx,
        field: "owner_phone",
        message: `Invalid phone format: ${phone}`,
      })
    }

    const moveIn = pick("move_in_date")
    let moveInIso: string | null = null
    if (moveIn) {
      const d = new Date(moveIn)
      if (Number.isNaN(d.getTime())) {
        errors.push({
          rowIndex: idx,
          field: "move_in_date",
          message: `Could not parse date: ${moveIn}`,
        })
      } else {
        moveInIso = d.toISOString().slice(0, 10)
      }
    }

    return {
      address: address ?? "",
      lot_number: pick("lot_number"),
      city: pick("city"),
      state: pick("state"),
      zip,
      owner_name: pick("owner_name"),
      owner_email: email,
      owner_phone: phone,
      type: pick("type"),
      move_in_date: moveInIso,
    }
  })

  return { rows: out, errors }
}

/** Summary numbers for the validation report UI. */
export function summarize(
  rows: CanonicalRow[],
  errors: RowError[],
): {
  total: number
  valid: number
  invalid: number
  withEmail: number
  withResident: number
} {
  const invalidIdx = new Set(errors.map((e) => e.rowIndex))
  const valid = rows.length - invalidIdx.size
  const withEmail = rows.filter((r) => r.owner_email).length
  const withResident = rows.filter((r) => r.owner_name).length
  return {
    total: rows.length,
    valid,
    invalid: invalidIdx.size,
    withEmail,
    withResident,
  }
}

/** Sample CSV template emitted by the "Download template" button. */
export const SAMPLE_TEMPLATE_CSV = [
  "address,lot_number,city,state,zip,owner_name,owner_email,owner_phone,type,move_in_date",
  '"123 Main St",L-001,Johns Creek,GA,30022,"Sarah Lee",sarah@example.com,(770) 555-0100,owner,2020-06-15',
  '"125 Main St",L-002,Johns Creek,GA,30022,"Marcus Johnson",marcus@example.com,(770) 555-0101,owner,2019-03-01',
  '"127 Main St",L-003,Johns Creek,GA,30022,"Priya Patel",priya@example.com,(770) 555-0102,owner,2022-11-04',
].join("\n")
