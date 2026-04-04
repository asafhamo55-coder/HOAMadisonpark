/**
 * MADISON PARK HOA - COMPLETE DECLARATION DATA
 * Source: Declaration of Protective Covenants, Conditions, Restrictions and Easements
 * Recorded: January 27, 2010 | Deed Book 48748 | Fulton County, Georgia
 * Declarant: Ashton Atlanta Residential, L.L.C.
 * Association: Madison Park Property Owners' Association, Inc.
 */

export const communityInfo = {
  name: "Madison Park",
  association_name: "Madison Park Property Owners' Association, Inc.",
  association_type: "Georgia nonprofit corporation",
  declarant: "Ashton Atlanta Residential, L.L.C.",
  recorded_date: "2010-01-27",
  deed_book: "48748",
  deed_pages: "648–708",
  recording_number: "2010-0022282",
  location: {
    land_lots: ["14", "33"],
    district: "1st District, 1st Section",
    city: "Johns Creek",
    county: "Fulton County",
    state: "Georgia",
    total_acres: 14.97,
  },
  private_streets: [
    "Trumpet Park (Private)",
    "Old Maple Drive (Private)",
    "Allee Elm Drive (Private)",
    "Urban Ash Court (Private)",
    "Pistace Court (Private)",
  ],
}

export const maintenance = {
  association_responsibilities: [
    "All Common Property — maintenance, repair, and replacement of landscaping and improvements",
    "Community entry features and entry area landscaping",
    "Storm water detention/retention ponds and drainage facilities",
    "Irrigation systems for entry features and community landscaping",
    "Private Streets, sidewalks, adjacent landscaping, and street lights",
    "Landscaping within medians or islands in right-of-way of Private Streets",
  ],
  owner_responsibilities: [
    "All maintenance of Lot and all structures, landscaping, and improvements",
    "Prompt removal of litter, trash, refuse, and waste",
    "Regular lawn mowing",
    "Tree and shrub pruning",
    "Watering landscaped areas",
    "Keeping improvements and exterior lighting in good repair",
    "Keeping lawn and garden areas alive, free of weeds, and attractive",
    "Keeping driveways and walkways in good repair",
    "Complying with all governmental health and police requirements",
    "Maintenance of grading and storm water drainage as originally established",
    "Periodic maintenance and repair of exterior damage to improvements",
  ],
  owner_cure_period_days: 10,
  self_help: "Association may perform maintenance at Owner's sole cost and expense if not cured within 10 days.",
}

export const architecturalStandards = {
  scope: "No exterior construction, alteration, or addition of any improvements (including staking, clearing, excavation, grading, filling, exterior color changes, landscaping changes) may be commenced without approval.",
  interior_visibility: "Modifications visible from outside the Lot are subject to approval.",
  exemptions: [
    "Repainting in accordance with originally approved color scheme",
    "Rebuilding in accordance with originally approved plans and specifications",
  ],
  submittal_requirements: "Plans and specifications in writing showing nature, kind, shape, height, materials, and location of proposed improvement.",
  deemed_approval_if_no_response_days: 45,
  approval_expiry_if_no_construction_months: 12,
}

export const fenceGuidelines = {
  prior_approval_required: true,
  prohibited_types: ["Chain link", "Barbed wire"],
  specifications: {
    material: "Aluminum",
    height_options_ft: [4, 6],
    color: "Black",
    post_size: "2x2",
    horizontal_members: "2 or 3",
    vertical_top: "1/2 spear or pinch top",
    post_finishes_allowed: ["Ball", "New England", "External Flat"],
  },
  location_rules: [
    "Rear yard only — shall not extend closer to public street than the rear elevation of residence",
    "Located on property lines",
    "Must be installed 1–2 inches above ground to not obstruct water drainage",
    "Corner Lots: no fence beyond building setback line on either street side",
    "No fence on or within any easement area",
  ],
  gate_required: true,
  uniformity: "All fencing on a Lot shall be uniform in height, style, and color.",
}

export const vehiclesAndParking = {
  authorized_areas: "Garage, driveway (only for excess vehicles beyond garage spaces), or Board-designated areas.",
  garage_rules: [
    "All homes must contain a garage; carports not permitted",
    "Garage doors kept closed at all times except during ingress/egress",
    "Garages shall be used primarily for vehicle parking, not storage",
    "No conversion to living space without approval",
  ],
  unlicensed_vehicle_limit_days: 5,
  recreational_vehicle_limit_hours: 24,
  commercial_vehicles: {
    prohibited_in_community: true,
    exception: "Kept inside garage, or construction/service/delivery during service.",
    definition: "Any vehicle bearing indicia of commercial use (writing, logos, ladders, commercial signage).",
  },
  large_trucks_prohibited: "No 18-wheel trucks or trucks with load capacity > 3/4 ton except while providing service.",
  towing_notice_hours: 24,
}

export const petsAndAnimals = {
  allowed: [
    "Dogs and/or cats — up to 3 total combined",
    "Up to 2 additional small caged animals (birds, hamsters, guinea pigs, turtles, small lizards)",
    "Fish in aquarium (no limit)",
  ],
  prohibited: [
    "Livestock or poultry",
    "Monkeys",
    "Snakes",
    "Pigs",
    "Exotic animals",
    "Animals kept for commercial purposes",
    "Dog runs, runners, or exterior pens without approval",
  ],
  commercial_breeding_prohibited: true,
  leash_requirement: "Pets off Lot must be under control and restrained by chain, leash, or other physical control.",
  fecal_matter: "Failure to remove fecal matter from Common Property or Lot is conclusively deemed a nuisance.",
  removal_reimbursement_days: 21,
}

export const signsRules = {
  general_rule: "No sign of any kind without prior written consent.",
  allowed_without_approval: [
    "For-sale signs no larger than 18\" x 18\"",
    "Security signs no larger than 18\" x 18\"",
    "Signs required by legal proceedings",
  ],
  life_event_signs: {
    max_display_days: 7,
    occasions: ["Birth", "Graduation", "Similar life event"],
  },
  political_signs: "Permitted in reasonable number for limited time as determined by Board.",
  fine_per_day_usd: 150,
}

export const leasingRestrictions = {
  purpose: "Protect equity of Lot Owners and preserve character as predominantly owner-occupied.",
  max_open_leasing_percent: 15,
  minimum_term_years: 1,
  whole_lot_only: true,
  no_subleasing: true,
  no_transient_or_hotel: true,
  board_approved_form_required: true,
  hardship_exceptions: [
    "Owner must relocate outside Atlanta metro and cannot sell within 6 months at appraised value",
    "Owner is deceased and Lot is being administered by personal representative",
    "Owner temporarily relocates for employment and intends to return (must reapply annually)",
  ],
  pre_lease_notice_days: 7,
  post_execution_reporting_days: 10,
}

export const assessments = {
  types: {
    general: "Annual operating budget assessment levied equally on all Lots.",
    special: "For unbudgeted/unanticipated expenses. Up to 25% of annual assessment without vote; above 25% requires two-thirds of Total Association Vote.",
    specific: "Targeted expenses: fines, self-help costs, working capital contribution, attorney fees.",
  },
  working_capital_contribution_usd: 500,
  working_capital_trigger: "Every sale of a Lot (collected at closing).",
  delinquency: {
    grace_period_days: 10,
    late_charge: "Greater of $10.00 or 10% of amount due",
    suit_eligibility_days: 60,
    interest_rate_max_percent: 10,
  },
  estoppel_letter_response_days: 5,
  covers: [
    "Property taxes", "Insurance premiums", "Legal and accounting fees",
    "Management fees", "Utilities", "Garbage collection",
    "Landscape maintenance", "Private Streets and sidewalks maintenance",
    "Street lights", "Reserve funds",
  ],
}

export const insuranceRequirements = {
  owner_obligations: {
    casualty: "All-risk casualty on Lot and all structures — full replacement cost",
    liability: "Covering damage or injury occurring on the Lot",
    continuous: true,
  },
  repair_deadline_days: 75,
}

export const nuisanceRules = [
  "Storage of property causing unclean/untidy conditions",
  "Substances emitting foul/obnoxious odors",
  "Noise disturbing peace, quiet, safety, comfort, or serenity",
  "Horns, whistles, bells, or other sound devices (except security)",
  "Excessively loud music, television, or equipment",
  "Noxious or offensive odors outside a home",
  "Cigarette or cigar butts deposited on Common Property",
]

export const additionalRestrictions = {
  guns: "Firearms prohibited, including paint-ball guns, B-B guns, pellet guns.",
  air_conditioning: "No window air conditioning units.",
  clotheslines: "No exterior clotheslines of any type.",
  swimming_pools: { above_ground: "Prohibited", in_ground: "Requires approval" },
  tree_removal: "Approval required for trees 4+ inches diameter at 12 inches height.",
  ornamental_trees_protected: ["Dogwood", "Cottonwood", "Cherry", "Apple"],
  garage_sales: "Prior Board approval required.",
  window_treatments: "No foil or reflective materials. Visible side must be white or off-white.",
  seasonal_lights_max_days: 30,
  flags: {
    allowed: ["United States flag", "State of Georgia flag", "Seasonal flag/banner (2ft x 4ft max, 30 days/quarter)"],
    others_require_approval: true,
  },
}

export const governance = {
  board_size_after_declarant_control: 3,
  term_years: 2,
  quorum_percent: 25,
  annual_meeting: "Annual meeting to receive reports, install directors, and transact business.",
  special_meeting_petition_percent: 50,
  removal_threshold: "Majority of Total Association Vote",
  regular_meetings_per_year: 4,
  officers: ["President", "Vice President", "Secretary", "Treasurer"],
  fining_procedure: {
    notice_required: true,
    cure_period_days: 10,
    hearing_right: "Owner may request hearing within 10 days",
    fine_effective_after_hearing_days: 5,
  },
  fiscal_year: "Calendar year",
}

export const quickReference = {
  voting_thresholds: {
    "Budget disapproval": "Majority of Total Association Vote + Declarant",
    "Special assessment >25%": "Two-thirds of Total Association Vote",
    "Amendment to Declaration": "Two-thirds of Lots + Declarant",
    "Amendment to Bylaws": "Two-thirds of Total Association Vote + Declarant",
    "Litigation approval": "75% of Total Association Vote + Declarant",
    "Director removal": "Majority of Total Association Vote",
    "Meeting quorum": "25% of votes entitled to be cast",
  },
  time_limits: {
    "Assessment grace period": "10 days",
    "Late charge notice": "10 days",
    "Suit eligibility": "60 days after delinquency",
    "Estoppel letter response": "5 business days",
    "Owner cure period": "10 days",
    "Self-help notice": "10 days",
    "Vehicle towing notice": "24 hours",
    "Sign removal demand": "24 hours",
    "Seasonal lights display": "30 days",
    "Owner repair deadline": "75 days",
    "Lease notice to Board": "7 days before execution",
    "Lease copy to Board": "10 days after execution",
    "ARC plan approval lapse": "12 months",
    "Deemed approval if silent": "45 days",
  },
  financial: {
    "Working capital per sale": "$500.00",
    "Late charge": "Greater of $10.00 or 10%",
    "Max interest on delinquent": "10% per annum",
    "Sign violation fine": "$150.00 per day",
    "Special assessment cap (no vote)": "25% of annual assessment",
    "Minimum liability insurance": "$1,000,000",
  },
}
