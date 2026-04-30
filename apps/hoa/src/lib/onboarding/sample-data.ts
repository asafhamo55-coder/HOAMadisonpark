/**
 * Generates 25 fictional properties + residents for the Step 3 Option C
 * "Sample data" path.
 *
 * Per DECISIONS.md C.1: sample data lives in a SEPARATE SANDBOX TENANT,
 * never as `is_demo=true` rows mixed into the user's real tenant. The
 * sandbox tenant slug is derived from the real tenant's slug suffixed
 * with `-demo` (so the user sees "<their slug>-demo" in the URL bar
 * when exploring).
 */

const STREETS = [
  "Maple Ave",
  "Oak Lane",
  "Cedar Court",
  "Birch Drive",
  "Pine Way",
  "Willow Place",
  "Elm Circle",
  "Aspen Trail",
  "Magnolia Ridge",
  "Dogwood Park",
]

const FIRST_NAMES = [
  "Sarah",
  "Marcus",
  "Priya",
  "James",
  "Aisha",
  "David",
  "Elena",
  "Jamal",
  "Mei",
  "Robert",
  "Yuki",
  "Carlos",
  "Hannah",
  "Tyler",
  "Olivia",
  "Daniel",
  "Sophia",
  "Andre",
  "Lila",
  "Nathan",
  "Maya",
  "Connor",
  "Zara",
  "Henry",
  "Ava",
]

const LAST_NAMES = [
  "Chen",
  "Johnson",
  "Patel",
  "Williams",
  "Khan",
  "Brown",
  "Garcia",
  "Davis",
  "Nakamura",
  "Miller",
  "Lee",
  "Rodriguez",
  "Cohen",
  "Anderson",
  "Martinez",
  "Wilson",
  "Lopez",
  "Adebayo",
  "Singh",
  "Taylor",
  "Iqbal",
  "Murphy",
  "Hassan",
  "O'Brien",
  "Romero",
]

const TYPES = ["owner", "owner", "owner", "tenant"] as const // weighted toward owner

export type SampleProperty = {
  address: string
  lot_number: string
  city: string
  state: string
  zip: string
}

export type SampleResident = {
  property_index: number
  full_name: string
  first_name: string
  last_name: string
  email: string
  phone: string
  type: (typeof TYPES)[number]
  relationship: "Primary Owner" | "Tenant"
  move_in_date: string
}

export function buildSampleData(seed: number = 1): {
  properties: SampleProperty[]
  residents: SampleResident[]
} {
  // Deterministic pseudo-random for reproducible demos.
  let s = seed >>> 0
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]
  const randInt = (min: number, max: number) =>
    Math.floor(rnd() * (max - min + 1)) + min

  const properties: SampleProperty[] = []
  const residents: SampleResident[] = []

  for (let i = 0; i < 25; i++) {
    const houseNum = randInt(100, 9999)
    const street = pick(STREETS)
    properties.push({
      address: `${houseNum} ${street}`,
      lot_number: `DEMO-${String(i + 1).padStart(3, "0")}`,
      city: "Sample City",
      state: "GA",
      zip: "30022",
    })

    const first = pick(FIRST_NAMES)
    const last = pick(LAST_NAMES)
    const t = pick(TYPES)
    const moveYear = randInt(2015, 2025)
    const moveMonth = String(randInt(1, 12)).padStart(2, "0")
    const moveDay = String(randInt(1, 28)).padStart(2, "0")
    residents.push({
      property_index: i,
      full_name: `${first} ${last}`,
      first_name: first,
      last_name: last,
      email: `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, "")}@example-demo.invalid`,
      phone: `(770) 555-${String(randInt(100, 9999)).padStart(4, "0")}`,
      type: t,
      relationship: t === "owner" ? "Primary Owner" : "Tenant",
      move_in_date: `${moveYear}-${moveMonth}-${moveDay}`,
    })
  }

  return { properties, residents }
}
