import type { ConflictPolicy, HookEventName, ModManifest, ModModel } from '@/mods/types'

export type BuilderPatchOperation = 'add' | 'override' | 'merge'

export interface BuilderPatchRow {
  id: string
  model: ModModel
  op: BuilderPatchOperation
  targetKey: string
  value: Record<string, unknown>
}

export interface BuilderHookDraft {
  enabled: boolean
  id: string
  events: Partial<Record<HookEventName, string>>
}

export interface BuilderValidationIssue {
  level: 'error' | 'warn'
  path: string
  message: string
}

export interface BuilderState {
  manifest: ModManifest
  patches: BuilderPatchRow[]
  hookDraft: BuilderHookDraft
}

export const BUILDER_MODELS: Array<{ key: ModModel; label: string }> = [
  { key: 'items', label: '物品 items' },
  { key: 'actions', label: '行动 actions' },
  { key: 'formulas', label: '配方 formulas' },
  { key: 'labs', label: '实验操作 labs' },
  { key: 'techs', label: '科技 techs' },
  { key: 'maps', label: '地图 maps' },
  { key: 'tips', label: '贴士 tips' },
  { key: 'eras', label: '时代 eras' },
]

export const BUILDER_OPS: Array<{ key: BuilderPatchOperation; label: string }> = [
  { key: 'add', label: '新增 add' },
  { key: 'override', label: '覆盖 override' },
  { key: 'merge', label: '合并 merge' },
]

export const HOOK_EVENTS: HookEventName[] = [
  'onEnable',
  'onDisable',
  'onReload',
  'onSave',
  'onLoad',
  'onActionStart',
  'onTaskComplete',
  'onFormulaResolved',
  'onEraAdvance',
  'onTick',
  'onMapSwitch',
]

export const HOOK_EVENT_LABELS: Record<HookEventName, string> = {
  onEnable: 'onEnable',
  onDisable: 'onDisable',
  onReload: 'onReload',
  onSave: 'onSave',
  onLoad: 'onLoad',
  onActionStart: 'onActionStart',
  onTaskComplete: 'onTaskComplete',
  onFormulaResolved: 'onFormulaResolved',
  onEraAdvance: 'onEraAdvance',
  onTick: 'onTick',
  onMapSwitch: 'onMapSwitch',
}

export const CONFLICT_POLICIES: Array<{ key: ConflictPolicy; label: string }> = [
  { key: 'last-write-wins', label: 'last-write-wins（推荐）' },
  { key: 'warn', label: 'warn（告警并跳过）' },
  { key: 'error', label: 'error（冲突即报错）' },
]
