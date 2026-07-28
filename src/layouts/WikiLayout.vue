<template>
  <div class="min-h-screen bg-base-100 font-sans text-base-content" :data-theme="theme">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/stores/modules/app';

const appStore = useAppStore();
const theme = computed(() => appStore.theme);
</script>
