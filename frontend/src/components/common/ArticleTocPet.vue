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
          /* 如果处于受惊乱跑状态，就用随机坐标；否则乖乖待在右下角躲避 Toast */
          bottom: shockPosition ? `${shockPosition.bottom}px` : `${20 + dodgeOffset}px`,
          right: shockPosition ? `${shockPosition.right}px` : '20px',
        }"
      >
        <!-- 1. 宠物头部（常态展示区） -->
        <div
          class="pet-header"
          @click="toggleExpand"
          @mouseenter="isHovered = true"
          @mouseleave="isHovered = false"
        >
          <!-- 动态图标 -->
          <div class="pet-icon">
            <i class="fas" :class="currentIcon"></i>
          </div>

          <!-- 消息展示区：使用过渡动画实现文本平滑切换 -->
          <div class="pet-message-wrapper">
            <Transition name="fade-slide" mode="out-in">
              <span :key="displayMessage" class="pet-message">{{ displayMessage }}</span>
            </Transition>
          </div>

          <!-- 展开状态指示器 -->
          <div class="expand-indicator">
            <i class="fas fa-chevron-up" :class="{ 'rotate-180': isExpanded }"></i>
          </div>

          <!-- 假的关闭按钮 -->
          <button class="fake-close-btn" @click.stop="handleCloseClick($event)" title="关闭">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- 2. TOC 目录折叠区 -->
        <!-- 使用 CSS transition 控制高度展开 -->
        <div class="toc-body" :class="{ show: isExpanded }">
          <TransitionGroup
            name="toc-slide"
            tag="ul"
            class="toc-list"
            v-if="visibleTocItems && visibleTocItems.length > 0"
          >
            <li
              v-for="item in visibleTocItems"
              :key="item.id"
              class="toc-item"
              :class="{ 'is-active': activeHeadingId === item.id }"
              :style="{ paddingLeft: `${(item.level - 1) * 12}px` }"
              @click="scrollToAnchor(item.id)"
            >
              {{ item.text }}
            </li>
          </TransitionGroup>

          <div v-else class="toc-empty">
            {{ isTypingMode ? '正在扫描章节结构 哔哔哔...' : '这里光秃秃的，没有找到目录项呢...' }}
          </div>
        </div>

        <!-- 3. 二合一全局进度条 -->
        <div class="pet-progress-bar" :class="{ 'is-typing': isTypingMode }">
          <div class="progress-fill" :style="{ width: `${globalProgress}%` }"></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useReadingProgress } from '@/composables/useReadingProgress'
import { useTocPet, globalNavOffset } from '@/composables/useTocPet'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { computed, nextTick, watch, onUnmounted, ref } from 'vue'
import { useToastStore } from '@/stores/toastStore'
import { useToast } from '@/composables/useToast'

import type { TocItem } from '@/composables/useArticleInfo'

/**
 * 组件属性定义
 * @property {TocItem[]} tocItems - 从外部文章解析器传入的目录树数据
 */
interface Props {
  tocItems: TocItem[]
}

// --- 组件属性接收 ---
const props = defineProps<Props>()

// --- Store 与全局状态 ---
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
  shockPosition,
  triggerShock,
  toggleExpand,
} = useTocPet()

const { globalProgress, isTypingMode, unlockedHeadingIds } = useReadingProgress()

/** 受惊模式下的"核爆"惩罚台词 */
const nukeMessages = [
  '都怪你 QAQ！！',
  '你太过分了！呜呜呜...页面碎掉了！',
  '警告：由于暴力操作，页面已自毁OAO',
  '这就是代价！哼！谁让你追我！',
  '你赢了...但代价是整个世界的毁灭 QwQ',
]

/**
 * 页面核爆：清空所有 HTML，只留一个惩罚菜单
 * @description 在受惊模式下被二次点击关闭按钮时触发。
 *              清空 document.body 并渲染一个极简的"都怪你"页面。
 */
const nukeThePage = () => {
  const message = nukeMessages[Math.floor(Math.random() * nukeMessages.length)]

  // 清空整个页面内容
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
        <p class="nuke-hint">点击上方按钮刷新页面</p>
      </div>
    </body>
  `
}

/**
 * 关闭按钮点击处理：区分首次点击（触发受惊）与二次点击（页面核爆）
 * @param event - 原生鼠标事件
 */
const handleCloseClick = (event: MouseEvent) => {
  if (currentMood.value === 'shocked') {
    // 已经在逃跑了还被抓到？页面核爆！
    nukeThePage()
  } else {
    // 首次点击：触发受惊逃跑
    triggerShock(event)
  }
}

/**
 * 计算属性：根据打字机模式动态过滤目录项
 * @returns {TocItem[]} 可见的目录项列表
 * @description 在打字机模式下，只显示已解锁的标题；非打字机模式下显示全部目录项。
 */
const visibleTocItems = computed(() => {
  // 如果不在打字机模式（瞬间展示/打字完毕），就直接返回全量目录
  if (!isTypingMode.value) return props.tocItems

  // 否则，只返回被探照灯扫过（已解锁）的标题
  return props.tocItems.filter((item: TocItem) => unlockedHeadingIds.value.has(item.id))
})

/**
 * 滚动至指定锚点
 * @param {string} id - 目标 DOM 元素的 ID
 * @description 点击目录项后平滑定位至对应标题区域。
 */
const scrollToAnchor = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    // 预留 80px 的顶部安全区，防止标题被固定头部遮挡
    const y = element.getBoundingClientRect().top + window.scrollY - 120
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}

/**
 * 躲避吐司的动态偏移量计算
 * @description 监听全局吐司数量，当吐司出现在右下角时，自动计算向上躲闪的 translateY 距离。
 */
const dodgeOffset = computed(() => {
  let offset = 0

  // 优先叠加底部导航栏的躲避高度
  offset += globalNavOffset.value - 10

  // 叠加 Toast 的躲避高度
  if (settingsStore.toast.position == 'bottom-right') {
    // 只有当吐司设置在右下角时，才需要躲避哦
    const toastCount = toastStore.toasts.length
    if (toastCount > 0) {
      offset += toastCount * 76 + 12
    }
  }
  return offset
})

// 当前高亮的章节 ID
const activeHeadingId = ref<string>('')
let observer: IntersectionObserver | null = null

/**
 * 设置交叉观察器
 * @description 监听标题是否进入了屏幕的黄金阅读区
 */
const setupObserver = () => {
  // 每次重新设置前，先断开旧的观察
  if (observer) {
    observer.disconnect()
  }
  // 配置观察器：在屏幕顶部往下 80px 到屏幕中间 70% 的位置划定一个“判定区”
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // 如果这个标题进入了判定区，就把它的 ID 设为当前激活状态
        if (entry.isIntersecting) {
          activeHeadingId.value = entry.target.id
        }
      })
    },
    {
      // -80px 是避开顶部导航栏，-70% 是忽略屏幕下半部分的内容
      rootMargin: '-80px 0px -70% 0px',
    },
  )
  // 遍历当前可见的 TOC 项，去真实 DOM 里抓取对应的标题元素并观察它！
  visibleTocItems.value.forEach((item: TocItem) => {
    const el = document.getElementById(item.id)
    if (observer instanceof IntersectionObserver && el) {
      observer.observe(el)
    } else {
      // 如果没有找到对应的 DOM 元素，可能是因为打字机动画还没解锁到它，或者文章结构异常了
      notify({
        type: 'warning',
        message: `TOC Pet: 无法找到 ID 为 ${item.id} 的标题元素，无法观察其可见性。`,
      })
    }
  })
}
// 监听可见目录的变化
// 无论是打字机逐个解锁标题，还是页面瞬间加载完毕，只要目录变了，就重新装备观察器
watch(
  visibleTocItems,
  async () => {
    // 等待下一帧，确保父组件 (ArticleDetailView) 把真实 DOM 的 ID 给绑定好了
    await nextTick()
    // 稍微延迟 100ms，确保打字机动画没有引起 DOM 的剧烈抖动
    setTimeout(setupObserver, 100)
  },
  { immediate: true, deep: true },
)
// 页面销毁时，别忘了把观察器也带走哦awa~
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
  /* transition:
    bottom 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
    right 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
    background-color 0.4s,
    box-shadow 0.4s; */
}

@media (max-width: 768px) {
  .toc-pet-wrapper {
    width: auto;
    max-width: calc(100vw - 40px);
  }
}

/* --- 头部常态区 --- */
.pet-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  position: relative;
  user-select: none;
  gap: 12px;
}

.pet-icon {
  font-size: 1.2rem;
  color: var(--accent-color, #3b82f6); /* 默认改用 info 蓝色 */
  flex-shrink: 0;
  padding-top: 2px;
  text-align: center;
  transition: color 0.3s ease;
}

.pet-message-wrapper {
  flex: 1;
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--light-text);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.pet-message {
  display: inline-block;
}

/* 文本平滑过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  position: absolute;
}

/* 展开指示器 */
.expand-indicator {
  font-size: 0.8rem;
  color: inherit;
  opacity: 0.5;
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.rotate-180 {
  transform: rotate(180deg);
}

/* 假关闭按钮 */
.fake-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 1.2rem;
  color: var(--light-text);
  opacity: 0.6;
  transition:
    opacity 0.2s,
    color 0.2s;
  margin-left: 4px;
}
.fake-close-btn:hover {
  opacity: 1;
  color: #ef4444;
}

/* --- 动态情绪样式 --- */
.toc-pet-wrapper.typing .pet-icon {
  color: #ff9a9e;
}
.toc-pet-wrapper.shocked .pet-icon {
  color: #ef4444;
}
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

/* --- TOC 目录区 --- */
.toc-body {
  max-height: 0;
  opacity: 0;
  overflow-y: auto;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); /* 对齐曲线 */
}
.toc-body.show {
  max-height: 400px;
  opacity: 1;
  /* 因为背景是深色了，分隔线需要调淡一点 */
  border-top: 1px solid rgba(39, 36, 36, 0.2);
  padding: 8px 0;
}

.toc-list {
  list-style: none;
  padding: 0 8px;
  margin: 0;
}

.toc-item {
  position: relative;
  padding: 6px 16px;
  font-size: 0.85rem;
  color: var(--light-text);
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 高亮状态样式 */
.toc-item.is-active {
  color: #4facfe;
  background: rgba(79, 172, 254, 0.1);
  font-weight: bold;
}
/* 高亮状态左侧的光剑特效 */
.toc-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #4facfe 0%, #00f2fe 100%);
  box-shadow: 0 0 8px rgba(79, 172, 254, 0.6);
  border-radius: 0 2px 2px 0;
}

.toc-item:hover {
  background: rgba(128, 128, 128, 0.15);
  color: var(--accent-color, #3b82f6);
}

.toc-empty {
  padding: 16px;
  font-size: 0.85rem;
  color: inherit;
  opacity: 0.6;
  text-align: center;
}

/* --- 二合一进度条 (保留原有赛博配色) --- */
.pet-progress-bar {
  width: 100%;
  height: 3px;
  background: rgba(128, 128, 128, 0.2);
  margin-top: auto;
}
.progress-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  box-shadow: 0 0 6px rgba(79, 172, 254, 0.4);
  transition:
    width 0.15s ease-out,
    background 0.8s ease,
    box-shadow 0.8s ease;
}
.pet-progress-bar.is-typing .progress-fill {
  background: linear-gradient(90deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%);
  box-shadow: 0 0 8px rgba(255, 154, 158, 0.5);
  transition: width 1s linear;
}

/* 暗黑模式发光特效保留 */
.dark-theme .pet-progress-bar {
  background: rgba(128, 128, 128, 0.2);
}
.dark-theme .progress-fill {
  background: linear-gradient(90deg, #00cdac 0%, #8ddad5 100%);
  box-shadow: 0 0 10px rgba(0, 205, 172, 0.6);
}
.dark-theme .pet-progress-bar.is-typing .progress-fill {
  background: linear-gradient(90deg, #b122e5 0%, #ff63de 100%);
  box-shadow: 0 0 15px rgba(255, 99, 222, 0.8);
}

/* --- TOC 迷雾开图滑入动画 --- */
.toc-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.toc-slide-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.toc-slide-leave-active {
  transition: all 0.3s ease;
}
.toc-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
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
