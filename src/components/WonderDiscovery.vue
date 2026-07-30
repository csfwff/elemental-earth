<template>
  <Teleport to="body">
    <Transition name="wonder-overlay-fade">
      <div v-if="visible" class="wonder-discovery-overlay" @click="onOverlayClick">
        <!-- 背景动效：金色光雨与粒子 -->
        <div class="wonder-background">
          <div class="glow-orb" />
          <div class="golden-sparkles">
            <span v-for="i in 50" :key="i" class="sparkle" :style="sparkleStyle(i)" />
          </div>
        </div>

        <div class="wonder-stage">
          <!-- 阶段 1: 震撼登场（光爆 + 标题） -->
          <Transition name="wonder-title">
            <div v-if="stage >= 1" class="wonder-header">
              <div class="wonder-subtitle">造物奇迹已达成</div>
              <h1 class="wonder-main-title">{{ actionData?.name }}</h1>
              <div class="wonder-decoration">
                <span class="line left" />
                <span class="diamond" />
                <span class="line right" />
              </div>
            </div>
          </Transition>

          <!-- 阶段 2: 奇观本体展示 -->
          <Transition name="wonder-body">
            <div v-if="stage >= 2" class="wonder-content">
              <!-- 奇观标识 -->
              <div class="wonder-icon-wrapper">
                <div class="wonder-icon-glow" />
                <div class="wonder-icon-inner">
                  <span class="wonder-emoji">{{ wonderEmoji }}</span>
                </div>
              </div>

              <!-- 描述文字 -->
              <div class="wonder-description-box">
                <p class="wonder-desc">{{ actionData?.description }}</p>
                <div v-if="rewardInfo" class="wonder-reward">
                  <span class="reward-label">获得重器：</span>
                  <span class="reward-name">{{ rewardInfo.name }}</span>
                </div>
              </div>
            </div>
          </Transition>

          <!-- 阶段 3: 底部提示 -->
          <Transition name="fade-up">
            <div v-if="stage >= 3" class="wonder-footer">
              <div class="unlock-hint">点击任意处收录至人类史册</div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePackStore } from '@/stores/modules/pack'
import ActionsData from '@/data/actions.json'

const props = defineProps<{
  /** 是否可见 */
  visible: boolean
  /** 关联的任务 Key */
  actionKey: string | null
}>()

const emit = defineEmits<{
  done: []
}>()

const packStore = usePackStore()

const stage = ref(0)
const actionData = computed(() => {
  if (!props.actionKey) return null
  return (ActionsData as any).find((a: any) => a.key === props.actionKey)
})

const rewardInfo = computed(() => {
  if (!actionData.value?.rewards?.[0]) return null
  const key = actionData.value.rewards[0].key
  return {
    key,
    name: packStore.getDisplayName(key)
  }
})

// 根据 Key 匹配一些特定的图标，增加仪式感
const wonderEmoji = computed(() => {
  const k = props.actionKey || ''
  if (k.includes('zun')) return '🏺'
  if (k.includes('pantheon') || k.includes('temple')) return '🏛️'
  if (k.includes('pyramid')) return '𓂀'
  if (k.includes('wall')) return '🧱'
  if (k.includes('tower')) return '🗼'
  if (k.includes('pagoda')) return '⛩️'
  if (k.includes('space_station')) return '🛰'
  return '🏆'
})

// 动画流程控制
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

watch(() => props.visible, async (val) => {
  if (!val) {
    stage.value = 0
    return
  }
  
  // 开始序列
  stage.value = 1
  await sleep(800)
  stage.value = 2
  await sleep(1000)
  stage.value = 3
})

function sparkleStyle(i: number) {
  const left = Math.random() * 100
  const top = Math.random() * 100
  const size = 1 + Math.random() * 3
  const delay = Math.random() * 5
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`,
    opacity: 0.3 + Math.random() * 0.7
  }
}

function onOverlayClick() {
  if (stage.value >= 3) {
    emit('done')
  }
}

</script>

<style scoped>
.wonder-discovery-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: radial-gradient(circle at center, rgba(30, 20, 0, 0.95) 0%, rgba(0, 0, 0, 0.98) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

/* 背景粒子与光晕 */
.wonder-background {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.glow-orb {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.15) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  filter: blur(50px);
  animation: pulse 8s ease-in-out infinite alternate;
}

.golden-sparkles .sparkle {
  position: absolute;
  background: #ffd700;
  border-radius: 50%;
  box-shadow: 0 0 10px #ffd700;
  animation: fall 5s linear infinite;
}

@keyframes fall {
  0% { transform: translateY(-20px) scale(0); opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 0.8; }
  100% { transform: translateY(100vh) scale(1); opacity: 0; }
}

@keyframes pulse {
  from { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
  to { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
}

/* 布局 */
.wonder-stage {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 90%;
  max-width: 800px;
}

/* 标题 */
.wonder-header {
  margin-bottom: 40px;
}

.wonder-subtitle {
  color: #ffd700;
  text-transform: uppercase;
  letter-spacing: 0.5rem;
  font-size: 1.25rem;
  margin-bottom: 1rem;
  opacity: 0.9;
  font-weight: 300;
}

.wonder-main-title {
  color: #ffffff;
  font-size: 4rem;
  font-weight: 900;
  text-shadow: 0 0 40px rgba(255, 215, 0, 0.4);
  margin: 0;
  line-height: 1.2;
}

.wonder-decoration {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-top: 15px;
}

.wonder-decoration .line {
  height: 2px;
  width: 100px;
  background: linear-gradient(to right, transparent, #ffd700, transparent);
}

.wonder-decoration .diamond {
  width: 12px;
  height: 12px;
  background: #ffd700;
  transform: rotate(45deg);
  box-shadow: 0 0 10px #ffd700;
}

/* 内容 */
.wonder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wonder-icon-wrapper {
  position: relative;
  width: 200px;
  height: 200px;
  margin-bottom: 40px;
}

.wonder-icon-glow {
  position: absolute;
  inset: -20px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
  animation: rotate-glow 10s linear infinite;
}

.wonder-icon-inner {
  position: relative;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 4px solid #ffd700;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(5deg);
  box-shadow: 0 0 50px rgba(255, 215, 0, 0.2);
}

.wonder-emoji {
  font-size: 8rem;
  filter: drop-shadow(0 0 20px rgba(0,0,0,0.5));
}

.wonder-description-box {
  background: rgba(255, 255, 255, 0.03);
  padding: 30px;
  border-radius: 12px;
  border-left: 4px solid #ffd700;
  max-width: 600px;
  backdrop-filter: blur(5px);
}

.wonder-desc {
  color: #e0e0e0;
  font-size: 1.25rem;
  line-height: 1.6;
  margin: 0 0 20px 0;
  font-style: italic;
}

.wonder-reward {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 1.1rem;
}

.reward-label { color: #888; }
.reward-name { 
  color: #fff; 
  font-weight: bold;
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-color: #ffd700;
}

/* 底部 */
.wonder-footer {
  margin-top: 60px;
}

.unlock-hint {
  color: #ffd700;
  font-size: 1rem;
  letter-spacing: 2px;
  animation: breathe 2s ease-in-out infinite;
  opacity: 0.8;
}

/* 动画 */
.wonder-overlay-fade-enter-active, .wonder-overlay-fade-leave-active {
  transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
}
.wonder-overlay-fade-enter-from, .wonder-overlay-fade-leave-to {
  opacity: 0;
}

.wonder-title-enter-active {
  transition: all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.wonder-title-enter-from {
  opacity: 0;
  transform: translateY(-50px) scale(0.9);
}

.wonder-body-enter-active {
  transition: all 1.5s ease-out;
  transition-delay: 0.5s;
}
.wonder-body-enter-from {
  opacity: 0;
  transform: translateY(50px);
}

@keyframes rotate-glow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes breathe {
  0% { opacity: 0.4; transform: scale(0.98); }
  50% { opacity: 0.9; transform: scale(1); }
  100% { opacity: 0.4; transform: scale(0.98); }
}
</style>
