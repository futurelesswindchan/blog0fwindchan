<!-- frontend/src/views/articles/CategoryListView.vue -->
<template>
  <div class="story-view-container" :class="currentMeta.themeClass">
    <!--
      动态绑定主题 class (如 .theme-frontend, .theme-novels)
      用于在底部 <style> 中区分不同分类鼠标悬停时的发光颜色

      不要把这个注释放在div的外面变成同级节点啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊QAQ！！！
    -->
    <!-- 顶部导航区 -->
    <div class="page-header">
      <div class="back-area" @click="$router.push({ name: 'Articles' })">
        <i class="fas fa-arrow-left"></i>
      </div>
      <h2 class="page-title">{{ currentMeta.pageTitle }}</h2>
    </div>

    <div class="story-view">
      <!-- 搜索与排序控制栏 -->
      <FilterBar
        v-model:searchText="searchText"
        :sort-button="sortButton"
        placeholder="搜索文章..."
      />

      <!-- 加载中状态 -->
      <div v-if="articleStore.isLoading" class="loading-wrapper glass-container">
        <i class="fas fa-circle-notch fa-spin"></i>
        <span>加载中...</span>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="articleStore.error" class="error-message">
        {{ articleStore.error }}
      </div>

      <!--
        文章列表区
        绑定了打字机动画指令 v-type-writer，让列表项依次浮现
      -->
      <div
        v-else
        class="chapter-list type-writer"
        v-type-writer="{
          mode: 'both',
          delay: 200,
          elementDelay: 200,
          textDelay: 300,
        }"
      >
        <div
          v-for="article in filteredItems"
          :key="article.id"
          class="chapter-item glass-container"
          @click="readArticle(article.id)"
        >
          <div class="chapter-info">
            <span class="chapter-date">{{ formatDate(article.date) }}</span>
            <h3>{{ article.title }}</h3>
          </div>
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>

      <!-- 分页组件：仅在总页数大于 1 时显示 -->
      <PaginationControls v-if="pagination && pagination.totalPages > 1" :pagination="pagination" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @file CategoryListView.vue
 * @description 通用文章分类列表视图组件。
 *
 * 通过动态读取 vue-router 中的 meta 配置，实现高度复用。
 * 支持前端技术 (frontend)、小说故事 (novels)、杂谈闲聊 (topics) 等多种分类列表的渲染。
 * 包含状态缓存机制，确保在路由离开时的平滑过渡。
 */

import { useArticleContent } from '@/composables/useArticleContent'
import { useSettingsStore } from '@/views/stores/useSettingsStore'
import { useSearchAndSort } from '@/composables/useSearchAndSort'
import { vTypeWriter } from '@/directives/typeWriterDirective'
import { useArticleStore } from '@/views/stores/articleStore'
import { computed, onMounted, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import PaginationControls from '@/components/common/PaginationControls.vue'
import FilterBar from '@/components/common/FilterBar.vue'

import '@/styles/correctContentMargin.css'
import '@/styles/pageHeader.css'
import '@/styles/typeWriter.css'
import '@/styles/storyCard.css'

const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()
const settingsStore = useSettingsStore()
const { formatDate } = useArticleContent()

/**
 * 当前页面的路由元信息 (Meta) 状态缓存
 *
 * 为什么不使用 computed？
 * 当用户点击文章跳转到详情页时，路由发生变化，详情页的 route.meta 可能不包含 categoryKey。
 * 如果使用 computed，会导致组件在卸载/过渡的瞬间，categoryKey 跌落回默认值，
 * 从而引起文章列表数据瞬间突变，触发不必要的 DOM 重新渲染甚至报错崩溃。
 * 使用 ref 作为缓存，可以安全锁住离开时的最后有效状态。
 *
 * @type {import('vue').Ref<{categoryKey: string, pageTitle: string, detailRouteName: string, themeClass: string}>}
 */
const currentMeta = ref({
  categoryKey: 'frontend',
  pageTitle: '文章列表',
  detailRouteName: 'FrontEndArticle',
  themeClass: 'theme-frontend',
})

/**
 * 监听路由 Meta 变化并更新缓存
 *
 * 仅当目标路由包含 categoryKey 时才进行更新（说明当前是在各个分类列表页之间切换）。
 * 如果跳转去了详情页，条件不成立，currentMeta 保持原样，完美护航组件卸载动画。
 */
watchEffect(() => {
  if (route.meta.categoryKey) {
    currentMeta.value = {
      categoryKey: route.meta.categoryKey as string,
      pageTitle: route.meta.pageTitle as string,
      detailRouteName: route.meta.detailRouteName as string,
      themeClass: route.meta.themeClass as string,
    }
  }
})

/**
 * 动态获取对应分类的文章列表数据
 *
 * 根据 currentMeta 缓存中的 categoryKey，从全局状态中提取对应的文章数组，
 * 并为每个文章对象补充 category 字段，以供后续逻辑使用。
 *
 * @type {import('vue').ComputedRef<Array<Object>>}
 */
const articles = computed(() => {
  const list = articleStore.getArticleList(currentMeta.value.categoryKey) || []
  return list.map((article) => ({
    ...article,
    category: currentMeta.value.categoryKey as 'frontend' | 'novels' | 'topics',
  }))
})

/**
 * 注入搜索、排序与分页的组合式逻辑
 *
 * 依赖提取好的文章列表，按照日期进行倒序排列，并绑定搜索字段。
 */
const { searchText, filteredItems, sortButton, pagination } = useSearchAndSort({
  items: articles,
  searchFields: (article) => [article.title],
  sortType: 'date',
  sortBy: (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  itemsPerPage: computed(() => settingsStore.pagination.articles),
})

/**
 * 生命周期钩子：组件挂载时执行
 *
 * 检查当前分类下是否已有文章数据，如果没有，则触发全局 Store 请求拉取全量文章索引。
 */
onMounted(async () => {
  if (!(articleStore.getArticleList(currentMeta.value.categoryKey) || []).length) {
    await articleStore.fetchArticleIndex()
  }
})

/**
 * 跳转至文章详情页面
 *
 * 利用 currentMeta 缓存中预配的 detailRouteName 动态推导目标路由，实现动态跳转。
 *
 * @param {string} articleId - 需要阅读的文章的唯一标识符
 */
const readArticle = (articleId: string) => {
  router.push({
    name: currentMeta.value.detailRouteName,
    params: { id: articleId },
  })
}
</script>

<style scoped>
/*
  分类主题样式
  将三种分类的发光特效合并，通过父级容器绑定的 currentMeta.themeClass 动态控制。
  利用径向渐变 (radial-gradient) 实现玻璃拟态卡片 hover 时的局部光源效果。
*/

/* --- 前端技术文章 (FrontEnd) - 赛博蓝色系 --- */
.theme-frontend .chapter-item::before {
  background: radial-gradient(circle at top right, rgba(70, 181, 255, 0.9), transparent);
}
.dark-theme .theme-frontend .chapter-item::before {
  background: radial-gradient(circle at top right, rgba(6, 112, 218, 0.9), transparent);
}

/* --- 幻想物语 (Novels) - 治愈绿色系 --- */
.theme-novels .chapter-item::before {
  background: radial-gradient(circle at top right, rgba(19, 193, 158, 0.9), transparent);
}
.dark-theme .theme-novels .chapter-item::before {
  background: radial-gradient(circle at top right, rgba(16, 122, 100, 0.9), transparent);
}

/* --- 奇怪杂谈 (Topics) - 活力橙色系 --- */
.theme-topics .chapter-item::before {
  background: radial-gradient(circle at top right, rgba(204, 84, 20, 0.9), transparent);
}
.dark-theme .theme-topics .chapter-item::before {
  background: radial-gradient(circle at top right, rgba(144, 71, 20, 0.9), transparent);
}
</style>
