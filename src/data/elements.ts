import elements from './elements.json';

// ─── Element types ────────────────────────────────────────────────────────────
export type ElementCategory =
  | 'alkali-metal'
  | 'alkaline-earth-metal'
  | 'transition-metal'
  | 'post-transition-metal'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble-gas'
  | 'lanthanide'
  | 'actinide'
  | 'placeholder'

export interface PeriodicElement {
  /** Atomic number (≥ 1). Placeholder entries use −1 / −2. */
  number: number
  /** Chemical symbol, e.g. "H", "He" */
  symbol: string
  /** Chinese name */
  name: string
  /** English name */
  nameEn: string
  category: ElementCategory
  /** Grid row 1–7 (main periods), 9 (lanthanides), 10 (actinides) */
  row: number
  /** Grid column 1–18 */
  col: number
  /** Standard atomic weight, e.g. "1.008" */
  mass: string
  /** Element discovery story (Markdown) */
  story?: string
}

// ─── Category display config ──────────────────────────────────────────────────

/**
 * Background color for each category when an element is "lit".
 * Override by passing `categoryColors` prop to <PeriodicTable>.
 */
export const DEFAULT_CATEGORY_COLORS: Record<ElementCategory, string> = {
  'alkali-metal':          '#ef4444', // red-500
  'alkaline-earth-metal':  '#f97316', // orange-500
  'transition-metal':      '#3b82f6', // blue-500
  'post-transition-metal': '#14b8a6', // teal-500
  'metalloid':             '#eab308', // yellow-500
  'nonmetal':              '#22c55e', // green-500
  'halogen':               '#a855f7', // purple-500
  'noble-gas':             '#06b6d4', // cyan-500
  'lanthanide':            '#ec4899', // pink-500
  'actinide':              '#f43f5e', // rose-500
  'placeholder':           'transparent',
}

export const CATEGORY_LABELS: Record<ElementCategory, string> = {
  'alkali-metal':          '碱金属',
  'alkaline-earth-metal':  '碱土金属',
  'transition-metal':      '过渡金属',
  'post-transition-metal': '后过渡金属',
  'metalloid':             '类金属',
  'nonmetal':              '非金属',
  'halogen':               '卤素',
  'noble-gas':             '稀有气体',
  'lanthanide':            '镧系元素',
  'actinide':              '锕系元素',
  'placeholder':           '',
}

// ─── Element data ─────────────────────────────────────────────────────────────

export const ELEMENTS: PeriodicElement[] = elements as PeriodicElement[]

/** Return the element with the given atomic number, or undefined. */
export function getElementById(number: number): PeriodicElement | undefined {
  return ELEMENTS.find((e) => e.number === number)
}
