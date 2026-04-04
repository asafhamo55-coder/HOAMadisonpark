"use client"

import { useState } from "react"
import {
  ChevronDown,
  Home,
  Hammer,
  Fence,
  Car,
  PawPrint,
  SignpostBig,
  Key,
  DollarSign,
  Shield,
  Users,
  Zap,
  Search,
  MapPin,
  Ban,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  communityInfo,
  maintenance,
  architecturalStandards,
  fenceGuidelines,
  vehiclesAndParking,
  petsAndAnimals,
  signsRules,
  leasingRestrictions,
  assessments,
  insuranceRequirements,
  nuisanceRules,
  additionalRestrictions,
  governance,
  quickReference,
} from "@/lib/hoa-declaration"

type SectionConfig = {
  id: string
  title: string
  icon: React.ElementType
  color: string
  keywords: string[]
  content: React.ReactNode
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-sm text-gray-700">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-2 last:border-0">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className="text-sm text-right text-gray-900">{value}</span>
    </div>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
      {children}
    </div>
  )
}

export function RulesView() {
  const [search, setSearch] = useState("")
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())

  function toggleSection(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const sections: SectionConfig[] = [
    {
      id: "community",
      title: "Community Overview",
      icon: MapPin,
      color: "text-blue-600 bg-blue-50",
      keywords: ["community", "location", "streets", "address", "madison park"],
      content: (
        <div className="space-y-4">
          <SubSection title="Association">
            <p className="text-sm text-gray-700">{communityInfo.association_name}</p>
            <p className="text-sm text-gray-500">{communityInfo.association_type}</p>
          </SubSection>
          <SubSection title="Location">
            <InfoRow label="City" value={communityInfo.location.city} />
            <InfoRow label="County" value={communityInfo.location.county} />
            <InfoRow label="State" value={communityInfo.location.state} />
            <InfoRow label="Total Acres" value={`${communityInfo.location.total_acres}`} />
          </SubSection>
          <SubSection title="Private Streets">
            <BulletList items={communityInfo.private_streets} />
          </SubSection>
          <SubSection title="Declaration">
            <InfoRow label="Recorded" value="January 27, 2010" />
            <InfoRow label="Deed Book" value={communityInfo.deed_book} />
            <InfoRow label="Pages" value={communityInfo.deed_pages} />
          </SubSection>
        </div>
      ),
    },
    {
      id: "maintenance",
      title: "Homeowner Responsibilities",
      icon: Home,
      color: "text-emerald-600 bg-emerald-50",
      keywords: ["maintenance", "lawn", "yard", "repair", "trash", "landscaping", "driveway"],
      content: (
        <div className="space-y-4">
          <SubSection title="Owner Maintenance Duties">
            <BulletList items={maintenance.owner_responsibilities} />
          </SubSection>
          <SubSection title="Association Maintains">
            <BulletList items={maintenance.association_responsibilities} />
          </SubSection>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-800">
              <strong>Cure Period:</strong> {maintenance.owner_cure_period_days} days to fix issues after notice. {maintenance.self_help}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "architectural",
      title: "Architectural Standards",
      icon: Hammer,
      color: "text-purple-600 bg-purple-50",
      keywords: ["architectural", "arc", "approval", "construction", "modification", "exterior", "color", "paint"],
      content: (
        <div className="space-y-4">
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
            <p className="text-sm text-purple-800">{architecturalStandards.scope}</p>
          </div>
          <SubSection title="What Needs Approval">
            <p className="text-sm text-gray-700">{architecturalStandards.interior_visibility}</p>
          </SubSection>
          <SubSection title="Exemptions (No Approval Needed)">
            <BulletList items={architecturalStandards.exemptions} />
          </SubSection>
          <SubSection title="Submission Requirements">
            <p className="text-sm text-gray-700">{architecturalStandards.submittal_requirements}</p>
          </SubSection>
          <SubSection title="Timeline">
            <InfoRow label="Deemed approved if no response" value={`${architecturalStandards.deemed_approval_if_no_response_days} days`} />
            <InfoRow label="Approval expires if no construction" value={`${architecturalStandards.approval_expiry_if_no_construction_months} months`} />
          </SubSection>
        </div>
      ),
    },
    {
      id: "fencing",
      title: "Fence Guidelines",
      icon: Fence,
      color: "text-orange-600 bg-orange-50",
      keywords: ["fence", "fencing", "gate", "aluminum", "rear yard"],
      content: (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Prior Approval Required</Badge>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Gate Required</Badge>
          </div>
          <SubSection title="Required Specifications">
            <InfoRow label="Material" value={fenceGuidelines.specifications.material} />
            <InfoRow label="Height Options" value={fenceGuidelines.specifications.height_options_ft.map(h => `${h} ft`).join(" or ")} />
            <InfoRow label="Color" value={fenceGuidelines.specifications.color} />
            <InfoRow label="Post Size" value={fenceGuidelines.specifications.post_size} />
            <InfoRow label="Top Style" value={fenceGuidelines.specifications.vertical_top} />
          </SubSection>
          <SubSection title="Prohibited Types">
            <BulletList items={fenceGuidelines.prohibited_types} />
          </SubSection>
          <SubSection title="Location Rules">
            <BulletList items={fenceGuidelines.location_rules} />
          </SubSection>
        </div>
      ),
    },
    {
      id: "vehicles",
      title: "Vehicles & Parking",
      icon: Car,
      color: "text-blue-600 bg-blue-50",
      keywords: ["vehicle", "parking", "garage", "car", "truck", "tow", "rv", "commercial", "driveway"],
      content: (
        <div className="space-y-4">
          <SubSection title="Where to Park">
            <p className="text-sm text-gray-700">{vehiclesAndParking.authorized_areas}</p>
          </SubSection>
          <SubSection title="Garage Rules">
            <BulletList items={vehiclesAndParking.garage_rules} />
          </SubSection>
          <SubSection title="Restrictions">
            <InfoRow label="Unlicensed vehicles" value={`Must be removed within ${vehiclesAndParking.unlicensed_vehicle_limit_days} days`} />
            <InfoRow label="RVs / Recreational vehicles" value={`Max ${vehiclesAndParking.recreational_vehicle_limit_hours} hours`} />
            <InfoRow label="Large trucks (>3/4 ton)" value="Prohibited except during service" />
            <InfoRow label="Towing notice" value={`${vehiclesAndParking.towing_notice_hours} hours`} />
          </SubSection>
          <SubSection title="Commercial Vehicles">
            <p className="text-sm text-gray-700">{vehiclesAndParking.commercial_vehicles.definition}</p>
            <p className="mt-1 text-sm text-gray-600"><strong>Exception:</strong> {vehiclesAndParking.commercial_vehicles.exception}</p>
          </SubSection>
        </div>
      ),
    },
    {
      id: "pets",
      title: "Pets & Animals",
      icon: PawPrint,
      color: "text-pink-600 bg-pink-50",
      keywords: ["pet", "dog", "cat", "animal", "leash", "noise", "fecal"],
      content: (
        <div className="space-y-4">
          <SubSection title="Allowed Animals">
            <BulletList items={petsAndAnimals.allowed} />
          </SubSection>
          <SubSection title="Prohibited Animals">
            <BulletList items={petsAndAnimals.prohibited} />
          </SubSection>
          <SubSection title="Rules">
            <InfoRow label="Leash requirement" value={petsAndAnimals.leash_requirement} />
            <InfoRow label="Commercial breeding" value="Prohibited" />
            <InfoRow label="Waste cleanup" value={petsAndAnimals.fecal_matter} />
            <InfoRow label="Removal reimbursement" value={`${petsAndAnimals.removal_reimbursement_days} days`} />
          </SubSection>
        </div>
      ),
    },
    {
      id: "signs",
      title: "Signs & Displays",
      icon: SignpostBig,
      color: "text-amber-600 bg-amber-50",
      keywords: ["sign", "display", "flag", "political", "for sale"],
      content: (
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-800">{signsRules.general_rule}</p>
          </div>
          <SubSection title="Allowed Without Approval">
            <BulletList items={signsRules.allowed_without_approval} />
          </SubSection>
          <SubSection title="Life Event Signs">
            <InfoRow label="Max display" value={`${signsRules.life_event_signs.max_display_days} days`} />
            <InfoRow label="Occasions" value={signsRules.life_event_signs.occasions.join(", ")} />
          </SubSection>
          <SubSection title="Flags">
            <BulletList items={additionalRestrictions.flags.allowed} />
          </SubSection>
          <InfoRow label="Violation fine" value={`$${signsRules.fine_per_day_usd}.00 per day`} />
        </div>
      ),
    },
    {
      id: "leasing",
      title: "Leasing Restrictions",
      icon: Key,
      color: "text-indigo-600 bg-indigo-50",
      keywords: ["lease", "rent", "rental", "tenant", "sublease"],
      content: (
        <div className="space-y-4">
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
            <p className="text-sm text-indigo-800">{leasingRestrictions.purpose}</p>
          </div>
          <SubSection title="Key Rules">
            <InfoRow label="Max Open Leasing" value={`${leasingRestrictions.max_open_leasing_percent}% of Lots`} />
            <InfoRow label="Minimum lease term" value={`${leasingRestrictions.minimum_term_years} year`} />
            <InfoRow label="Whole Lot only" value="Yes — no room rentals" />
            <InfoRow label="Subleasing" value="Prohibited" />
            <InfoRow label="Transient/hotel use" value="Prohibited" />
            <InfoRow label="Board-approved form" value="Required" />
          </SubSection>
          <SubSection title="Hardship Exceptions">
            <BulletList items={leasingRestrictions.hardship_exceptions} />
          </SubSection>
          <SubSection title="Notice Requirements">
            <InfoRow label="Before executing lease" value={`${leasingRestrictions.pre_lease_notice_days} days notice to Board`} />
            <InfoRow label="After signing lease" value={`Copy to Board within ${leasingRestrictions.post_execution_reporting_days} days`} />
          </SubSection>
        </div>
      ),
    },
    {
      id: "assessments",
      title: "Assessments & Dues",
      icon: DollarSign,
      color: "text-green-600 bg-green-50",
      keywords: ["assessment", "dues", "fee", "payment", "fine", "late", "lien", "delinquent"],
      content: (
        <div className="space-y-4">
          <SubSection title="Assessment Types">
            <InfoRow label="General" value={assessments.types.general} />
            <InfoRow label="Special" value={assessments.types.special} />
            <InfoRow label="Specific" value={assessments.types.specific} />
          </SubSection>
          <SubSection title="Working Capital Contribution">
            <InfoRow label="Amount" value={`$${assessments.working_capital_contribution_usd}.00`} />
            <InfoRow label="When" value={assessments.working_capital_trigger} />
          </SubSection>
          <SubSection title="Delinquency">
            <InfoRow label="Grace period" value={`${assessments.delinquency.grace_period_days} days`} />
            <InfoRow label="Late charge" value={assessments.delinquency.late_charge} />
            <InfoRow label="Max interest rate" value={`${assessments.delinquency.interest_rate_max_percent}% per annum`} />
            <InfoRow label="Suit eligibility" value={`${assessments.delinquency.suit_eligibility_days} days`} />
          </SubSection>
          <SubSection title="Assessment Covers">
            <BulletList items={assessments.covers} />
          </SubSection>
        </div>
      ),
    },
    {
      id: "insurance",
      title: "Insurance Requirements",
      icon: Shield,
      color: "text-teal-600 bg-teal-50",
      keywords: ["insurance", "casualty", "liability", "coverage"],
      content: (
        <div className="space-y-4">
          <SubSection title="Owner Obligations">
            <InfoRow label="Casualty coverage" value={insuranceRequirements.owner_obligations.casualty} />
            <InfoRow label="Liability coverage" value={insuranceRequirements.owner_obligations.liability} />
            <InfoRow label="Must be continuous" value="Yes" />
          </SubSection>
          <InfoRow label="Repair deadline after damage" value={`${insuranceRequirements.repair_deadline_days} days`} />
        </div>
      ),
    },
    {
      id: "nuisance",
      title: "Nuisance & Additional Rules",
      icon: Ban,
      color: "text-red-600 bg-red-50",
      keywords: ["nuisance", "noise", "gun", "pool", "clothesline", "tree", "garage sale", "window"],
      content: (
        <div className="space-y-4">
          <SubSection title="Prohibited Nuisances">
            <BulletList items={nuisanceRules} />
          </SubSection>
          <SubSection title="Additional Restrictions">
            <InfoRow label="Firearms" value={additionalRestrictions.guns} />
            <InfoRow label="Window A/C" value={additionalRestrictions.air_conditioning} />
            <InfoRow label="Clotheslines" value={additionalRestrictions.clotheslines} />
            <InfoRow label="Above-ground pools" value={additionalRestrictions.swimming_pools.above_ground} />
            <InfoRow label="In-ground pools" value={additionalRestrictions.swimming_pools.in_ground} />
            <InfoRow label="Tree removal" value={additionalRestrictions.tree_removal} />
            <InfoRow label="Garage sales" value={additionalRestrictions.garage_sales} />
            <InfoRow label="Seasonal lights" value={`Max ${additionalRestrictions.seasonal_lights_max_days} days`} />
            <InfoRow label="Window treatments" value={additionalRestrictions.window_treatments} />
          </SubSection>
          <SubSection title="Protected Trees (Any Size)">
            <BulletList items={additionalRestrictions.ornamental_trees_protected} />
          </SubSection>
        </div>
      ),
    },
    {
      id: "governance",
      title: "Governance & Board",
      icon: Users,
      color: "text-slate-600 bg-slate-50",
      keywords: ["board", "meeting", "vote", "election", "officer", "president", "fine", "hearing"],
      content: (
        <div className="space-y-4">
          <SubSection title="Board of Directors">
            <InfoRow label="Board size" value={`${governance.board_size_after_declarant_control} directors`} />
            <InfoRow label="Term length" value={`${governance.term_years} years`} />
            <InfoRow label="Regular meetings" value={`${governance.regular_meetings_per_year} per year (at least 1/quarter)`} />
            <InfoRow label="Removal threshold" value={governance.removal_threshold} />
          </SubSection>
          <SubSection title="Officers">
            <BulletList items={governance.officers} />
          </SubSection>
          <SubSection title="Meetings">
            <InfoRow label="Meeting quorum" value={`${governance.quorum_percent}% of votes`} />
            <InfoRow label="Annual meeting" value={governance.annual_meeting} />
            <InfoRow label="Special meeting petition" value={`${governance.special_meeting_petition_percent}% of Total Association Vote`} />
          </SubSection>
          <SubSection title="Fining Procedure">
            <InfoRow label="Written notice required" value="Yes" />
            <InfoRow label="Cure period" value={`${governance.fining_procedure.cure_period_days} days`} />
            <InfoRow label="Right to hearing" value={governance.fining_procedure.hearing_right} />
            <InfoRow label="Fine effective after hearing" value={`${governance.fining_procedure.fine_effective_after_hearing_days} days`} />
          </SubSection>
        </div>
      ),
    },
    {
      id: "quickref",
      title: "Quick Reference",
      icon: Zap,
      color: "text-yellow-600 bg-yellow-50",
      keywords: ["reference", "threshold", "time", "limit", "amount", "vote"],
      content: (
        <div className="space-y-4">
          <SubSection title="Voting Thresholds">
            {Object.entries(quickReference.voting_thresholds).map(([k, v]) => (
              <InfoRow key={k} label={k} value={v} />
            ))}
          </SubSection>
          <SubSection title="Time Limits">
            {Object.entries(quickReference.time_limits).map(([k, v]) => (
              <InfoRow key={k} label={k} value={v} />
            ))}
          </SubSection>
          <SubSection title="Financial Thresholds">
            {Object.entries(quickReference.financial).map(([k, v]) => (
              <InfoRow key={k} label={k} value={v} />
            ))}
          </SubSection>
        </div>
      ),
    },
  ]

  const q = search.toLowerCase()
  const filteredSections = q
    ? sections.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.keywords.some((kw) => kw.includes(q))
      )
    : sections

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold">Rules & Guidelines</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Community rules from the Madison Park Declaration of Covenants (Recorded {communityInfo.recorded_date}, Deed Book {communityInfo.deed_book})
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rules (e.g. pets, parking, fence, lease...)"
          className="pl-9"
        />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {filteredSections.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No rules found matching &ldquo;{search}&rdquo;
          </p>
        ) : (
          filteredSections.map((section) => {
            const isOpen = openSections.has(section.id)
            const Icon = section.icon
            return (
              <Card key={section.id}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${section.color}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="flex-1 font-semibold text-sm">{section.title}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <CardContent className="border-t px-4 pt-4 pb-4">
                    {section.content}
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        This is a summary of the Declaration of Protective Covenants. For the complete legal document, contact the Board.
      </p>
    </div>
  )
}
