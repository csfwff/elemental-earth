<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">背景提示标识符 (ID)</legend>
        <input v-model="form.id" class="input input-sm w-full" placeholder="$tip_new" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">显示时机：绑定时代 (可选)</legend>
        <input v-model="form.era" class="input input-sm w-full" placeholder="stone_age" />
      </fieldset>

      <fieldset class="fieldset md:col-span-2">
        <legend class="fieldset-legend">触发条件：关联物品 (可选)</legend>
        <input v-model="form.item" class="input input-sm w-full" placeholder="stone" />
      </fieldset>
    </div>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">提示文本内容</legend>
      <textarea v-model="form.content" class="textarea textarea-sm w-full" rows="3" placeholder="在此输入给玩家的提示文字..."></textarea>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">高级配置/其他属性 (JSON)</legend>
      <textarea v-model="form.extraJson" class="textarea textarea-sm w-full font-mono text-xs" rows="3" placeholder='{"extra":"field"}'></textarea>
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
  id: '',
  content: '',
  era: '',
  item: '',
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
  form.id = String(value.id ?? '')
  form.content = String(value.content ?? '')
  form.era = String(value.era ?? '')
  form.item = String(value.item ?? '')
  form.extraJson = ''
}

function buildValue(): Record<string, unknown> {
  const value: Record<string, unknown> = {}
  if (form.id.trim()) value.id = form.id.trim()
  if (form.content.trim()) value.content = form.content.trim()
  if (form.era.trim()) value.era = form.era.trim()
  if (form.item.trim()) value.item = form.item.trim()

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
