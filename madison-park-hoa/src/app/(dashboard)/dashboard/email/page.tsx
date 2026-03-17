import { getCurrentUser } from "@/lib/auth"
import { getEmailPageData } from "./page-data"
import { EmailCenterView } from "./email-center-view"

export default async function EmailPage() {
  const [user, data] = await Promise.all([
    getCurrentUser(),
    getEmailPageData(),
  ])

  const canManage = user?.role === "admin" || user?.role === "board"

  return (
    <EmailCenterView
      letters={data.letters}
      emailTemplates={data.emailTemplates}
      properties={data.properties}
      residents={data.residents}
      violations={data.violations}
      canManage={canManage}
    />
  )
}
