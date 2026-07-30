<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">实验操作标识符 (Key)</legend>
        <input v-model="form.key" class="input input-sm w-full" placeholder="$new_lab" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">显示名称</legend>
        <input v-model="form.name" class="input input-sm w-full" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">操作耗时 (秒)</legend>
        <input type="number" v-model.number="form.timeRequired" class="input input-sm w-full" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">里程碑点 (Milestone)</legend>
        <SearchableSelect
          v-model="form.milestone"
          clearable
          :options="lookup.milestones.value"
          placeholder="选择里程碑点..."
        />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">能源与资源需求</legend>
        <div class="flex flex-wrap gap-4">
          <label class="label cursor-pointer justify-start gap-2">
            <input type="checkbox" class="checkbox checkbox-sm checkbox-primary" v-model="form.isChain" />
            <span class="label-text">支持链式操作 (is_chain)</span>
          </label>
          <label class="label cursor-pointer justify-start gap-2">
            <input type="checkbox" class="toggle toggle-sm toggle-warning" :checked="form.requiresBurning === 'true'" @change="form.requiresBurning = ($event.target as any).checked ? 'true' : 'false'" />
            <span class="label-text">需要火源</span>
          </label>
          <label class="label cursor-pointer justify-start gap-2">
            <input type="checkbox" class="toggle toggle-sm toggle-info" :checked="form.requiresElectricity === 'true'" @change="form.requiresElectricity = ($event.target as any).checked ? 'true' : 'false'" />
            <span class="label-text">需要电力</span>
          </label>
        </div>
      </fieldset>

      <fieldset class="fieldset md:col-span-2">
        <legend class="fieldset-legend">所需前置科技</legend>
        <SearchableSelect
          v-model="form.requiredTechs"
          multiple
          :options="lookup.techs.value"
          placeholder="选择前置科技..."
        />
      </fieldset>

      <fieldset class="fieldset md:col-span-2">
        <legend class="fieldset-legend">允许附加的链式操作</legend>
        <SearchableSelect
          v-model="form.chainOps"
          multiple
          :options="lookup.labs.value"
          placeholder="选择附加链式操作..."
        />
      </fieldset>
    </div>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">实验描述</legend>
      <textarea v-model="form.description" class="textarea textarea-sm w-full" rows="2"></textarea>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">所需实验载体/容器 (required_item - JSON)</legend>
      <textarea v-model="form.requiredItemJson" class="textarea textarea-sm w-full font-mono text-xs" rows="3" placeholder='[{"key":"beaker","quantity":1}]'></textarea>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">高级配置/其他属性 (JSON)</legend>
      <textarea v-model="form.extraJson" class="textarea textarea-sm w-full font-mono text-xs" rows="3"></textarea>
    </fieldset>

    <div v-if="jsonErrors.length" class="alert alert-warning alert-soft text-xs">
      <Icon icon="tabler:alert-circle" />
      <span>配置异常：{{ jsonErrors.join('；') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, reactive, watch } from 'vue'
import SearchableSelect from '@/components/SearchableSelect.vue'
import type { BuilderPatchOperation } from '@/views/mods/builder/types'

const props = defineProps<{ modelValue: Record<string, unknown>; op: BuilderPatchOperation }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: Record<string, unknown>): void }>()

const lookup = inject<any>('builder-lookup')

const form = reactive({
  key: '',
  name: '',
  description: '',
  timeRequired: undefined as number | undefined,
  requiresBurning: '',
  requiresElectricity: '',
  requiredTechs: [] as string[],
  chainOps: [] as string[],
  isChain: false,
  milestone: '',
  requiredItemJson: '',
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
    ['required_item', parseError(form.requiredItemJson)],
    ['advanced', parseError(form.extraJson)],
  ].filter(([, err]) => err)

  return rows.map(([name, err]) => `${name}: ${err}`)
})

function applyFromValue(value: Record<string, unknown>): void {
  form.key = String(value.key ?? '')
  form.name = String(value.name ?? '')
  form.description = String(value.description ?? '')
  form.timeRequired = typeof value.time_required === 'number' ? value.time_required : undefined
  form.requiresBurning = typeof value.requires_burning === 'boolean' ? String(value.requires_burning) : ''
  form.requiresElectricity = typeof value.requires_electricity === 'boolean' ? String(value.requires_electricity) : ''
  form.requiredTechs = Array.isArray(value.required_techs) ? [...value.required_techs].map(String) : []
  form.chainOps = Array.isArray(value.chain_operations) ? [...value.chain_operations].map(String) : []
  form.isChain = Boolean(value.is_chain)
  form.milestone = String(value.milestone ?? '')
  form.requiredItemJson = Array.isArray(value.required_item) ? JSON.stringify(value.required_item, null, 2) : ''
  form.extraJson = ''
}

function buildValue(): Record<string, unknown> {
  const value: Record<string, unknown> = {}
  if (form.key.trim()) value.key = form.key.trim()
  if (form.name.trim()) value.name = form.name.trim()
  if (form.description.trim()) value.description = form.description.trim()
  if (typeof form.timeRequired === 'number') value.time_required = form.timeRequired
  if (form.requiresBurning === 'true') value.requires_burning = true
  if (form.requiresBurning === 'false') value.requires_burning = false
  if (form.requiresElectricity === 'true') value.requires_electricity = true
  if (form.requiresElectricity === 'false') value.requires_electricity = false
  if (form.milestone.trim()) value.milestone = form.milestone.trim()
  if (form.isChain) value.is_chain = true

  if (form.requiredTechs.length > 0) value.required_techs = [...form.requiredTechs]
  if (form.chainOps.length > 0) value.chain_operations = [...form.chainOps]

  if (form.requiredItemJson.trim()) {
    try {
      value.required_item = JSON.parse(form.requiredItemJson)
    } catch {
      // ignore
    }
  }

  if (form.extraJson.trim()) {
    try {
      Object.assign(value, JSON.parse(form.extraJson) as Record<string, unknown>)
    } catch {
      // ignore
    }
  }

  return value
}

watch(() => props.modelValue, value => applyFromValue(value || {}), { immediate: true, deep: true })
watch(form, () => emit('update:modelValue', buildValue()), { deep: true })
</script>
