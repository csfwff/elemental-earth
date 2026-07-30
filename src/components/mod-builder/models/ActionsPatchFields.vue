<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">动作标识符 (Key)</legend>
        <input v-model="form.key" class="input input-sm w-full" placeholder="$new_action" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">显示名称</legend>
        <input v-model="form.name" class="input input-sm w-full" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">分类</legend>
        <input v-model="form.category" class="input input-sm w-full" placeholder="采集 / 制作 / 其他" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">所需时间 (秒)</legend>
        <input type="number" v-model.number="form.timeRequired" class="input input-sm w-full" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">冷却时间 (秒)</legend>
        <input type="number" v-model.number="form.cooldown" class="input input-sm w-full" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">可用地图</legend>
        <SearchableSelect
          v-model="form.maps"
          multiple
          :options="lookup.maps.value"
          placeholder="选择可用地图..."
        />
      </fieldset>

      <fieldset class="fieldset md:col-span-2">
        <legend class="fieldset-legend">前置科技</legend>
        <SearchableSelect
          v-model="form.requiredTechs"
          multiple
          :options="lookup.techs.value"
          placeholder="选择前置科技..."
        />
      </fieldset>
    </div>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">功能描述</legend>
      <textarea v-model="form.description" class="textarea textarea-sm w-full" rows="2"></textarea>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">物品消耗逻辑 (required_items - JSON)</legend>
      <textarea v-model="form.requiredItemsJson" class="textarea textarea-sm w-full font-mono text-xs" rows="3" placeholder='[{"key":"stone","quantity":1}]'></textarea>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">奖励产出逻辑 (rewards - JSON)</legend>
      <textarea v-model="form.rewardsJson" class="textarea textarea-sm w-full font-mono text-xs" rows="4" placeholder='[{"key":"stone","quantity":1,"probability":1000}]'></textarea>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">高级属性 (JSON)</legend>
      <textarea v-model="form.extraJson" class="textarea textarea-sm w-full font-mono text-xs" rows="3"></textarea>
    </fieldset>

    <div v-if="jsonErrors.length" class="alert alert-warning alert-soft text-xs">
      <Icon icon="tabler:alert-circle" />
      <span>JSON 校验异常：{{ jsonErrors.join('；') }}</span>
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
  category: '',
  description: '',
  timeRequired: undefined as number | undefined,
  cooldown: undefined as number | undefined,
  maps: [] as string[],
  requiredTechs: [] as string[],
  requiredItemsJson: '',
  rewardsJson: '',
  extraJson: '',
})

function checkJson(raw: string): string {
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
    ['required_items', checkJson(form.requiredItemsJson)],
    ['rewards', checkJson(form.rewardsJson)],
    ['advanced', checkJson(form.extraJson)],
  ].filter(([, err]) => err)

  return rows.map(([field, err]) => `${field}: ${err}`)
})

function applyFromValue(value: Record<string, unknown>): void {
  form.key = String(value.key ?? '')
  form.name = String(value.name ?? '')
  form.category = String(value.category ?? '')
  form.description = String(value.description ?? '')
  form.timeRequired = typeof value.time_required === 'number' ? value.time_required : undefined
  form.cooldown = typeof value.cooldown === 'number' ? value.cooldown : undefined
  form.maps = Array.isArray(value.map) ? [...value.map].map(String) : []
  form.requiredTechs = Array.isArray(value.required_techs) ? [...value.required_techs].map(String) : []
  form.requiredItemsJson = Array.isArray(value.required_items) ? JSON.stringify(value.required_items, null, 2) : ''
  form.rewardsJson = Array.isArray(value.rewards) ? JSON.stringify(value.rewards, null, 2) : ''
  form.extraJson = ''
}

function buildValue(): Record<string, unknown> {
  const value: Record<string, unknown> = {}
  if (form.key.trim()) value.key = form.key.trim()
  if (form.name.trim()) value.name = form.name.trim()
  if (form.category.trim()) value.category = form.category.trim()
  if (form.description.trim()) value.description = form.description.trim()
  if (typeof form.timeRequired === 'number') value.time_required = form.timeRequired
  if (typeof form.cooldown === 'number') value.cooldown = form.cooldown

  if (form.maps.length > 0) value.map = [...form.maps]
  if (form.requiredTechs.length > 0) value.required_techs = [...form.requiredTechs]

  if (form.requiredItemsJson.trim()) {
    try {
      value.required_items = JSON.parse(form.requiredItemsJson)
    } catch {
      // ignore invalid json
    }
  }

  if (form.rewardsJson.trim()) {
    try {
      value.rewards = JSON.parse(form.rewardsJson)
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
