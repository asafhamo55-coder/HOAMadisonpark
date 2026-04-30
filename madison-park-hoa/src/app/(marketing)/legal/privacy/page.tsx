import type { Metadata } from "next"

export const metadata: Metadata = { title: "Privacy Policy" }

export default function PrivacyPage() {
  return (
    <section className="container py-20">
      <div className="mx-auto max-w-3xl prose prose-sm">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        <p>
          This is placeholder copy. Homeowner Hub collects only the data needed
          to operate your workspace: account info, workspace data you enter,
          usage logs, and payment metadata.
        </p>
        <h2>What we collect</h2>
        <ul>
          <li>Account: name, email, role, workspace memberships.</li>
          <li>Workspace data: properties, residents, tenants, cases, documents you upload.</li>
          <li>Logs: request logs and audit events.</li>
        </ul>
        <h2>How we use it</h2>
        <p>To operate the service, prevent abuse, and support you.</p>
        <h2>Your rights</h2>
        <p>Email us to access, export, or delete your data.</p>
      </div>
    </section>
  )
}
