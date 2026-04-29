/**
 * Header used by every settings tab. Keeps spacing/typography
 * consistent across the 14 tabs.
 */
export function SettingsPageHeader({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <header className="mb-6 border-b border-slate-200 pb-4">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {description ? (
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      ) : null}
    </header>
  )
}
