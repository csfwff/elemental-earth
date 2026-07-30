<template>
  <div class="card bg-base-100 border border-base-300 shadow-sm">
    <div class="card-body p-4 gap-4">
      <h2 class="card-title text-base inline-flex items-center gap-2">
        <Icon icon="tabler:file-certificate" />
        元数据配置 (Manifest)
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">规范版本 (schemaVersion)</legend>
          <input v-model="form.schemaVersion" class="input input-sm w-full" placeholder="1" />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">Mod 唯一标识 (modId)</legend>
          <input v-model="form.modId" class="input input-sm w-full" placeholder="my-mod-name" />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">扩展包名称 (name)</legend>
          <input v-model="form.name" class="input input-sm w-full" placeholder="我的扩展包" />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">版本号 (version)</legend>
          <input v-model="form.version" class="input input-sm w-full" placeholder="1.0.0" />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">开发者 (author)</legend>
          <input v-model="form.author" class="input input-sm w-full" placeholder="作者名" />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">支持游戏版本 (gameVersionRange)</legend>
          <input v-model="form.gameVersionRange" class="input input-sm w-full" placeholder=">=1.0.0" />
        </fieldset>
      </div>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">功能描述 (description)</legend>
        <textarea v-model="form.description" class="textarea textarea-sm w-full" rows="2"></textarea>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">冲突处理逻辑 (conflictPolicy)</legend>
        <select v-model="form.conflictPolicy" class="select select-sm w-full">
          <option v-for="item in conflictPolicies" :key="item.key" :value="item.key">{{ item.label }}</option>
        </select>
      </fieldset>

      <div class="divider my-1 text-xs text-base-content/50">脚本与安全性权限 (Hooks Permissions)</div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">数据仓库访问权限 (stores)</legend>
          <select v-model="form.stores" class="select select-sm w-full">
            <option value="">禁用</option>
            <option value="all">完全访问 (All Stores)</option>
          </select>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">资源请求限制</legend>
          <div class="flex flex-col gap-2">
            <label class="label cursor-pointer justify-start gap-3">
              <input type="checkbox" class="toggle toggle-sm toggle-primary" v-model="form.dom" />
              <span class="label-text">允许页面 DOM 操作</span>
            </label>
            <label class="label cursor-pointer justify-start gap-3">
              <input type="checkbox" class="toggle toggle-sm toggle-primary" v-model="form.network" />
              <span class="label-text">允许向外部发起网络请求</span>
            </label>
          </div>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">执行超时 (timeoutMs)</legend>
          <div class="join w-full">
            <input type="number" class="input input-sm join-item grow" v-model.number="form.timeoutMs" min="0" />
            <span class="btn btn-sm join-item pointer-events-none">ms</span>
          </div>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">最大并发请求 (maxConcurrentRequests)</legend>
          <input type="number" class="input input-sm w-full" v-model.number="form.maxConcurrentRequests" min="1" />
        </fieldset>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">允许访问的域名 (allowDomains)</legend>
          <textarea v-model="form.allowDomains" class="textarea textarea-sm w-full font-mono" rows="2" placeholder="api.example.com"></textarea>
          <p class="fieldset-label text-xs">每行一个或逗号分隔</p>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">禁止访问的域名 (blockedDomains)</legend>
          <textarea v-model="form.blockedDomains" class="textarea textarea-sm w-full font-mono" rows="2"></textarea>
        </fieldset>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { ModManifest } from '@/mods/types'
import { CONFLICT_POLICIES } from '@/views/mods/builder/types'

interface ManifestForm {
  schemaVersion: string
  modId: string
  name: string
  version: string
  description: string
  author: string
  gameVersionRange: string
  conflictPolicy: ModManifest['conflictPolicy']
  stores: '' | 'all'
  dom: boolean
  network: boolean
  timeoutMs: number
  maxConcurrentRequests: number
  allowDomains: string
  blockedDomains: string
}

const props = defineProps<{
  modelValue: ModManifest
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ModManifest): void
}>()

const conflictPolicies = CONFLICT_POLICIES

const form = reactive<ManifestForm>({
  schemaVersion: '1',
  modId: '',
  name: '',
  version: '',
  description: '',
  author: '',
  gameVersionRange: '',
  conflictPolicy: 'last-write-wins',
  stores: '',
  dom: false,
  network: false,
  timeoutMs: 10000,
  maxConcurrentRequests: 4,
  allowDomains: '',
  blockedDomains: '',
})

function splitDomains(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function applyFromProps(value: ModManifest): void {
  form.schemaVersion = String(value.schemaVersion ?? 1)
  form.modId = value.modId || ''
  form.name = value.name || ''
  form.version = value.version || ''
  form.description = value.description || ''
  form.author = value.author || ''
  form.gameVersionRange = value.gameVersionRange || ''
  form.conflictPolicy = value.conflictPolicy || 'last-write-wins'
  form.stores = value.capabilities?.stores === 'all' ? 'all' : ''
  form.dom = Boolean(value.capabilities?.dom)
  form.network = Boolean(value.capabilities?.network)
  form.timeoutMs = value.networkPolicy?.timeoutMs ?? 10000
  form.maxConcurrentRequests = value.networkPolicy?.maxConcurrentRequests ?? 4
  form.allowDomains = (value.networkPolicy?.allowDomains || []).join('\n')
  form.blockedDomains = (value.networkPolicy?.blockedDomains || []).join('\n')
}

function buildManifest(): ModManifest {
  const schemaNumber = Number(form.schemaVersion)
  return {
    schemaVersion: Number.isFinite(schemaNumber) && schemaNumber > 0 ? schemaNumber : form.schemaVersion,
    modId: form.modId.trim(),
    name: form.name.trim(),
    version: form.version.trim(),
    description: form.description.trim(),
    author: form.author.trim(),
    gameVersionRange: form.gameVersionRange.trim(),
    conflictPolicy: form.conflictPolicy,
    capabilities: {
      stores: form.stores || undefined,
      dom: form.dom,
      network: form.network,
    },
    networkPolicy: {
      allowDomains: splitDomains(form.allowDomains),
      blockedDomains: splitDomains(form.blockedDomains),
      timeoutMs: Number(form.timeoutMs) || 0,
      maxConcurrentRequests: Number(form.maxConcurrentRequests) || 1,
    },
  }
}

watch(
  () => props.modelValue,
  value => {
    applyFromProps(value)
  },
  { immediate: true, deep: true },
)

watch(
  form,
  () => {
    emit('update:modelValue', buildManifest())
  },
  { deep: true },
)
</script>
