<template>
  <div class="min-h-screen bg-base-100 flex flex-col">
    <!-- Top Navbar -->
    <header class="sticky top-0 z-40 w-full border-b border-base-content/5 bg-base-100/90 backdrop-blur-md">
      <div class="container mx-auto px-4 h-16 flex items-center gap-4">
        <!-- Compact Logo -->
        <div class="flex items-center gap-2 cursor-pointer group" @click="router.push('/wiki')">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
            <Icon icon="pinhead:bohr-atomic-model" class="text-primary" size="1.5em" />
          </div>
          <span class="font-bold text-lg tracking-tight hidden sm:inline-block">元素纪元 <span class="text-primary font-normal tracking-normal">Wiki</span></span>
        </div>

        <!-- Search Bar -->
        <div class="flex-1 max-w-xl relative mx-auto group">
          <label class="input input-sm input-bordered flex items-center gap-2 bg-base-200/50 border-none w-full transition-all focus-within:ring-1 focus-within:ring-primary/30">
            <Icon icon="tabler:search" class="opacity-40" />
            <input 
              type="text" 
              class="grow" 
              placeholder="搜索更多..." 
              v-model="searchQuery"
              @focus="showResults = true"
              @keydown.enter="selectItem(results[selectedIndex])"
              @keydown.down.prevent="moveSelection(1)"
              @keydown.up.prevent="moveSelection(-1)"
            />
          </label>
          <!-- Search Results Dropdown -->
          <div 
            v-if="showResults && results.length > 0"
            v-click-outside="() => showResults = false"
            class="absolute top-full left-0 w-full mt-2 bg-base-100 border border-base-content/5 shadow-2xl rounded-xl overflow-hidden z-50 p-1"
          >
            <button
              v-for="(item, idx) in results"
              :key="item.key"
              class="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-base-200 transition-colors text-left text-sm"
              :class="{ 'bg-primary/10 text-primary': idx === selectedIndex }"
              @mouseenter="selectedIndex = idx"
              @click="selectItem(item)"
            >
              <div class="w-6 h-6 rounded flex items-center justify-center bg-base-300">
                <Icon :icon="getItemIcon(item)" class="text-xs" />
              </div>
              <span class="flex-1 truncate">{{ item.name }}</span>
              <span class="text-[10px] opacity-30 font-mono">{{ item.key }}</span>
            </button>
          </div>
        </div>

        <button class="btn btn-ghost btn-circle btn-sm" @click="router.push('/')">
          <Icon icon="tabler:home" />
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 container mx-auto px-4 py-8">
      <div v-if="!item" class="flex flex-col items-center justify-center py-20 opacity-30 italic">
        <Icon icon="tabler:error-404" size="64" />
        <p class="mt-4">物品不存在</p>
        <button class="btn btn-primary btn-sm mt-4" @click="router.push('/wiki')">返回百科首页</button>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        <!-- Info Sidebar -->
        <aside class="space-y-6">
          <div class="card bg-base-200/50 border border-base-content/5 shadow-sm overflow-hidden">
            <div class="h-24 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative overflow-hidden">
              <Icon :icon="getItemIcon(item)" size="6em" class="text-6xl text-primary/20 absolute rotate-12 scale-150 -right-4 -bottom-4" />
              <Icon :icon="getItemIcon(item)" size="4em" class="text-4xl text-primary drop-shadow-lg" />
            </div>
            <div class="card-body p-6">
              <h2 class="text-2xl font-bold flex items-center gap-2">
                {{ item.name }}
                <span v-if="item.elemental" class="badge badge-primary badge-sm">#{{ item.elemental }}</span>
              </h2>
              <div class="text-xs font-mono opacity-40 uppercase tracking-widest">{{ item.key }}</div>
              
              <p class="text-sm mt-4 leading-relaxed opacity-70">
                {{ item.description || '这件物品似乎没有什么特别的记载。' }}
              </p>

              <div class="divider opacity-10"></div>

              <div class="space-y-4">
                <div v-if="elementInfo" class="flex items-center justify-between text-sm">
                  <span class="opacity-50">对应元素</span>
                  <span class="font-bold text-primary">{{ elementInfo.name }} ({{ elementInfo.symbol }})</span>
                </div>
                <div v-if="item.category" class="flex items-center justify-between text-sm">
                  <span class="opacity-50">分类</span>
                  <span class="font-medium text-info">{{ item.category }}</span>
                </div>
                <div v-if="recommendedEra && recommendedEra.key !== item.required_era" class="flex items-center justify-between text-sm">
                  <span class="opacity-50">时代</span>
                  <span class="badge badge-accent font-bold">{{ recommendedEra.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- Dependency Tree View -->
        <section class="lg:col-span-3">
          <div class="card bg-base-200/20 border border-base-content/5 min-h-[600px]">
            <div class="p-6 border-b border-base-content/5 flex justify-between items-center bg-base-200/30">
              <div class="flex items-center gap-3">
                <div class="w-1.5 h-6 bg-primary rounded-full"></div>
                <h3 class="font-bold">生产依赖树</h3>
              </div>
            </div>
            
            <div class="p-6 overflow-x-auto">
              <div v-if="rootNode" class="inline-block min-w-full">
                <DependencyNode 
                  :node="rootNode" 
                  :depth="0" 
                  :isRoot="true" 
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Footer -->
    <footer class="py-12 border-t border-base-content/5 mt-auto">
      <div class="container mx-auto px-4 text-center">
        <div class="flex items-center justify-center gap-2 opacity-50 mb-4">
          <Icon icon="game-icons:atom-core text-xl" />
          <span class="font-bold tracking-widest text-sm uppercase">Elemental Earth</span>
        </div>
        <p class="text-xs opacity-30">© 2026 Crafted with Alchemy.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, provide, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import itemsData from '@/data/items.json';
import elementsData from '@/data/elements.json';
import erasData from '@/data/eras.json';
import DependencyNode from './admin/types/components/DependencyNode.vue';
import RequirementSummary from './admin/types/components/RequirementSummary.vue';
import { useProductionTree } from '@/hook/useProductionTree';

const route = useRoute();
const router = useRouter();
const itemKey = ref(route.params.key as string);
const targetQuantity = ref(1);

const searchQuery = ref('');
const showResults = ref(false);
const selectedIndex = ref(0);

const item = computed(() => (itemsData as any[]).find(i => i.key === itemKey.value));
const elementInfo = computed(() => {
  if (!item.value?.elemental) return null;
  return (elementsData as any[]).find(e => e.number === item.value.elemental);
});

const pathOverrides = ref<Record<string, string>>({});
const requestedLocationKey = ref<string | null>(null);

const { resolveItem, totalTechs, globalProcessedTechs } = useProductionTree(pathOverrides);
const rootNode = ref<any>(null);

provide('requestedLocationKey', requestedLocationKey);
provide('pathOverrides', {
  overrides: pathOverrides,
  update: (key: string, methodKey: string) => {
    pathOverrides.value[key] = methodKey;
    buildTree();
  }
});

const recommendedEra = computed(() => {
  if (!rootNode.value?.era) return null;
  return (erasData as any[]).find(e => e.key === rootNode.value.era);
});

onMounted(() => {
  buildTree();
});

watch(() => route.params.key, (newVal) => {
  if (newVal) {
    itemKey.value = newVal as string;
    pathOverrides.value = {};
    buildTree();
    // Record search
    const history = JSON.parse(localStorage.getItem('wiki_recent_searches') || '[]');
    const newHistory = [newVal, ...history.filter((k: string) => k !== newVal)].slice(0, 5);
    localStorage.setItem('wiki_recent_searches', JSON.stringify(newHistory));
  }
});

function buildTree() {
  if (!item.value) return;
  totalTechs.value = new Set();
  globalProcessedTechs.clear();
  rootNode.value = resolveItem(itemKey.value, targetQuantity.value, new Set());
}

function getEraName(key: string) {
  if (!key) return '石器时代';
  const eras = erasData as any[];
  const eraIndex = eras.findIndex(e => e.key === key);
  if (eraIndex === -1) return key;
  const names = ['石器时代', '炼金时代', '现代化学', '电化学时代', '稀土时代', '原子时代'];
  return names[eraIndex] || key;
}

function goToAdminDetail() {
  if (item.value?.elemental) {
    router.push(`/admin/elements/${item.value.elemental}`);
  } else {
    router.push(`/admin/items/${item.value.key}`);
  }
}

// Search Logic
const results = computed(() => {
  if (!searchQuery.value.trim()) return [];
  const q = searchQuery.value.toLowerCase();
  return (itemsData as any[])
    .filter(i => 
      i.name.toLowerCase().includes(q) || 
      i.key.toLowerCase().includes(q)
    )
    .slice(0, 8);
});

watch(results, () => selectedIndex.value = 0);

function moveSelection(dir: number) {
  if (results.value.length === 0) return;
  selectedIndex.value = (selectedIndex.value + dir + results.value.length) % results.value.length;
}

function selectItem(target: any) {
  if (!target) return;
  showResults.value = false;
  searchQuery.value = '';
  router.push(`/wiki/${target.key}`);
}

function getItemIcon(i: any) {
  if (!i) return 'tabler:box';
  if (i.elemental) return 'tabler:atom-2';
  if (i.type?.includes('tool')) return 'tabler:hammer';
  return 'tabler:package';
}

function recordRecent(key: string) {
  if (!key) return;
  const recent = JSON.parse(localStorage.getItem('wiki_recent_searches') || '[]');
  const newRecent = [key, ...recent.filter((k: string) => k !== key)].slice(0, 6);
  localStorage.setItem('wiki_recent_searches', JSON.stringify(newRecent));
}

watch(() => route.params.key, (newKey) => {
  if (newKey) {
    itemKey.value = newKey as string;
    buildTree();
    recordRecent(newKey as string);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

onMounted(() => {
  buildTree();
  if (itemKey.value) recordRecent(itemKey.value);
});

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

<style scoped>
.animate-in {
  animation: animate-in 0.2s ease-out;
}
@keyframes animate-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
