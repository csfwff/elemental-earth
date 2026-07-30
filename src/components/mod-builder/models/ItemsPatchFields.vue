<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">唯一标识符 (Key)</legend>
        <input v-model="form.key" class="input input-sm w-full" placeholder="$new_item 或 modId:new_item" />
        <p class="fieldset-label text-xs">使用 $ 可代表当前 Mod 命名空间</p>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">显示名称</legend>
        <input v-model="form.name" class="input input-sm w-full" placeholder="新物品名称" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">分类</legend>
        <input v-model="form.category" class="input input-sm w-full" placeholder="例如：材料、工具、设备" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">物品类型 (逗号分隔)</legend>
        <input v-model="form.typeCsv" class="input input-sm w-full" placeholder="material, tool" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">元素序号 (Elemental Index)</legend>
        <input type="number" v-model.number="form.elemental" class="input input-sm w-full" placeholder="若为纯元素物品可填入" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">耐久度/堆叠上限 (Durable)</legend>
        <input type="number" step="0.01" v-model.number="form.durable" class="input input-sm w-full" />
      </fieldset>

      <fieldset class="fieldset md:col-span-2">
        <legend class="fieldset-legend">解锁里程碑 (Milestone)</legend>
        <SearchableSelect
          v-model="form.milestone"
          clearable
          :options="lookup.milestones.value"
          placeholder="选择里程碑..."
        />
      </fieldset>
    </div>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">功能描述</legend>
      <textarea v-model="form.description" class="textarea textarea-sm w-full" rows="2"></textarea>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">高级属性定义 (JSON)</legend>
      <textarea v-model="form.extraJson" class="textarea textarea-sm w-full font-mono" rows="4" placeholder='{"attrs":{"burn_time":30},"is_discovery":true}'></textarea>
      <p class="fieldset-label text-xs">包含 attrs 或其他特殊逻辑字段</p>
    </fieldset>

    <div v-if="jsonError" class="alert alert-warning alert-soft text-xs">
      <Icon icon="tabler:alert-circle" />
      <span>JSON 格式校验失败：{{ jsonError }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, reactive, watch } from 'vue'
import SearchableSelect from '@/components/SearchableSelect.vue'
import type { BuilderPatchOperation } from '@/views/mods/builder/types'

const props = defineProps<{
  modelValue: Record<string, unknown>
  op: BuilderPatchOperation
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, unknown>): void
}>()

const lookup = inject<any>('builder-lookup')

const form = reactive({
  key: '',
  name: '',
  category: '',
  description: '',
  typeCsv: '',
  elemental: undefined as number | undefined,
  durable: undefined as number | undefined,
  milestone: '',
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
  form.category = String(value.category ?? '')
  form.description = String(value.description ?? '')
  form.typeCsv = Array.isArray(value.type) ? value.type.join(', ') : ''
  form.elemental = typeof value.elemental === 'number' ? value.elemental : undefined
  form.durable = typeof value.durable === 'number' ? value.durable : undefined
  form.milestone = String(value.milestone ?? '')
  form.extraJson = ''
}

function buildValue(): Record<string, unknown> {
  const value: Record<string, unknown> = {}
  if (form.key.trim()) value.key = form.key.trim()
  if (form.name.trim()) value.name = form.name.trim()
  if (form.category.trim()) value.category = form.category.trim()
  if (form.description.trim()) value.description = form.description.trim()

  const types = form.typeCsv
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
  if (types.length > 0) value.type = types

  if (typeof form.elemental === 'number' && Number.isFinite(form.elemental)) {
    value.elemental = form.elemental
  }
  if (typeof form.durable === 'number' && Number.isFinite(form.durable)) {
    value.durable = form.durable
  }
  if (form.milestone.trim()) value.milestone = form.milestone.trim()

  if (form.extraJson.trim()) {
    try {
      const extra = JSON.parse(form.extraJson) as Record<string, unknown>
      Object.assign(value, extra)
    } catch {
      // keep invalid JSON out of the output
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
