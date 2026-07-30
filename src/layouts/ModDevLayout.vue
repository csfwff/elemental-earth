<template>
  <div class="min-h-screen bg-base-100 text-base-content" :data-theme="theme">
    <header class="navbar bg-base-200 border-b border-base-300 px-4 sticky top-0 z-20">
      <div class="navbar-start gap-2">
        <router-link to="/settings" class="btn btn-ghost btn-sm gap-2">
          <Icon icon="tabler:arrow-left" />
          返回设置
        </router-link>
      </div>
      <div class="navbar-center">
        <h1 class="text-lg font-bold inline-flex items-center gap-2">
          <Icon icon="tabler:puzzle" />
          Mod 开发中心
        </h1>
      </div>
      <div class="navbar-end">
        <div class="join">
          <router-link to="/mods" class="btn btn-sm join-item" :class="{ 'btn-neutral': $route.name === 'ModDevHome' }">
            教程
          </router-link>
          <router-link to="/mods/builder" class="btn btn-sm join-item" :class="{ 'btn-neutral': $route.name === 'ModDevBuilder' }">
            生成器
          </router-link>
        </div>
      </div>
    </header>

    <main class="p-4 md:p-6">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/modules/app'

const appStore = useAppStore()
const theme = computed(() => appStore.theme)
</script>
