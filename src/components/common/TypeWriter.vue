<template>
  <div :class="['type-writer', { 'is-typing': isTyping }]">
    <slot v-if="!enabled">{{ text }}</slot>
    <template v-else>
      <span ref="contentRef" class="typing-content">{{ displayText }}</span>
      <!-- 修改光标显示逻辑和样式 -->
      <span v-show="showCursor" class="cursor" :class="{ blink: !isTyping }">>></span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

interface Props {
  text: string // 要显示的文本内容
  enabled?: boolean // 是否启用打字效果
  speed?: number // 打字速度（毫秒/字符）
  delay?: number // 开始打字前的延迟
  showCursor?: boolean // 是否显示光标
  autoStart?: boolean // 是否自动开始
  preserveHtml?: boolean // 是否保留HTML标签
  chunkSize?: number // 每次打字的字符数
  chunkDelay?: number // 每块文字之间的延迟
}

// 定义组件属性及默认值
const props = withDefaults(defineProps<Props>(), {
  enabled: true,
  speed: 50,
  delay: 0,
  showCursor: true,
  autoStart: true,
  preserveHtml: false,
  chunkSize: 10,
  chunkDelay: 50,
})

// 组件状态
const contentRef = ref<HTMLElement | null>(null)
const currentIndex = ref(0)
const isTyping = ref(false)
const hasStarted = ref(false)
const showCursor = ref(props.showCursor)

// 计算要显示的文本
const displayText = computed(() => {
  if (!props.enabled) return props.text

  if (props.preserveHtml) {
    // 如果需要保留HTML，使用特殊的切割逻辑
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = props.text
    return props.text.slice(0, currentIndex.value)
  }

  return props.text.slice(0, currentIndex.value)
})

// 修改打字效果逻辑
const startTyping = () => {
  if (hasStarted.value || !props.enabled) return

  hasStarted.value = true
  isTyping.value = true
  showCursor.value = true

  // 打字函数
  const type = () => {
    if (currentIndex.value < props.text.length) {
      currentIndex.value = Math.min(currentIndex.value + props.chunkSize, props.text.length)
      if (currentIndex.value < props.text.length) {
        setTimeout(type, props.chunkDelay)
      } else {
        isTyping.value = false
        // 保持光标显示
        showCursor.value = props.showCursor
      }
    }
  }

  setTimeout(type, props.delay)
}

// 重置打字效果
const reset = () => {
  currentIndex.value = 0
  isTyping.value = false
  hasStarted.value = false
}

// 监听文本变化
watch(
  () => props.text,
  () => {
    reset()
    if (props.autoStart) startTyping()
  },
)

// 使用 IntersectionObserver 检测可见性
if (props.autoStart) {
  const { stop } = useIntersectionObserver(
    contentRef,
    ([{ isIntersecting }]) => {
      if (isIntersecting && !hasStarted.value) {
        startTyping()
        stop()
      }
    },
    { threshold: 0.5 },
  )
}

// 暴露方法供父组件使用
defineExpose({
  start: startTyping,
  reset,
})
</script>

<style scoped>
.type-writer {
  display: inline-block;
  position: relative;
}

.cursor {
  display: inline-block;
  margin-left: 2px;
  color: var(--accent-color);
  font-weight: bold;
  vertical-align: baseline;
}

.cursor.blink {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* 确保文本和光标在同一行 */
.typing-content {
  display: inline;
  white-space: pre-wrap;
}

/* 确保HTML内容正确显示 */
.typing-content :deep(p) {
  margin: 0;
  display: inline;
}
</style>
