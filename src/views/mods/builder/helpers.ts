import { Actions } from '@/data/actions'
import { Eras } from '@/data/eras'
import { Formulas } from '@/data/formula'
import { Items } from '@/data/items'
import { LabActions } from '@/data/labs'
import { Maps } from '@/data/maps'
import { Techs } from '@/data/techs'
import { tips } from '@/data/tips'
import { toRaw } from 'vue'
import type { HookEventName, ModManifest, ModModel, ModPackage, ModPatchEntry } from '@/mods/types'
import type { BuilderHookDraft, BuilderPatchRow, BuilderValidationIssue } from './types'

const MODEL_KEY_FIELD: Record<ModModel, string> = {
  items: 'key',
  actions: 'key',
  formulas: 'key',
  labs: 'key',
  techs: 'key',
  maps: 'key',
  tips: 'id',
  eras: 'key',
}

const MODEL_RECORDS: Record<ModModel, () => Record<string, unknown>[]> = {
  items: () => Items as unknown as Record<string, unknown>[],
  actions: () => Actions as unknown as Record<string, unknown>[],
  formulas: () => Formulas as unknown as Record<string, unknown>[],
  labs: () => LabActions as unknown as Record<string, unknown>[],
  techs: () => Techs as unknown as Record<string, unknown>[],
  maps: () => Maps as unknown as Record<string, unknown>[],
  tips: () => tips as unknown as Record<string, unknown>[],
  eras: () => Eras as unknown as Record<string, unknown>[],
}

function deepClone<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value
  }

  const source = toRaw(value as object) as T

  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(source)
    } catch {
      // Fall through to JSON-safe clone for non-structured-cloneable values.
    }
  }

  const seen = new WeakSet<object>()
  return JSON.parse(
    JSON.stringify(source, (_key, current) => {
      if (typeof current === 'function' || typeof current === 'symbol') {
        return undefined
      }

      if (typeof current === 'object' && current !== null) {
        if (typeof Window !== 'undefined' && current === window) {
          return undefined
        }

        if (seen.has(current as object)) {
          return undefined
        }
        seen.add(current as object)
      }

      return current
    }),
  ) as T
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function expandNamespaceKey(input: string, modId: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('$')) {
    return `${modId}:${trimmed.slice(1)}`
  }
  return trimmed
}

function normaliseHookFileName(id: string): string {
  const safe = (id.trim() || 'main').replace(/[^a-zA-Z0-9._-]/g, '-')
  return safe.endsWith('.js') ? safe : `${safe}.js`
}

function compactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    const next = value.map(item => compactValue(item)).filter(item => item !== undefined)
    return next.length > 0 ? next : undefined
  }

  if (isPlainObject(value)) {
    const next: Record<string, unknown> = {}
    Object.entries(value).forEach(([key, inner]) => {
      const compacted = compactValue(inner)
      if (compacted !== undefined) {
        next[key] = compacted
      }
    })
    return Object.keys(next).length > 0 ? next : undefined
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }

  if (value === undefined || value === null) {
    return undefined
  }

  return value
}

export function createDefaultManifest(): ModManifest {
  return {
    schemaVersion: 1,
    modId: 'my-mod',
    name: '我的 Mod',
    version: '1.0.0',
    description: '通过 GUI 生成的 Mod 包',
    author: 'YourName',
    gameVersionRange: '>=1.0.0',
    conflictPolicy: 'last-write-wins',
    hooksRuntime: undefined,
    capabilities: {
      stores: undefined,
      dom: false,
      network: false,
    },
    networkPolicy: {
      allowDomains: [],
      blockedDomains: [],
      timeoutMs: 10000,
      maxConcurrentRequests: 4,
    },
  }
}

export function createPatchRow(model: keyof typeof MODEL_KEY_FIELD = 'items'): BuilderPatchRow {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    model,
    op: 'add',
    targetKey: '',
    value: {},
  }
}

export function createHookDraft(): BuilderHookDraft {
  return {
    enabled: false,
    id: 'main',
    events: {},
  }
}

export function buildHookCode(events: Partial<Record<HookEventName, string>>): string {
  const rows: string[] = ['module.exports = {']

  Object.entries(events).forEach(([event, body]) => {
    if (!body || !body.trim()) return
    rows.push(`  async ${event}(payload, context) {`)
    body.split('\n').forEach(line => rows.push(`    ${line}`))
    rows.push('  },')
  })

  rows.push('}')
  return rows.join('\n')
}

export function validateBuilderState(
  manifest: ModManifest,
  rows: BuilderPatchRow[],
  hookDraft: BuilderHookDraft,
): BuilderValidationIssue[] {
  const issues: BuilderValidationIssue[] = []

  const requiredManifestFields: Array<keyof ModManifest> = [
    'schemaVersion',
    'modId',
    'name',
    'version',
    'description',
    'author',
    'gameVersionRange',
    'conflictPolicy',
  ]

  requiredManifestFields.forEach(field => {
    if (!manifest[field]) {
      issues.push({ level: 'error', path: `manifest.${String(field)}`, message: '必填字段不能为空' })
    }
  })

  if (manifest.modId && !/^[a-z0-9._-]+$/.test(manifest.modId)) {
    issues.push({ level: 'error', path: 'manifest.modId', message: '仅支持小写字母、数字、点、下划线和中划线' })
  }

  rows.forEach((row, index) => {
    const keyField = MODEL_KEY_FIELD[row.model]
    const compacted = (compactValue(row.value) || {}) as Record<string, unknown>
    const rawValueKey = String(compacted[keyField] ?? '').trim()
    const expandedValueKey = expandNamespaceKey(rawValueKey, manifest.modId)
    const expandedTargetKey = expandNamespaceKey(row.targetKey, manifest.modId)

    if (row.op === 'add') {
      if (!rawValueKey) {
        issues.push({ level: 'error', path: `patches[${index}].value.${keyField}`, message: 'add 操作必须提供新增键值' })
      } else if (!rawValueKey.startsWith('$') && !rawValueKey.startsWith(`${manifest.modId}:`)) {
        issues.push({
          level: 'error',
          path: `patches[${index}].value.${keyField}`,
          message: `新增键值必须以 ${manifest.modId}: 或 $ 开头`,
        })
      }
    }

    if (row.op !== 'add' && !row.targetKey.trim()) {
      issues.push({
        level: 'error',
        path: `patches[${index}].targetKey`,
        message: `${row.op} 操作必须填写 targetKey`,
      })
    }

    if (row.op === 'override') {
      if (!rawValueKey) {
        issues.push({
          level: 'error',
          path: `patches[${index}].value.${keyField}`,
          message: 'override 操作建议提供完整对象，必须包含 key/id',
        })
      } else if (expandedTargetKey && expandedValueKey !== expandedTargetKey) {
        issues.push({
          level: 'error',
          path: `patches[${index}].value.${keyField}`,
          message: `override 的 ${keyField} 必须与 targetKey 一致`,
        })
      }
    }

    if (row.op === 'merge' && rawValueKey && expandedTargetKey && expandedValueKey !== expandedTargetKey) {
      issues.push({
        level: 'error',
        path: `patches[${index}].value.${keyField}`,
        message: `merge 不应修改主键，若填写 ${keyField} 必须与 targetKey 一致`,
      })
    }

    if (row.op !== 'add' && expandedTargetKey) {
      const knownKeys = new Set(listModelKeys(row.model))
      rows.slice(0, index).forEach(previous => {
        if (previous.model !== row.model || previous.op !== 'add') return
        const previousCompacted = compactValue(previous.value) as Record<string, unknown> | undefined
        const previousRawKey = String(previousCompacted?.[keyField] ?? '').trim()
        if (!previousRawKey) return
        knownKeys.add(expandNamespaceKey(previousRawKey, manifest.modId))
      })

      if (!knownKeys.has(expandedTargetKey)) {
        issues.push({
          level: 'error',
          path: `patches[${index}].targetKey`,
          message: `targetKey 在当前 ${row.model} 中不存在：${expandedTargetKey}`,
        })
      }
    }

    if (Object.keys(compacted).length === 0) {
      issues.push({
        level: 'warn',
        path: `patches[${index}].value`,
        message: '当前补丁值为空，导出后可能无效果',
      })
    }
  })

  if (hookDraft.enabled) {
    const eventCount = Object.values(hookDraft.events).filter(value => value && value.trim()).length
    if (eventCount === 0) {
      issues.push({ level: 'warn', path: 'hooks', message: '脚本注入已开启，但没有事件代码' })
    } else {
      try {
        const code = buildHookCode(hookDraft.events)
        new Function('module', 'exports', code)
      } catch (error) {
        issues.push({ level: 'error', path: 'hooks', message: `脚本语法错误：${(error as Error).message}` })
      }
    }
  }

  return issues
}

export function buildModPackage(
  manifest: ModManifest,
  rows: BuilderPatchRow[],
  hookDraft: BuilderHookDraft,
): ModPackage {
  const nextManifest = deepClone(manifest)
  const patches: ModPatchEntry[] = rows.map(row => {
    const entry: ModPatchEntry = {
      model: row.model,
      op: row.op,
    }

    if (row.op !== 'add') {
      entry.targetKey = row.targetKey.trim()
    }

    const compactedValue = compactValue(row.value)
    if (compactedValue && isPlainObject(compactedValue)) {
      entry.value = compactedValue
    }

    return entry
  })

  const pkg: ModPackage = {
    manifest: nextManifest,
    patches,
  }

  if (hookDraft.enabled) {
    const hookId = hookDraft.id.trim() || 'main'
    const hookFileName = normaliseHookFileName(hookId)
    const code = buildHookCode(hookDraft.events)
    pkg.hooks = [{ id: hookId, code }]
    pkg.manifest.hooksRuntime = 'full-trust'
    pkg.manifest.hookFiles = [hookFileName]
    pkg.manifest.capabilities = {
      ...(pkg.manifest.capabilities || {}),
      stores: pkg.manifest.capabilities?.stores,
      dom: Boolean(pkg.manifest.capabilities?.dom),
      network: Boolean(pkg.manifest.capabilities?.network),
    }
  } else {
    pkg.manifest.hookFiles = undefined
    pkg.manifest.hooksRuntime = undefined
    pkg.hooks = []
  }

  return pkg
}

export function listModelKeys(model: ModModel): string[] {
  const keyField = MODEL_KEY_FIELD[model]
  const records = MODEL_RECORDS[model]()

  return records
    .map(record => String(record[keyField] ?? '').trim())
    .filter(Boolean)
}

export function getModelEntry(model: ModModel, key: string): Record<string, unknown> | null {
  const keyField = MODEL_KEY_FIELD[model]
  const target = key.trim()
  if (!target) return null

  const record = MODEL_RECORDS[model]().find(item => String(item[keyField] ?? '').trim() === target)
  return record ? deepClone(record) : null
}
