import type { Metadata } from "next"

export const metadata: Metadata = { title: "Terms of Service" }

export default function TermsPage() {
  return (
    <section className="container py-20">
      <div className="mx-auto max-w-3xl prose prose-sm">
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        <p>
          These terms govern your use of Homeowner Hub. By creating an account,
          you agree to these terms. This is placeholder copy — replace with your
          counsel-reviewed terms before launch.
        </p>
        <h2>1. Use of the Service</h2>
        <p>You agree to use Homeowner Hub for lawful purposes only.</p>
        <h2>2. Workspaces and modules</h2>
        <p>Each workspace is billed for the modules it has enabled.</p>
        <h2>3. Eviction Hub disclaimer</h2>
        <p>
          Eviction Hub provides workflow software, not legal advice. You are
          responsible for compliance with all applicable laws.
        </p>
        <h2>4. Termination</h2>
        <p>You can cancel any module at any time from the workspace billing page.</p>
      </div>
    </section>
  )
}
