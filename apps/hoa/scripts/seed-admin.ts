/**
 * First-run seed script for Madison Park HOA.
 *
 * Creates:
 *   1. Admin user (email + temporary password)
 *   2. Default email templates in email_templates table
 *   3. Default violation categories (in hoa_settings)
 *   4. Default HOA settings
 *
 * Prerequisites:
 *   - Supabase project created and migrations applied
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set in .env.local
 *
 * Usage:
 *   npx tsx scripts/seed-admin.ts
 */

import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { resolve } from "path"

// Load .env.local from project root
config({ path: resolve(__dirname, "../.env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Configuration ─────────────────────────────────────
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@madisonparkhoa.com"
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "ChangeMeNow2024!"
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "HOA Administrator"
const HOA_NAME =
  process.env.NEXT_PUBLIC_HOA_NAME || "Madison Park Homeowners Association"

// ── Main ──────────────────────────────────────────────
async function main() {
  console.log("🏠 Madison Park HOA — First Run Setup\n")

  // 1. Create admin user
  console.log("1️⃣  Creating admin user...")
  const { data: authUser, error: authError } =
    await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    })

  if (authError) {
    if (authError.message.includes("already been registered")) {
      console.log(`   ⚠️  User ${ADMIN_EMAIL} already exists — skipping`)
    } else {
      console.error(`   ❌ Error creating user: ${authError.message}`)
      process.exit(1)
    }
  } else {
    console.log(`   ✅ Created auth user: ${ADMIN_EMAIL}`)

    // Insert profile
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: authUser.user.id,
        full_name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        role: "admin",
      },
      { onConflict: "id" }
    )

    if (profileError) {
      console.error(`   ❌ Error creating profile: ${profileError.message}`)
    } else {
      console.log(`   ✅ Created admin profile: ${ADMIN_NAME}`)
    }
  }

  // 2. Seed default email templates
  console.log("\n2️⃣  Seeding email templates...")
  const emailTemplates = [
    {
      name: "violation-notice",
      type: "violation",
      subject_template: "Violation Notice — {{hoa_name}}",
      body_template:
        "Dear {{resident_name}},\n\nThis letter is to inform you that a violation has been observed at your property ({{property_address}}).\n\nCategory: {{category}}\nDescription: {{description}}\n\nPlease resolve this matter by {{due_date}}.\n\nSincerely,\n{{hoa_name}} Board",
    },
    {
      name: "warning-letter",
      type: "violation",
      subject_template: "Warning: Unresolved Violation — {{hoa_name}}",
      body_template:
        "Dear {{resident_name}},\n\nThis is a follow-up regarding the unresolved violation at {{property_address}}.\n\nCategory: {{category}}\nOriginal Notice Date: {{reported_date}}\n\nFailure to resolve this matter may result in fines. Please address this immediately.\n\nSincerely,\n{{hoa_name}} Board",
    },
    {
      name: "fine-notice",
      type: "violation",
      subject_template: "Fine Notice — {{hoa_name}}",
      body_template:
        "Dear {{resident_name}},\n\nDue to the unresolved violation at {{property_address}}, a fine of ${{fine_amount}} has been assessed to your account.\n\nPayment is due within 30 days.\n\nSincerely,\n{{hoa_name}} Board",
    },
    {
      name: "welcome-letter",
      type: "general",
      subject_template: "Welcome to {{hoa_name}}!",
      body_template:
        "Dear {{resident_name}},\n\nWelcome to {{hoa_name}}! We're glad to have you in our community.\n\nYour property: {{property_address}}\n\nPlease visit our resident portal to view community documents, pay dues, and stay informed.\n\nBest regards,\n{{hoa_name}} Board",
    },
    {
      name: "general-announcement",
      type: "general",
      subject_template: "Community Update — {{hoa_name}}",
      body_template:
        "Dear Residents,\n\n{{body}}\n\nBest regards,\n{{hoa_name}} Board",
    },
    {
      name: "payment-reminder",
      type: "payment",
      subject_template: "HOA Dues Reminder — {{hoa_name}}",
      body_template:
        "Dear {{resident_name}},\n\nThis is a friendly reminder that your HOA dues of ${{amount}} for {{period}} are due on {{due_date}}.\n\nPlease submit your payment at your earliest convenience.\n\nThank you,\n{{hoa_name}} Board",
    },
  ]

  for (const template of emailTemplates) {
    const { error } = await supabase
      .from("email_templates")
      .upsert(template, { onConflict: "name" })

    if (error) {
      console.log(`   ⚠️  ${template.name}: ${error.message}`)
    } else {
      console.log(`   ✅ ${template.name}`)
    }
  }

  // 3. Ensure default violation categories exist in hoa_settings
  console.log("\n3️⃣  Checking violation categories...")
  const { data: existingCats } = await supabase
    .from("hoa_settings")
    .select("key")
    .eq("key", "violation_categories")
    .single()

  if (existingCats) {
    console.log("   ✅ Violation categories already exist")
  } else {
    const categories = [
      { name: "Landscaping", default_severity: "medium", due_date_offset_days: 14 },
      { name: "Parking", default_severity: "low", due_date_offset_days: 7 },
      { name: "Noise", default_severity: "medium", due_date_offset_days: 7 },
      { name: "Trash", default_severity: "low", due_date_offset_days: 7 },
      { name: "Exterior", default_severity: "medium", due_date_offset_days: 30 },
      { name: "Pets", default_severity: "medium", due_date_offset_days: 14 },
      { name: "Signage", default_severity: "low", due_date_offset_days: 14 },
      { name: "Structure", default_severity: "high", due_date_offset_days: 30 },
      { name: "Fence/Wall", default_severity: "medium", due_date_offset_days: 30 },
      { name: "Holiday Decorations", default_severity: "low", due_date_offset_days: 14 },
      { name: "Unapproved Modification", default_severity: "high", due_date_offset_days: 30 },
      { name: "Other", default_severity: "low", due_date_offset_days: 14 },
    ]

    const { error } = await supabase
      .from("hoa_settings")
      .insert({ key: "violation_categories", value: categories })

    if (error) {
      console.log(`   ⚠️  ${error.message}`)
    } else {
      console.log("   ✅ Inserted default violation categories")
    }
  }

  // 4. Ensure default HOA settings exist
  console.log("\n4️⃣  Checking HOA settings...")
  const { data: existingProfile } = await supabase
    .from("hoa_settings")
    .select("key")
    .eq("key", "hoa_profile")
    .single()

  if (existingProfile) {
    console.log("   ✅ HOA settings already exist")
  } else {
    const defaultSettings = [
      {
        key: "hoa_profile",
        value: {
          name: HOA_NAME,
          address: "Johns Creek, GA 30022",
          phone: "",
          email: "board@madisonparkhoa.com",
          website: "",
          logo_url: "",
          board_president: "",
        },
      },
      {
        key: "dues_settings",
        value: {
          default_amount: 250,
          grace_period_days: 15,
          late_fee_amount: 25,
        },
      },
    ]

    for (const setting of defaultSettings) {
      const { error } = await supabase
        .from("hoa_settings")
        .insert(setting)

      if (error) {
        console.log(`   ⚠️  ${setting.key}: ${error.message}`)
      } else {
        console.log(`   ✅ ${setting.key}`)
      }
    }
  }

  // Done
  console.log("\n─────────────────────────────────────────")
  console.log("✅ Setup complete!\n")
  console.log("Admin login credentials:")
  console.log(`   Email:    ${ADMIN_EMAIL}`)
  console.log(`   Password: ${ADMIN_PASSWORD}`)
  console.log("\n⚠️  IMPORTANT: Change the admin password after first login!")
  console.log("─────────────────────────────────────────\n")
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
