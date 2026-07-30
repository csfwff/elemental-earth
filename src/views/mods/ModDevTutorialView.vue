<template>
  <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4">
    <aside class="lg:col-span-3 space-y-3">
      <div class="card bg-base-200 shadow-sm border border-base-300 sticky top-20">
        <div class="card-body p-4">
          <h2 class="card-title text-base inline-flex items-center gap-2">
            <Icon icon="tabler:list-details" />
            教程目录
          </h2>
          <div class="space-y-1 max-h-[50vh] overflow-auto pr-1">
            <button
              v-for="item in toc"
              :key="item.id"
              @click="scrollTo(item.id)"
              class="btn btn-ghost btn-sm w-full justify-start font-normal"
              :class="item.level > 2 ? 'pl-6' : ''"
            >
              {{ item.text }}
            </button>
          </div>
          <div class="divider my-2"></div>
          <router-link to="/mods/builder" class="btn btn-sm btn-primary w-full gap-2">
            <Icon icon="tabler:wand" />
            前往生成器
          </router-link>
        </div>
      </div>
    </aside>

    <section class="lg:col-span-9">
      <div class="card bg-base-100 border border-base-300 shadow-sm">
        <div class="card-body p-4 md:p-6 gap-4">
          <h1 class="text-2xl font-bold inline-flex items-center gap-2">
            <Icon icon="tabler:book-2" />
            Mod 开发教程
          </h1>
          <div class="alert alert-warning alert-soft text-sm">
            <Icon icon="tabler:shield-alert" />
            <span>Full Trust 脚本可访问 Store、DOM 与网络，仅加载可信 Mod。</span>
          </div>
          <article class="mod-doc" v-html="html"></article>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { renderMarkdown } from '@/utils/function'
import modDoc from '../../../MOD_DEVELOPMENT.md?raw'

interface TocItem {
  id: string
  text: string
  level: number
}

const html = ref('')
const toc = ref<TocItem[]>([])

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

onMounted(() => {
  const rawHtml = renderMarkdown(modDoc)
  const parser = new DOMParser()
  const doc = parser.parseFromString(rawHtml, 'text/html')
  const used = new Set<string>()
  const headings = doc.querySelectorAll('h1, h2, h3')

  const nextToc: TocItem[] = []
  headings.forEach(node => {
    const text = node.textContent?.trim() || ''
    if (!text) return

    let id = slugify(text)
    if (!id) id = `section-${nextToc.length + 1}`
    if (used.has(id)) {
      id = `${id}-${nextToc.length + 1}`
    }
    used.add(id)

    node.id = id
    nextToc.push({
      id,
      text,
      level: Number(node.tagName.slice(1)),
    })
  })

  toc.value = nextToc
  html.value = doc.body.innerHTML
})
</script>

<style scoped>
.mod-doc {
  color: var(--color-base-content);
  font-size: 0.95rem;
  line-height: 1.6;
}
.mod-doc :deep(h1),
.mod-doc :deep(h2),
.mod-doc :deep(h3) {
  scroll-margin-top: 6rem;
  margin-bottom: 0.5rem;
}

.mod-doc :deep(h1) {
  font-size: 1.75rem;
  font-weight: 700;
  margin-top: 1.25rem;
}

.mod-doc :deep(h2) {
  font-size: 1.3rem;
  font-weight: 700;
  margin-top: 1.25rem;
}

.mod-doc :deep(h3) {
  font-size: 1.05rem;
  font-weight: 600;
  margin-top: 1rem;
}

.mod-doc :deep(ul) {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
  list-style: '- ';
}

.mod-doc :deep(ol) {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
  list-style: decimal;
}

.mod-doc :deep(p),
.mod-doc :deep(li),
.mod-doc :deep(td),
.mod-doc :deep(th) {
  line-height: 1.7;
}

.mod-doc :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.75rem 0;
}

.mod-doc :deep(th),
.mod-doc :deep(td) {
  border: 1px solid color-mix(in oklab, var(--color-base-content) 20%, transparent);
  padding: 0.5rem;
  font-size: 0.9rem;
}

.mod-doc :deep(code) {
  font-size: 0.85rem;
  background: var(--color-base-300);
  padding: 0.2rem 0.3rem;
  border-radius: 0.25rem;
}

.mod-doc :deep(pre) {
  background: var(--color-base-300);
  border: 1px solid color-mix(in oklab, var(--color-base-content) 20%, transparent);
  border-radius: 0.5rem;
  padding: 0.75rem;
  overflow: auto;
  margin: 1em 0;
}
</style>
