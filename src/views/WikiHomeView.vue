<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-base-100">
    <div class="w-full max-w-2xl flex flex-col items-center gap-12">
      <!-- Logo Section -->
      <div class="flex flex-col items-center gap-4 cursor-pointer" @click="router.push('/')">
        <div class="w-24 h-24 rounded-3xl flex items-center justify-center rotate-12 hover:rotate-0 transition-transform duration-500">
          <Icon icon="pinhead:bohr-atomic-model" class="text-primary" size="6em" />
        </div>
        <h1 class="text-4xl font-bold tracking-tighter">
          元素<span class="text-primary">纪元</span>
          <span class="text-xs align-top opacity-50 ml-1 font-normal tracking-normal">Wiki</span>
        </h1>
      </div>

      <!-- Search Section -->
      <div class="w-full relative group">
        <label class="input input-xl input-bordered flex items-center gap-4 shadow-xl focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-base-200/50 border-none group-hover:bg-base-200 m-auto">
          <Icon icon="tabler:search" class="opacity-40 text-2xl" />
          <input 
            type="text" 
            class="grow text-lg" 
            placeholder="搜索物品..." 
            v-model="searchQuery"
            @focus="showResults = true"
            @keydown.down.prevent="moveSelection(1)"
            @keydown.up.prevent="moveSelection(-1)"
            @keydown.enter="selectItem(results[selectedIndex])"
          />
          <kbd class="kbd kbd-sm opacity-20 hidden md:inline-flex">Enter</kbd>
        </label>

        <!-- Search Results -->
        <div 
          v-if="showResults && results.length > 0"
          v-click-outside="() => showResults = false"
          class="absolute top-full left-0 w-full mt-2 bg-base-100 border border-base-content/5 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div class="max-h-96 overflow-y-auto p-2 space-y-1">
            <button
              v-for="(item, idx) in results"
              :key="item.key"
              class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 transition-colors text-left group"
              :class="{ 'bg-primary/10 text-primary ring-1 ring-primary/20': idx === selectedIndex }"
              @mouseenter="selectedIndex = idx"
              @click="selectItem(item)"
            >
              <div class="w-10 h-10 rounded-lg bg-base-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon :icon="getItemIcon(item)" class="text-xl" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-bold truncate">{{ item.name }}</div>
                <div class="text-xs opacity-50 truncate">{{ item.description || '暂无描述' }}</div>
              </div>
              <div class="badge badge-sm badge-ghost opacity-40 font-mono">{{ item.key }}</div>
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Links / Recent -->
      <div v-if="recentItems.length > 0" class="flex flex-wrap justify-center gap-2 opacity-40 text-sm">
        <span>最近搜索:</span>
        <button 
          v-for="item in recentItems" 
          :key="item.key"
          class="hover:text-primary hover:underline transition-colors" 
          @click="selectItem(item)"
        >
          {{ item.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import itemsData from '@/data/items.json';

const router = useRouter();
const searchQuery = ref('');
const showResults = ref(false);
const selectedIndex = ref(0);

const recentKeys = ref<string[]>([]);
const recentItems = computed(() => {
  return recentKeys.value
    .map(key => (itemsData as any[]).find(i => i.key === key))
    .filter(Boolean) as any[];
});

onMounted(() => {
  recentKeys.value = JSON.parse(localStorage.getItem('wiki_recent_searches') || '[]');
});

const results = computed(() => {
  if (!searchQuery.value.trim()) return [];
  const q = searchQuery.value.toLowerCase();
  return (itemsData as any[])
    .filter(i => 
      i.name.toLowerCase().includes(q) || 
      i.key.toLowerCase().includes(q)
    )
    .slice(0, 10);
});

watch(results, () => {
  selectedIndex.value = 0;
});

function moveSelection(dir: number) {
  if (results.value.length === 0) return;
  selectedIndex.value = (selectedIndex.value + dir + results.value.length) % results.value.length;
}

function selectItem(item: any) {
  if (!item) return;

  // Update recent searches
  const newRecent = [item.key, ...recentKeys.value.filter(k => k !== item.key)].slice(0, 6);
  recentKeys.value = newRecent;
  localStorage.setItem('wiki_recent_searches', JSON.stringify(newRecent));

  router.push(`/wiki/${item.key}`);
}

function getItemIcon(item: any) {
  if (item.elemental) return 'tabler:atom-2';
  if (item.type?.includes('tool')) return 'tabler:hammer';
  return 'tabler:package';
}

// Directive for clicking outside
const vClickOutside = {
  mounted(el: any, binding: any) {
    el.clickOutsideEvent = (event: any) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    document.addEventListener("click", el.clickOutsideEvent);
  },
  unmounted(el: any) {
    document.removeEventListener("click", el.clickOutsideEvent);
  },
};
</script>
