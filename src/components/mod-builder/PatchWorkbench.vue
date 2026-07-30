<template>
  <div class="card bg-base-100 border border-base-300 shadow-sm">
    <div class="card-body p-4 gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="card-title text-base inline-flex items-center gap-2">
          <Icon icon="tabler:stack-3" />
          Patch 工作台
        </h2>
        <div class="join ml-auto">
          <button class="btn btn-sm join-item" @click="emit('add-row')">
            <Icon icon="tabler:plus" />
            新增补丁
          </button>
        </div>
      </div>

      <div class="text-xs text-base-content/70">
        已禁用 remove 操作；当前版本仅支持 add / override / merge。
      </div>

      <div v-if="rows.length === 0" class="alert alert-info alert-soft text-sm">
        <Icon icon="tabler:info-circle" />
        <span>还没有补丁，点击“新增补丁”开始配置。</span>
      </div>

      <div v-else class="space-y-3">
        <PatchRowEditor
          v-for="row in rows"
          :key="row.id"
          :row="row"
          @update="next => emit('update-row', next)"
          @remove="id => emit('remove-row', id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BuilderPatchRow } from '@/views/mods/builder/types'
import PatchRowEditor from './PatchRowEditor.vue'

defineProps<{
  rows: BuilderPatchRow[]
}>()

const emit = defineEmits<{
  (e: 'add-row'): void
  (e: 'update-row', row: BuilderPatchRow): void
  (e: 'remove-row', id: string): void
}>()
</script>
