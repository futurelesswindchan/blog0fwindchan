<!-- frontend/src/components/ArticleNavigation.vue -->
<template>
  <div class="bottom-nav">
    <!-- 上一篇按钮：当 prevArticle 为空时禁用 -->
    <button
      class="nav-btn prev"
      :class="{ disabled: !prevArticle }"
      @click="handleNavigate(prevArticle)"
      :title="prevArticle?.title || '已经是第一篇了'"
    >
      <i class="fas fa-chevron-left"></i>
      <div class="nav-btn-content">
        <span class="nav-label">上一篇</span>
        <span class="nav-title">{{ prevArticle?.title || '没有更多了' }}</span>
      </div>
    </button>

    <!-- 中间控制组：返回目录 & 回到顶部 -->
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

    <!-- 下一篇按钮：当 nextArticle 为空时禁用 -->
    <button
      class="nav-btn next"
      :class="{ disabled: !nextArticle }"
      @click="handleNavigate(nextArticle)"
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
/**
 * @fileoverview 文章底部导航组件
 * @description 提供文章详情页底部的导航功能，包括：跳转上一篇/下一篇、返回目录列表、以及平滑滚动回到顶部。
 * 依赖于 `ArticleWithCategory` 接口以实现基于分类的自动路由映射。
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import type { ArticleWithCategory } from '@/composables/useAllArticles'

import '@/styles/articleNavigation.css'

/**
 * 组件属性定义 (Props)
 * @interface Props
 */
interface Props {
  /**
   * @description 上一篇文章的数据对象。如果为 null，表示当前已是第一篇文章。
   * @type {ArticleWithCategory | null}
   */
  prevArticle: ArticleWithCategory | null

  /**
   * @description 下一篇文章的数据对象。如果为 null，表示当前已是最新一篇文章。
   * @type {ArticleWithCategory | null}
   */
  nextArticle: ArticleWithCategory | null

  /**
   * @description 点击“返回”按钮时跳转的父级目录路由名称 (Route Record Name)。
   * @type {string}
   */
  backRouteName: string
}

const props = defineProps<Props>()
const router = useRouter()

/**
 * @description 控制“回到顶部”按钮显示状态的响应式变量。
 * @type {import('vue').Ref<boolean>}
 */
const showScrollTop = ref(false)

/**
 * 处理文章跳转逻辑
 * @description 根据传入文章对象的 `category` 字段，匹配对应的路由视图并执行页面跳转。
 *
 * @param {ArticleWithCategory | null} article - 目标文章对象，包含文章 id 和所属分类 category。
 * @returns {void}
 */
const handleNavigate = (article: ArticleWithCategory | null): void => {
  if (!article) return

  /**
   * @description 分类标识与路由名称的映射表。
   * 用于将接口返回的 category 字符串映射为 Vue Router 中的对应路由。
   * @type {Record<string, string>}
   */
  const categoryMap: Record<string, string> = {
    frontend: 'FrontEndArticle',
    topics: 'TopicsArticle',
    tools: 'TopicsArticle',
    novels: 'NovelsArticle',
  }

  // 获取目标路由，若未匹配到则提供默认的 fallback 路由
  const targetRouteName = categoryMap[article.category] || 'FrontEndArticle'

  router.push({
    name: targetRouteName,
    params: { id: article.id },
  })
}

/**
 * 返回目录操作
 * @description 触发路由跳转，返回到由 `backRouteName` 属性指定的父级或列表页面。
 *
 * @returns {void}
 */
const goBack = (): void => {
  router.push({ name: props.backRouteName })
}

/**
 * 平滑滚动至页面顶部
 * @description 使用原生的 window.scrollTo 方法，并指定 smooth 行为，提供良好的交互体验。
 *
 * @returns {void}
 */
const scrollToTop = (): void => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/**
 * 页面滚动事件监听回调
 * @description 实时计算页面的垂直滚动距离 (scrollY)。
 * 当滚动距离超过 300px 时，显示“回到顶部”按钮。
 *
 * @returns {void}
 */
const handleScroll = (): void => {
  showScrollTop.value = window.scrollY > 300
}

// 生命周期：组件挂载时绑定滚动事件
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

// 生命周期：组件卸载时移除滚动事件，防止内存泄漏
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>
