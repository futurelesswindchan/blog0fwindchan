<!-- frontend\src\components\common\ContentTypeWriter.vue -->
<template>
  <div class="content-type-writer" :class="{ 'is-typing': isTyping }">
    <div class="content-wrapper">
      <VueMarkdown
        :source="finalContent"
        :options="markdownOptions || defaultMarkdownOptions"
        :dark-theme="isDarkTheme"
      />
      <span v-if="isTyping && enabled" class="typing-cursor" :class="{ blink: !isTyping }">>></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { VueMarkdown, type MarkdownOptions } from '@/composables/useArticleContent'

interface Props {
  content: string
  markdownOptions?: MarkdownOptions
  isDarkTheme?: boolean
  enabled?: boolean
  speed?: number
  initialDelay?: number
  chunkSize?: number
}

// 默认 Markdown 配置
const defaultMarkdownOptions: MarkdownOptions = {
  linkify: true,
  typographer: true,
  html: true,
}

// 使用带默认值的 props
const props = withDefaults(defineProps<Props>(), {
  enabled: true,
  speed: 30,
  initialDelay: 800,
  chunkSize: 15,
  isDarkTheme: false,
})

const currentIndex = ref(0)
const isTyping = ref(false)
const showCursor = ref(true)

// 计算当前显示的内容
const displayContent = computed(() => {
  return props.content.slice(0, currentIndex.value)
})

// 新增：最终渲染内容，关闭打字机时直接显示全部
const finalContent = computed(() => {
  return props.enabled ? displayContent.value : props.content
})

// 开始打字机动画
const startTyping = () => {
  currentIndex.value = 0
  isTyping.value = true
  showCursor.value = true

  // 递归函数实现打字效果
  const type = () => {
    if (currentIndex.value < props.content.length) {
      currentIndex.value = Math.min(currentIndex.value + props.chunkSize, props.content.length)
      if (currentIndex.value < props.content.length) {
        setTimeout(type, props.speed)
      } else {
        setTimeout(() => {
          isTyping.value = false
          showCursor.value = false
        }, 500)
      }
    }
  }

  // 启动打字机动画
  setTimeout(type, props.initialDelay)
}

// 监听 content 变化，重新开始打字机动画
watch(
  () => props.content,
  () => {
    if (props.enabled) {
      startTyping()
    } else {
      currentIndex.value = props.content.length
      isTyping.value = false
      showCursor.value = false
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.content-type-writer {
  position: relative;
  min-height: 100px;
}

.content-wrapper {
  position: relative;
  display: inline;
}

.typing-cursor {
  display: inline-block;
  width: 2px;
  margin-left: 2px;
  color: var(--accent-color);
  font-weight: bold;
  animation: blink 1s infinite;
  vertical-align: baseline; /* 添加垂直对齐 */
}

/* 调整markdown内容的样式以配合光标 */
:deep(.markdown-body) {
  display: inline;
}

:deep(.markdown-body > *) {
  display: block;
  margin: 1em 0;
}

:deep(.markdown-body > *:first-child) {
  margin-top: 0;
}

:deep(.markdown-body > *:last-child) {
  margin-bottom: 0;
  display: inline; /* 让最后一个元素内联显示，这样光标位置正确 */
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

/* 优化动画效果 */
:deep(.markdown-body > *:not(:empty)) {
  animation: slideIn 0.3s ease-out forwards;
}

@keyframes slideIn {
  from {
    transform: translateY(5px);
  }
  to {
    transform: translateY(0);
  }
}
</style>
