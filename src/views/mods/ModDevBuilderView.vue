<template>
  <div class="max-w-7xl mx-auto space-y-4">
    <div class="card bg-base-200 border border-base-300">
      <div class="card-body p-4">
        <h2 class="card-title text-base inline-flex items-center gap-2">
          <Icon icon="tabler:tool" />
          Mod 可视化生成器
        </h2>
        <p class="text-sm text-base-content/70">
          采用模块化编辑器架构：Manifest、Patch、Hook 各自独立维护，补丁层按模型拆分独立组件。
        </p>
      </div>
    </div>

    <ManifestEditor v-model="manifest" />

    <PatchWorkbench
      :rows="patchRows"
      @add-row="addPatchRow"
      @remove-row="removePatchRow"
      @update-row="updatePatchRow"
    />

    <HookInjectionEditor v-model="hookDraft" />

    <div class="card bg-base-100 border border-base-300 shadow-sm">
      <div class="card-body p-4 gap-4">
        <div class="flex flex-wrap gap-4 items-center">
          <h2 class="card-title text-base inline-flex items-center gap-2 mr-auto">
            <Icon icon="tabler:file-export" />
            发布与导出
          </h2>
          <div class="join join-horizontal">
            <button class="btn btn-sm join-item" @click="copyJson" :disabled="hasErrors">
              <Icon icon="tabler:copy" />
              复制内容
            </button>
            <button class="btn btn-sm join-item" @click="downloadJson" :disabled="hasErrors">
              <Icon icon="tabler:download" />
              下载 JSON
            </button>
            <button class="btn btn-sm join-item btn-primary" @click="downloadZip" :disabled="hasErrors">
              <Icon icon="tabler:package-export" />
              打包下载 ZIP
            </button>
          </div>
        </div>

        <div v-if="issues.length" class="space-y-2">
          <div class="text-xs font-bold px-1 opacity-60">数据模型校验结果 ({{ issues.length }})</div>
          <div
            v-for="(issue, idx) in issues"
            :key="idx"
            class="alert py-2 text-xs"
            :class="issue.level === 'error' ? 'alert-error alert-soft' : 'alert-warning alert-soft'"
          >
            <Icon :icon="issue.level === 'error' ? 'tabler:alert-triangle' : 'tabler:alert-circle'" />
            <div class="flex flex-col">
              <span class="font-bold">[{{ issue.path }}]</span>
              <span>{{ issue.message }}</span>
            </div>
          </div>
        </div>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Mod (JSON)</legend>
          <textarea 
            :value="jsonPreview" 
            class="textarea textarea-sm w-full font-mono text-xs" 
            rows="14" 
            readonly
          >
          </textarea>
        </fieldset>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import JSZip from 'jszip'
import { computed, provide, ref } from 'vue'
import HookInjectionEditor from '@/components/mod-builder/HookInjectionEditor.vue'
import ManifestEditor from '@/components/mod-builder/ManifestEditor.vue'
import PatchWorkbench from '@/components/mod-builder/PatchWorkbench.vue'
import { Items } from '@/data/items'
import { Techs } from '@/data/techs'
import { Maps } from '@/data/maps'
import { Eras } from '@/data/eras'
import { Actions } from '@/data/actions'
import { LabActions as Labs } from '@/data/labs'
import { buildHookCode, buildModPackage, createDefaultManifest, createHookDraft, createPatchRow, validateBuilderState } from './builder/helpers'
import type { BuilderPatchRow } from './builder/types'

const manifest = ref(createDefaultManifest())
const patchRows = ref<BuilderPatchRow[]>([createPatchRow('items')])
const hookDraft = ref(createHookDraft())

// Data lookup for editors
const allItems = computed(() => {
  const base = Items.map(i => ({ value: i.key, label: i.name }))
  const added = patchRows.value
    .filter(r => r.model === 'items' && r.op === 'add' && r.value.key)
    .map(r => ({ value: String(r.value.key), label: `[Mod] ${r.value.name || r.value.key}` }))
  return [...base, ...added]
})

const allTechs = computed(() => {
  const base = Techs.map(t => ({ value: t.key, label: t.name }))
  const added = patchRows.value
    .filter(r => r.model === 'techs' && r.op === 'add' && r.value.key)
    .map(r => ({ value: String(r.value.key), label: `[Mod] ${r.value.name || r.value.key}` }))
  return [...base, ...added]
})

const allMaps = computed(() => {
  const base = Maps.map(m => ({ value: m.key, label: m.name }))
  const added = patchRows.value
    .filter(r => r.model === 'maps' && r.op === 'add' && r.value.key)
    .map(r => ({ value: String(r.value.key), label: `[Mod] ${r.value.name || r.value.key}` }))
  return [...base, ...added]
})

const allActions = computed(() => {
  const base = Actions.map((a: any) => ({ value: a.key, label: a.name }))
  const added = patchRows.value
    .filter(r => r.model === 'actions' && r.op === 'add' && r.value.key)
    .map(r => ({ value: String(r.value.key), label: `[Mod] ${r.value.name || r.value.key}` }))
  return [...base, ...added]
})

const allMilestones = computed(() => {
  const res: { value: string; label: string }[] = []
  Eras.forEach(era => {
    if (era.milestones) {
      Object.entries(era.milestones).forEach(([key, val]) => {
        res.push({ value: key, label: `${val.description} (${era.name})` })
      })
    }
  })
  return res
})

const allEras = computed(() => {
  const base = Eras.map(e => ({ value: String(e.key), label: e.name }))
  const added = patchRows.value
    .filter(r => r.model === 'eras' && r.op === 'add' && r.value.key)
    .map(r => ({ value: String(r.value.key), label: `[Mod] ${r.value.name || r.value.key}` }))
  return [...base, ...added]
})

const allLabs = computed(() => {
  const base = Labs.map((l: any) => ({ value: l.key, label: l.name }))
  const added = patchRows.value
    .filter(r => r.model === 'labs' && r.op === 'add' && r.value.key)
    .map(r => ({ value: String(r.value.key), label: `[Mod] ${r.value.name || r.value.key}` }))
  return [...base, ...added]
})

provide('builder-lookup', {
  items: allItems,
  techs: allTechs,
  maps: allMaps,
  actions: allActions,
  labs: allLabs,
  eras: allEras,
  milestones: allMilestones,
})

const issues = computed(() => validateBuilderState(manifest.value, patchRows.value, hookDraft.value))
const hasErrors = computed(() => issues.value.some(issue => issue.level === 'error'))

const packagePreview = computed(() => buildModPackage(manifest.value, patchRows.value, hookDraft.value))
const jsonPreview = computed(() => JSON.stringify(packagePreview.value, null, 2))

function addPatchRow(): void {
  patchRows.value.push(createPatchRow('items'))
}

function removePatchRow(id: string): void {
  patchRows.value = patchRows.value.filter(row => row.id !== id)
}

function updatePatchRow(next: BuilderPatchRow): void {
  const idx = patchRows.value.findIndex(row => row.id === next.id)
  if (idx === -1) return
  patchRows.value[idx] = next
}

async function copyJson(): Promise<void> {
  if (hasErrors.value) return
  const text = jsonPreview.value
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制 JSON 到剪贴板')
  } catch {
    const input = document.createElement('textarea')
    input.value = text
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    alert('已复制 JSON 到剪贴板')
  }
}

function downloadBlob(content: BlobPart, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function downloadJson(): void {
  if (hasErrors.value) return
  const fileName = `${manifest.value.modId || 'mod'}.json`
  downloadBlob(jsonPreview.value, fileName, 'application/json')
}

async function downloadZip(): Promise<void> {
  if (hasErrors.value) return

  const pkg = packagePreview.value
  const zip = new JSZip()

  zip.file('mod-package.json', JSON.stringify(pkg, null, 2))
  zip.file('manifest.json', JSON.stringify(pkg.manifest, null, 2))
  zip.file('patches.json', JSON.stringify(pkg.patches || [], null, 2))

  if (hookDraft.value.enabled) {
    const hookFile = pkg.manifest.hookFiles?.[0] || 'main.js'
    zip.file(hookFile, buildHookCode(hookDraft.value.events))
    zip.file('hooks.json', JSON.stringify(pkg.hooks || [], null, 2))
  }

  const content = await zip.generateAsync({ type: 'blob' })
  const fileName = `${manifest.value.modId || 'mod'}.zip`
  downloadBlob(content, fileName, 'application/zip')
}
</script>
