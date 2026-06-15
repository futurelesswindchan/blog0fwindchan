<!-- frontend/src/components/common/ArticleTocPet.vue -->
<template>
  <Teleport to="body">
    <!-- 基础容器：固定在右下角 -->
    <Transition appear name="pet-appear">
      <div
        class="toc-pet-wrapper"
        :class="[currentMood, { 'is-expanded': isExpanded }]"
        v-show="true"
        :style="{
          bottom: shockPosition ? `${shockPosition.bottom}px` : `${20 + finalDodgeOffset}px`,
          right: shockPosition ? `${shockPosition.right}px` : '20px',
        }"
      >
        <!-- 1. 宠物头部（常态展示区） -->
        <PetHeader
          :currentIcon="currentIcon"
          :displayMessage="displayMessage"
          :activeChannel="activeChannel"
          :isExpanded="isExpanded"
          @toggle-expand="toggleExpand"
          @update-hover="isHovered = $event"
          @close-click="handleCloseClick"
        />

        <!-- 2. TOC 目录折叠区 -->
        <PetTocBody
          :isExpanded="isExpanded"
          :isTypingMode="isTypingMode"
          :visibleTocItems="visibleTocItems"
          :activeHeadingId="activeHeadingId"
          @scroll-to="scrollToAnchor"
        />

        <!-- 3. 二合一全局进度条 -->
        <PetProgressBar :isTypingMode="isTypingMode" :globalProgress="globalProgress" />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * 文章侧边目录桌宠的主控容器。
 *
 * 这是一个装配车间组件。它不包含业务细节，仅负责通过 `useTocPet` 枢纽收集数据，
 * 组装 Header、Body、ProgressBar，并提供悬浮层窗体控制、全局拦截 IntersectionObserver，
 * 以及极端事件（核爆页面清空）的最终渲染。
 */
import { computed, nextTick, watch, onUnmounted, ref } from 'vue'
import { useReadingProgress } from '@/composables/useReadingProgress'
import { useTocPet } from '@/composables/toc-pet'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useToastStore } from '@/stores/toastStore'
import { useToast } from '@/composables/useToast'
import type { TocItem } from '@/composables/useArticleInfo'

// --- 子组件引入 ---
import PetHeader from './toc-pet/PetHeader.vue'
import PetTocBody from './toc-pet/PetTocBody.vue'
import PetProgressBar from './toc-pet/PetProgressBar.vue'

interface Props {
  tocItems: TocItem[]
}

const props = defineProps<Props>()

const toastStore = useToastStore()
const settingsStore = useSettingsStore()
const { notify } = useToast()

// 引入宠物状态机与全局进度条状态
const {
  currentMood,
  isExpanded,
  isHovered,
  currentIcon,
  displayMessage,
  activeChannel,
  shockPosition,
  triggerShock,
  toggleExpand,
  dodgeOffset,
} = useTocPet()

const { globalProgress, isTypingMode, unlockedHeadingIds } = useReadingProgress()

/** 受惊模式下的"核爆"惩罚台词 */
const nukeMessages = [
  '哼！都怪你 QAQ！！',
  '你太过分了！呜呜呜...页面碎掉了！',
  '警告：由于暴力操作，页面已自毁OAO',
  '这就是代价！谁让你追我awa！',
  '你赢了...但代价是整个世界的毁灭 QwQ',
]

/**
 * 页面核爆：清空所有 HTML，只留一个惩罚菜单
 */
const nukeThePage = () => {
  const message = nukeMessages[Math.floor(Math.random() * nukeMessages.length)]

  document.documentElement.innerHTML = `
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>页面已自毁</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          min-height: 100vh;
          display: flex; justify-content: center; align-items: center;
          background: #0a0a0f;
          font-family: 'Segoe UI', sans-serif;
          overflow: hidden;
        }
        .nuke-container {
          text-align: center;
          animation: fadeIn 1s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .nuke-icon {
          font-size: 80px;
          margin-bottom: 30px;
          animation: shake 0.5s ease-in-out infinite alternate;
        }
        @keyframes shake {
          from { transform: rotate(-5deg); }
          to { transform: rotate(5deg); }
        }
        .nuke-message {
          color: #ff6b6b;
          font-size: 1.5rem;
          font-weight: bold;
          max-width: 500px;
          line-height: 1.6;
          margin-bottom: 40px;
        }
        .nuke-btn {
          padding: 14px 40px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 30px;
          background: transparent;
          color: rgba(255,255,255,0.7);
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;
        }
        .nuke-btn:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.6);
          color: #fff;
        }
        .nuke-hint {
          margin-top: 20px;
          color: rgba(255,255,255,0.3);
          font-size: 0.8rem;
        }
      </style>
    </head>
    <body>
      <div class="nuke-container">
        <div class="nuke-icon">💀</div>
        <p class="nuke-message">${message}</p>
        <button class="nuke-btn" onclick="location.reload()">我错了，求求让我回去 QwQ</button>
        <p class="nuke-hint">点击上方按钮刷新页面以忏悔你的残酷行径awa</p>
      </div>
    </body>
  `
}

/**
 * 躲避吐司的动态偏移量计算
 */
const finalDodgeOffset = computed(() => {
  let offset = dodgeOffset.value - 10
  if (settingsStore.toast.position == 'bottom-right') {
    const toastCount = toastStore.toasts.length
    if (toastCount > 0) {
      offset += toastCount * 76 + 12
    }
  }
  return offset
})

const handleCloseClick = (event: MouseEvent) => {
  if (currentMood.value === 'shocked') {
    nukeThePage()
  } else {
    triggerShock(event)
  }
}

const visibleTocItems = computed(() => {
  if (!isTypingMode.value) return props.tocItems
  return props.tocItems.filter((item: TocItem) => unlockedHeadingIds.value.has(item.id))
})

const scrollToAnchor = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    const y = element.getBoundingClientRect().top + window.scrollY - 120
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}

const activeHeadingId = ref<string>('')
let observer: IntersectionObserver | null = null

const setupObserver = () => {
  if (observer) {
    observer.disconnect()
  }
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeHeadingId.value = entry.target.id
        }
      })
    },
    { rootMargin: '-80px 0px -70% 0px' },
  )
  visibleTocItems.value.forEach((item: TocItem) => {
    const el = document.getElementById(item.id)
    if (observer instanceof IntersectionObserver && el) {
      observer.observe(el)
    } else {
      notify({
        type: 'warning',
        message: `TOC Pet: 无法找到 ID 为 ${item.id} 的标题元素，无法观察其可见性。`,
      })
    }
  })
}

watch(
  visibleTocItems,
  async () => {
    await nextTick()
    setTimeout(setupObserver, 100)
  },
  { immediate: true, deep: true },
)

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style scoped>
/* --- 基础悬浮容器 (伪装成 Toast awa) --- */
.toc-pet-wrapper {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  z-index: 9990;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  /* 注入 Toast 灵魂样式 */
  background-color: var(--dark-text);
  color: var(--light-text);
  border-radius: 2px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  /* 统一使用 Toast 的缓动曲线 */
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

@media (max-width: 768px) {
  .toc-pet-wrapper {
    width: auto;
    max-width: calc(100vw - 40px);
  }
}

/* --- 动态情绪样式透传至主容器特效 --- */
.toc-pet-wrapper.shocked {
  animation: panic-shake 0.35s ease-in-out infinite;
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
}
@keyframes panic-shake {
  0%,
  100% {
    transform: translateX(0) translateY(0) rotate(0);
  }
  25% {
    transform: translateX(-6px) translateY(3px) rotate(-3deg);
  }
  50% {
    transform: translateX(6px) translateY(-3px) rotate(3deg);
  }
  75% {
    transform: translateX(-4px) translateY(-4px) rotate(-2deg);
  }
}
.shake-animation {
  animation: shake 0.4s ease-in-out infinite;
}

/* --- TOC 全局入场/离场动画 --- */
.pet-appear-enter-active,
.pet-appear-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.pet-appear-enter-from,
.pet-appear-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}
</style>
