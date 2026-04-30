export type WorkflowStage = {
  key: string
  label: string
  description?: string
  deadline_days: number
  required_docs: string[]
  next: string | null
}

export type WorkflowDefinition = {
  stages: WorkflowStage[]
}

export function findStage(def: WorkflowDefinition, key: string) {
  return def.stages.find((s) => s.key === key) ?? null
}

export function stageIndex(def: WorkflowDefinition, key: string) {
  return def.stages.findIndex((s) => s.key === key)
}

export function computeStageDueAt(stage: WorkflowStage, from = new Date()) {
  if (!stage.deadline_days || stage.deadline_days <= 0) return null
  const due = new Date(from)
  due.setDate(due.getDate() + stage.deadline_days)
  return due
}

export function isOverdue(dueAt: string | Date | null | undefined) {
  if (!dueAt) return false
  const d = typeof dueAt === "string" ? new Date(dueAt) : dueAt
  return d.getTime() < Date.now()
}
