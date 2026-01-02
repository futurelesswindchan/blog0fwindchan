<!-- frontend\src\components\ArticleNavigation.vue -->
<template>
  <div class="bottom-nav">
    <button
      class="nav-btn prev"
      :class="{ disabled: !prevArticle }"
      @click="navigate('prev')"
      :title="prevArticle?.title || '已经是第一篇了'"
    >
      <i class="fas fa-chevron-left"></i>
      <div class="nav-btn-content">
        <span class="nav-label">上一篇</span>
        <span class="nav-title">{{ prevArticle?.title || '没有更多了' }}</span>
      </div>
    </button>

    <div class="center-nav-group">
      <button class="nav-btn back" @click="goBack">
        <i class="fas fa-home"></i>
        <div class="nav-btn-content">
          <span class="nav-label">返回</span>
          <span class="nav-title">返回目录</span>
        </div>
      </button>

      <button class="nav-btn top" v-show="showScrollTop" @click="scrollToTop">
        <i class="fas fa-arrow-up"></i>
        <div class="nav-btn-content">
          <span class="nav-label">位置</span>
          <span class="nav-title">回到顶部</span>
        </div>
      </button>
    </div>

    <button
      class="nav-btn next"
      :class="{ disabled: !nextArticle }"
      @click="navigate('next')"
      :title="nextArticle?.title || '已经是最新内容了'"
    >
      <div class="nav-btn-content">
        <span class="nav-label">下一篇</span>
        <span class="nav-title">{{ nextArticle?.title || '敬请期待' }}</span>
      </div>
      <i class="fas fa-chevron-right"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import '@/styles/articleNavigation.css'

export interface Article {
  id: string
  uid?: string // 修改为可选
  title: string
}

// 添加可选的路由名称
interface Props {
  prevArticle: Article | null
  nextArticle: Article | null
  backRouteName: string
  currentParams?: Record<string, string>
  routeName?: string // 添加可选的路由名称
  currentCategory?: string // 新增：接收当前的分类
}

const props = defineProps<Props>()
const router = useRouter()
const showScrollTop = ref(false)

const navigate = (direction: 'prev' | 'next') => {
  const targetArticle = direction === 'prev' ? props.prevArticle : props.nextArticle
  if (!targetArticle) return

  // 1. 优先处理：如果父组件传了 currentCategory，直接根据映射表跳转
  if (props.currentCategory) {
    const categoryMap: Record<string, string> = {
      frontend: 'FrontEndArticle',
      topics: 'TopicsArticle',
      tools: 'TopicsArticle', // tools 通常也共用 Topics 模板
      novels: 'NovelsArticle',
    }

    const targetRouteName = categoryMap[props.currentCategory]

    if (targetRouteName) {
      router.push({ name: targetRouteName, params: { id: targetArticle.id } })
      return
    }
  }

  // 2. 如果提供了指定的路由名称 (用于 Story 模式等特殊情况)
  if (props.routeName) {
    router.push({
      name: props.routeName,
      params: {
        ...props.currentParams,
        chapter: targetArticle.id,
      },
    })
    return
  }

  // 3. 以此往下是原有的 uid 解析逻辑作为保底 (Fallback)
  const uidParts = (targetArticle.uid || '').split('-')
  const uidType = uidParts[0] || ''
  const uidCategory = uidParts[1] || ''

  // 优先处理小说类型（uid 可能为 `novel-1` 或 `article-novels-1`）
  if (uidType === 'novel' || uidCategory === 'novels') {
    router.push({ name: 'NovelsArticle', params: { id: targetArticle.id } })
    return
  }

  // 故事/章节类型（story）保持原有处理
  if (uidType === 'story') {
    router.push({
      name: `${uidCategory.charAt(0).toUpperCase() + uidCategory.slice(1)}StoryChapter`,
      params: { chapter: targetArticle.id },
    })
    return
  }

  // 普通文章：根据 category 决定具体路由（兼容旧 uid 前缀 tech/article）
  const categoryKey =
    uidCategory || (uidType === 'tech' || uidType === 'article' ? uidParts[1] : '')

  if (categoryKey === 'frontend') {
    router.push({ name: 'FrontEndArticle', params: { id: targetArticle.id } })
  } else if (categoryKey === 'tools' || categoryKey === 'topics') {
    router.push({ name: 'TopicsArticle', params: { id: targetArticle.id } })
  } else {
    // fallback: try FrontEndArticle
    router.push({ name: 'FrontEndArticle', params: { id: targetArticle.id } })
  }
}

const goBack = () => {
  router.push({ name: props.backRouteName })
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 300
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>
