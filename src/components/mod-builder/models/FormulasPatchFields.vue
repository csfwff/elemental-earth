<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">配方标识符 (Key)</legend>
        <input v-model="form.key" class="input input-sm w-full" placeholder="$new_formula" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">显示名称</legend>
        <input v-model="form.name" class="input input-sm w-full" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">基础研发耗时 (秒)</legend>
        <input type="number" v-model.number="form.timeRequired" class="input input-sm w-full" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">所需载体/容器</legend>
        <SearchableSelect
          v-model="form.requiredContainer"
          clearable
          :options="lookup.items.value"
          placeholder="选择载体/容器..."
        />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">实验操作类型</legend>
        <SearchableSelect
          v-model="form.requiredActionKey"
          clearable
          :options="lookup.actions.value"
          placeholder="选择实验操作..."
        />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">操作强度范围</legend>
        <div class="join w-full">
          <input type="number" v-model.number="form.requiredActionMin" class="input input-sm join-item w-1/2" placeholder="最小值" />
          <input type="number" v-model.number="form.requiredActionMax" class="input input-sm join-item w-1/2" placeholder="最大值" />
        </div>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">时代要求</legend>
        <SearchableSelect
          v-model="form.requiredEra"
          clearable
          :options="lookup.eras.value"
          placeholder="选择要求时代..."
        />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">耗电量 (power_consumption)</legend>
        <input type="number" step="0.01" v-model.number="form.powerConsumption" class="input input-sm w-full" />
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
    </div>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">研究描述 (已知结论)</legend>
      <textarea v-model="form.description" class="textarea textarea-sm w-full" rows="2"></textarea>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">未知结论时的碎片描述 (fragment_description)</legend>
      <textarea v-model="form.fragmentDescription" class="textarea textarea-sm w-full" rows="2"></textarea>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">反应底物/材料需求 (required_items - JSON)</legend>
      <textarea v-model="form.requiredItemsJson" class="textarea textarea-sm w-full font-mono text-xs" rows="3" placeholder='[{"key":"water","quantity":1}]'></textarea>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">反应产物 (products - JSON)</legend>
      <textarea v-model="form.productsJson" class="textarea textarea-sm w-full font-mono text-xs" rows="4" placeholder='[{"key":"steam","multiple":1}]'></textarea>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">高级属性/附加字段 (JSON)</legend>
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
  requiredContainer: '',
  requiredActionKey: '',
  requiredActionMin: undefined as number | undefined,
  requiredActionMax: undefined as number | undefined,
  requiredTechs: [] as string[],
  requiredEra: '',
  requiredItemsJson: '',
  productsJson: '',
  fragmentDescription: '',
  powerConsumption: undefined as number | undefined,
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
    ['required_items', parseError(form.requiredItemsJson)],
    ['products', parseError(form.productsJson)],
    ['advanced', parseError(form.extraJson)],
  ].filter(([, err]) => err)

  return rows.map(([name, err]) => `${name}: ${err}`)
})

function applyFromValue(value: Record<string, unknown>): void {
  form.key = String(value.key ?? '')
  form.name = String(value.name ?? '')
  form.description = String(value.description ?? '')
  form.timeRequired = typeof value.time_required === 'number' ? value.time_required : undefined
  form.requiredContainer = String(value.required_container ?? '')

  const requiredActions = (value.required_actions as Record<string, unknown> | undefined) || {}
  form.requiredActionKey = String(requiredActions.key ?? '')
  form.requiredActionMin = typeof requiredActions.min === 'number' ? requiredActions.min : undefined
  form.requiredActionMax = typeof requiredActions.max === 'number' ? requiredActions.max : undefined

  form.requiredTechs = Array.isArray(value.required_techs) ? [...value.required_techs].map(String) : []
  form.requiredEra = String(value.required_era ?? '')
  form.requiredItemsJson = Array.isArray(value.required_items) ? JSON.stringify(value.required_items, null, 2) : ''
  form.productsJson = Array.isArray(value.products) ? JSON.stringify(value.products, null, 2) : ''
  form.fragmentDescription = String(value.fragment_description ?? '')
  form.powerConsumption = typeof value.power_consumption === 'number' ? value.power_consumption : undefined
  form.extraJson = ''
}

function buildValue(): Record<string, unknown> {
  const value: Record<string, unknown> = {}
  if (form.key.trim()) value.key = form.key.trim()
  if (form.name.trim()) value.name = form.name.trim()
  if (form.description.trim()) value.description = form.description.trim()
  if (typeof form.timeRequired === 'number') value.time_required = form.timeRequired
  if (form.requiredContainer.trim()) value.required_container = form.requiredContainer.trim()

  if (form.requiredActionKey.trim() || typeof form.requiredActionMin === 'number' || typeof form.requiredActionMax === 'number') {
    value.required_actions = {
      key: form.requiredActionKey.trim(),
      min: form.requiredActionMin,
      max: form.requiredActionMax,
    }
  }

  if (form.requiredTechs.length > 0) value.required_techs = [...form.requiredTechs]
  if (form.requiredEra.trim()) value.required_era = form.requiredEra.trim()
  if (form.fragmentDescription.trim()) value.fragment_description = form.fragmentDescription.trim()
  if (typeof form.powerConsumption === 'number') value.power_consumption = form.powerConsumption

  if (form.requiredItemsJson.trim()) {
    try {
      value.required_items = JSON.parse(form.requiredItemsJson)
    } catch {
      // ignore
    }
  }

  if (form.productsJson.trim()) {
    try {
      value.products = JSON.parse(form.productsJson)
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
