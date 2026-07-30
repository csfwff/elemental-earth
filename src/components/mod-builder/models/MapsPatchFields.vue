<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">地图标识符 (Key)</legend>
        <input v-model="form.key" class="input input-sm w-full" placeholder="$new_map" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">显示名称</legend>
        <input v-model="form.name" class="input input-sm w-full" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">图标 (Iconify ID)</legend>
        <input v-model="form.icon" class="input input-sm w-full" placeholder="tabler:map" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">地图坐标 (X / Y)</legend>
        <div class="join w-full">
          <input type="number" v-model.number="form.x" class="input input-sm join-item w-1/2" placeholder="X坐标" />
          <input type="number" v-model.number="form.y" class="input input-sm join-item w-1/2" placeholder="Y坐标" />
        </div>
      </fieldset>
    </div>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">区域描述</legend>
      <textarea v-model="form.description" class="textarea textarea-sm w-full" rows="3"></textarea>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">高级配置/其他属性 (JSON)</legend>
      <textarea v-model="form.extraJson" class="textarea textarea-sm w-full font-mono text-xs" rows="3"></textarea>
    </fieldset>

    <div v-if="jsonError" class="alert alert-warning alert-soft text-xs">
      <Icon icon="tabler:alert-circle" />
      <span>JSON 配置异常：{{ jsonError }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { BuilderPatchOperation } from '@/views/mods/builder/types'

const props = defineProps<{
  modelValue: Record<string, unknown>
  op: BuilderPatchOperation
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, unknown>): void
}>()

const form = reactive({
  key: '',
  name: '',
  icon: '',
  description: '',
  x: undefined as number | undefined,
  y: undefined as number | undefined,
  extraJson: '',
})

const jsonError = computed(() => {
  const raw = form.extraJson.trim()
  if (!raw) return ''
  try {
    JSON.parse(raw)
    return ''
  } catch (error) {
    return (error as Error).message
  }
})

function applyFromValue(value: Record<string, unknown>): void {
  form.key = String(value.key ?? '')
  form.name = String(value.name ?? '')
  form.icon = String(value.icon ?? '')
  form.description = String(value.description ?? '')

  const pos = (value.position as Record<string, unknown> | undefined) || {}
  form.x = typeof pos.x === 'number' ? pos.x : undefined
  form.y = typeof pos.y === 'number' ? pos.y : undefined
  form.extraJson = ''
}

function buildValue(): Record<string, unknown> {
  const value: Record<string, unknown> = {}
  if (form.key.trim()) value.key = form.key.trim()
  if (form.name.trim()) value.name = form.name.trim()
  if (form.icon.trim()) value.icon = form.icon.trim()
  if (form.description.trim()) value.description = form.description.trim()

  if (typeof form.x === 'number' || typeof form.y === 'number') {
    value.position = {
      x: typeof form.x === 'number' ? form.x : 0,
      y: typeof form.y === 'number' ? form.y : 0,
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

watch(
  () => props.modelValue,
  value => applyFromValue(value || {}),
  { immediate: true, deep: true },
)

watch(
  form,
  () => emit('update:modelValue', buildValue()),
  { deep: true },
)
</script>
