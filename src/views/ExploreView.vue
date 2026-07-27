<template>
  <div class="p-4 mx-auto space-y-4 inline-flex flex-col">
    <header class="mb-4 flex items-center gap-3 flex-wrap">
      <h1 class="text-xl font-bold flex items-center gap-2">
        <Icon icon="tabler:atom" class="text-2xl" />
        元素周期表
      </h1>
      <span class="badge badge-outline text-xs">
        已点亮 {{ litElements.length }} / 118 个元素
      </span>
    </header>

    <!-- ─── Periodic Table ──────────────────────────────────────────────────── -->
    <div class="relative" ref="tableWrapper">
      <PeriodicTable
        :litElements="litElements"
        :implementedElements="implementedElements"
        :categoryColors="categoryColors"
        @click-element="handleElementClick"
      />

    <!-- ─── Selected element detail popover ─────────────────────────────────── -->
    <Transition name="popover">
      <div v-if="activeElement && showPopover" class="element-popover-root">
        <!-- Mobile Backdrop -->
        <div v-if="isMobile" class="popover-backdrop" @click="closePopover"></div>
        
        <div
          class="element-popover card bg-base-200 shadow-xl border border-base-300"
          :class="[isMobile ? 'popover-mobile' : 'popover-desktop']"
          :style="popoverStyle"
          v-click-outside="closePopover"
        >
          <div
            class="card-body p-4 overflow-y-auto max-h-[70vh] md:max-h-none"
            :style="{ borderTop: isMobile ? `4px solid ${elementColor(activeElement)}` : 'none', borderLeft: !isMobile ? `4px solid ${elementColor(activeElement)}` : 'none' }"
          >
              <div class="flex items-center justify-between mb-2 md:hidden">
                <h3 class="font-bold">元素详情</h3>
                <button class="btn btn-ghost btn-xs btn-circle" @click="closePopover">✕</button>
              </div>

              <div class="flex items-center gap-4">
                <div
                  class="w-16 h-20 rounded flex flex-col items-center justify-center text-white shrink-0"
                  :style="{ backgroundColor: elementColor(activeElement) }"
                >
                  <span class="text-xs opacity-75">{{ activeElement.number }}</span>
                  <span class="text-2xl font-bold leading-tight">{{ activeElement.symbol }}</span>
                  <span class="text-sm">{{ activeElement.name }}</span>
                </div>
                <div class="overflow-hidden">
                  <p class="font-bold text-lg truncate">{{ activeElement.nameEn }}</p>
                  <p class="text-xs opacity-60">原子量：{{ activeElement.mass }}</p>
                  <p class="text-xs opacity-60">分类：{{ CATEGORY_LABELS[activeElement.category] }}</p>
                </div>
              </div>

              <!-- 元素故事 -->
              <div v-if="activeElement.story" class="mt-4 pt-4 border-t border-base-content/10">
                <p class="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Icon icon="mdi:script-text-outline" class="text-xs" />
                  探索笔记
                </p>
                <div 
                  class="markdown-content text-sm leading-relaxed opacity-90 font-serif italic"
                  v-html="renderMarkdown(activeElement.story)"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import PeriodicTable from '@/components/PeriodicTable.vue'
import {
  ELEMENTS,
  DEFAULT_CATEGORY_COLORS,
  CATEGORY_LABELS,
  type PeriodicElement,
  type ElementCategory,
} from '@/data/elements'
import { useStateStore } from '@/stores/modules/state';
import { Items } from '@/data/items';
import { computed } from 'vue';
import { renderMarkdown } from '@/utils/function';
import { vOnClickOutside as vClickOutside } from '@vueuse/components'

// ─────────────────────────────────────────────────────────────────────────────
//  Configuration variable — modify this array to control which elements are lit.
//  Values are atomic numbers (1–118).
// ─────────────────────────────────────────────────────────────────────────────
const stateStore = useStateStore();
const litElements = ref<number[]>(stateStore.state.elements || []);

// Find atomic numbers of elements that are implemented as items
const implementedElements = computed(() => {
  const itemKeys = new Set(Items.map(i => i.elemental).filter(Boolean));
  return ELEMENTS
    .filter(el => el.number > 0 && itemKeys.has(el.number))
    .map(el => el.number);
});

// ─────────────────────────────────────────────────────────────────────────────
//  Optional: override category colours.
//  Keys are ElementCategory strings; values are any valid CSS color.
// ─────────────────────────────────────────────────────────────────────────────
const categoryColors = ref<Partial<Record<ElementCategory, string>>>({
  // Uncomment and edit to override defaults:
  // 'transition-metal': '#60a5fa',
})

// ─── Interactivity ────────────────────────────────────────────────────────────

const activeElement = ref<PeriodicElement | null>(null)
const showPopover = ref(false)
const tableWrapper = ref<HTMLElement | null>(null)
const popoverCoord = ref({ top: 0, left: 0, placement: 'bottom' })
const isMobile = ref(false)

function updateIsMobile() {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile)
})

function elementColor(el: PeriodicElement): string {
  return { ...DEFAULT_CATEGORY_COLORS, ...categoryColors.value }[el.category] ?? '#6b7280'
}

function handleElementClick(el: PeriodicElement, event: MouseEvent) {
  // 仅允许点击已解锁的元素
  if (!litElements.value.includes(el.number)) return

  activeElement.value = el
  showPopover.value = true

  if (isMobile.value) return

  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const wrapper = tableWrapper.value
  if (!wrapper) return

  const wrapperRect = wrapper.getBoundingClientRect()
  
  // Calculate relative to tableWrapper
  let top = rect.bottom - wrapperRect.top + 8
  let left = rect.left - wrapperRect.left
  let placement = 'bottom'
  
  // Horizontal flip
  if (el.col > 12) {
    left = rect.left - wrapperRect.left - 320 + rect.width
    placement = 'left'
  } else if (el.col > 9) {
    left = rect.left - wrapperRect.left - 160 + rect.width / 2
  }

  // Vertical flip
  if (el.row > 5) {
    top = rect.top - wrapperRect.top - 8
    placement = 'top'
  }

  popoverCoord.value = { top, left, placement }
}

function closePopover() {
  showPopover.value = false
}

const popoverStyle = computed(() => {
  if (isMobile.value) return {}
  
  const { top, left, placement } = popoverCoord.value
  return {
    top: `${top}px`,
    left: `${left}px`,
    ...(placement === 'top' ? { transform: 'translateY(-100%)' } : {})
  }
})
</script>

<style scoped>
.explore-view {
  padding-bottom: 2rem;
}

.element-popover-root {
  z-index: 100;
}

.popover-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  z-index: 1000;
}

.element-popover {
  z-index: 1001;
  width: 320px;
}

.popover-desktop {
  position: absolute;
}

.popover-mobile {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 400px;
}

.markdown-content :deep(p) {
  margin-bottom: 0.5em;
}

.markdown-content :deep(strong) {
  color: var(--color-primary);
}

.popover-enter-active,
.popover-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.popover-mobile.popover-enter-from,
.popover-mobile.popover-leave-to {
  transform: translate(-50%, -40%) scale(0.95);
}
</style>
