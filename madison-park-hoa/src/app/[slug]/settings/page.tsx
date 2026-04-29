import { redirect } from "next/navigation"

export default function SettingsIndex({
  params,
}: {
  params: { slug: string }
}) {
  redirect(`/${params.slug}/settings/general`)
}
