<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">时代标识符 (Key)</legend>
        <input v-model="form.key" class="input input-sm w-full" placeholder="$new_era" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">时代名称</legend>
        <input v-model="form.name" class="input input-sm w-full" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">时代图标 (Iconify ID)</legend>
        <input v-model="form.icon" class="input input-sm w-full" placeholder="tabler:hourglass" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">排序权重 (Order)</legend>
        <input type="number" v-model.number="form.order" class="input input-sm w-full" />
      </fieldset>
    </div>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">时代背景描述</legend>
      <textarea v-model="form.description" class="textarea textarea-sm w-full" rows="2"></textarea>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">里程碑清单 (milestones - JSON)</legend>
      <textarea v-model="form.milestonesJson" class="textarea textarea-sm w-full font-mono text-xs" rows="4" placeholder='[{"key":"stone_milestone","description":"获取石器时代核心物品"}]'></textarea>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">高级配置/附加属性 (JSON)</legend>
      <textarea v-model="form.extraJson" class="textarea textarea-sm w-full font-mono text-xs" rows="3"></textarea>
    </fieldset>

    <div v-if="jsonErrors.length" class="alert alert-warning alert-soft text-xs">
      <Icon icon="tabler:alert-circle" />
      <span>配置异常：{{ jsonErrors.join('；') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { BuilderPatchOperation } from '@/views/mods/builder/types'

const props = defineProps<{ modelValue: Record<string, unknown>; op: BuilderPatchOperation }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: Record<string, unknown>): void }>()

const form = reactive({
  key: '',
  name: '',
  icon: '',
  description: '',
  order: undefined as number | undefined,
  milestonesJson: '',
  extraJson: '',
})

function parseError(raw: string): string {
  if (!raw.trim()) return ''
  try {
    JSON.parse(raw)
    return ''
  } catch (error) {
    return (error as Error).message
  }
}

const jsonErrors = computed(() => {
  const rows = [
    ['milestones', parseError(form.milestonesJson)],
    ['advanced', parseError(form.extraJson)],
  ].filter(([, err]) => err)

  return rows.map(([name, err]) => `${name}: ${err}`)
})

function applyFromValue(value: Record<string, unknown>): void {
  form.key = String(value.key ?? '')
  form.name = String(value.name ?? '')
  form.icon = String(value.icon ?? '')
  form.description = String(value.description ?? '')
  form.order = typeof value.order === 'number' ? value.order : undefined
  form.milestonesJson = Array.isArray(value.milestones) ? JSON.stringify(value.milestones, null, 2) : ''
  form.extraJson = ''
}

function buildValue(): Record<string, unknown> {
  const value: Record<string, unknown> = {}
  if (form.key.trim()) value.key = form.key.trim()
  if (form.name.trim()) value.name = form.name.trim()
  if (form.icon.trim()) value.icon = form.icon.trim()
  if (form.description.trim()) value.description = form.description.trim()
  if (typeof form.order === 'number') value.order = form.order

  if (form.milestonesJson.trim()) {
    try {
      value.milestones = JSON.parse(form.milestonesJson)
    } catch {
      // ignore invalid json
    }
  }

  if (form.extraJson.trim()) {
    try {
      Object.assign(value, JSON.parse(form.extraJson) as Record<string, unknown>)
    } catch {
      // ignore invalid json
    }
  }

  return value
}

watch(() => props.modelValue, value => applyFromValue(value || {}), { immediate: true, deep: true })
watch(form, () => emit('update:modelValue', buildValue()), { deep: true })
</script>
