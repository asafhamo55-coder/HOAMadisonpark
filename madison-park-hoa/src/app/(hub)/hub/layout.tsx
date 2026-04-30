import Link from "next/link"
import { Building2 } from "lucide-react"

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/hub" className="flex items-center gap-2 font-semibold">
            <Building2 className="h-5 w-5" />
            Homeowner Hub
          </Link>
          <Link href="/login" className="text-sm text-muted-foreground">
            Sign out via /login
          </Link>
        </div>
      </header>
      {children}
    </div>
  )
}
