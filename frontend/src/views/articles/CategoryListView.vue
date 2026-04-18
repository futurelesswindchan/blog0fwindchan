<!-- frontend/src/views/articles/CategoryListView.vue -->
<template>
  <div class="story-view-container" :class="currentMeta.themeClass">
    <!-- 顶部导航区 -->
    <div class="page-header">
      <div class="back-area" @click="$router.push({ name: 'Articles' })">
        <i class="fas fa-arrow-left"></i>
      </div>
      <h2 class="page-title">{{ currentMeta.pageTitle }}</h2>
    </div>

    <div class="story-view">
      <!-- ==========================================
           1. 置顶合集区
           ========================================== -->
      <div v-if="collections.length > 0" class="collections-area">
        <div class="section-header">
          <i class="fas fa-layer-group section-icon"></i>
          <h3>已归属的系列文章</h3>
        </div>

        <div class="collections-grid">
          <div
            v-for="(col, index) in collections"
            :key="col.id"
            @click="goToCollection(col.id)"
            class="collection-card glass-container"
            :style="{ '--card-delay': `${index * 0.15}s` }"
          >
            <div class="card-icon-wrapper">
              <i class="fas fa-folder-open"></i>
            </div>
            <div class="card-content">
              <h4>{{ col.name }}</h4>
              <div class="card-meta">
                <span class="badge">
                  <i class="fas fa-bookmark"></i> {{ col.article_count }} 篇连载
                </span>
              </div>
            </div>
            <div class="card-action">
              <i class="fas fa-arrow-right"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- 仅在【既有合集，又有散篇】时才显示分割线，否则直接隐藏！ -->
      <div v-if="collections.length > 0 && articles.length > 0" class="section-divider"></div>

      <!-- ==========================================
           2. 全局状态区：加载中 & 错误提示
           ========================================== -->
      <div v-if="articleStore.isLoading" class="loading-wrapper glass-container">
        <i class="fas fa-circle-notch fa-spin"></i>
        <span>加载中...</span>
      </div>

      <div v-else-if="articleStore.error" class="error-message glass-container">
        {{ articleStore.error }}
      </div>

      <!-- ==========================================
           3. 散篇文章区
           ========================================== -->
      <div v-else-if="articles.length > 0" class="individual-articles-area">
        <div class="section-header">
          <i class="fa-solid fa-bookmark section-icon"></i>
          <h3>无归属的散篇文章</h3>
        </div>

        <FilterBar
          v-model:searchText="searchText"
          :sort-button="sortButton"
          placeholder="搜索散篇文章..."
          style="margin-bottom: 1.5rem"
        />

        <!-- 散篇文章列表 -->
        <div
          v-if="filteredItems.length > 0"
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

        <!-- 搜索无结果时的兜底 -->
        <EmptyState v-else icon="fa-ghost" message="呜呜，没有找到匹配的文章呢，换个关键词试试？" />

        <!-- 分页组件 -->
        <PaginationControls
          v-if="pagination && pagination.totalPages > 1"
          :pagination="pagination"
        />
      </div>

      <!-- ==========================================
           4. 极致兜底：如果合集和散篇都没有，就显示一个空状态提示
           ========================================== -->
      <EmptyState
        v-else-if="collections.length === 0"
        icon="fa-box-open"
        message="这里空空如也，连风声都没有留下呢..."
      />
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
import EmptyState from '@/components/common/EmptyState.vue'
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
 * 动态获取当前分类下的合集数据
 *
 * 根据 currentMeta 缓存中的 categoryKey，从全局状态中提取对应的合集数组。\
 * 如果当前分类没有合集，则返回空数组，组件中会自动隐藏合集区。
 *
 * @type {import('vue').ComputedRef<Array<Object>>}
 */
const collections = computed(() => {
  return articleStore.getCollectionList(currentMeta.value.categoryKey) || []
})

/**
 * 跳转到连载合集详情页
 *
 * 根据传入的 collectionSlug，构造目标路由路径，并通过 router.push 进行导航。\
 * 同时通过 query 参数把当前分类的 detailRouteName 传递过去，以便合集详情页能正确识别当前分类，从而在点击合集内文章时跳转到正确的详情页路由。
 */
const goToCollection = (collectionSlug: string) => {
  router.push({
    name: 'CollectionDetail',
    params: { slug: collectionSlug },
    // 通过 query 把当前分类的详情页路由名传过去，
    // 这样在合集里点击单篇文章时，就知道该往哪个详情页跳啦！
    query: { detailRouteName: currentMeta.value.detailRouteName },
  })
}

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

/* =========================================
   📁 连载合集专属样式 (Collection Cards)
   ========================================= */
.collections-area {
  margin-bottom: 2rem;
  animation: fadeInDown 0.6s var(--aero-animation) both;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1.2rem;
  color: var(--text-color);
}

.section-icon {
  color: var(--accent-color);
  font-size: 1.2rem;
}

.collections-grid {
  display: grid;
  /* 响应式网格：大屏幕排两列/三列，小屏幕排一列 */
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.2rem;
}

/* 合集卡片本体 */
.collection-card {
  display: flex;
  align-items: center;
  padding: 1.2rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.4s var(--aero-animation);
  z-index: 1;
  /* 错落有致的入场动画 */
  animation: slideUpFade 0.6s var(--aero-animation) both;
  animation-delay: var(--card-delay, 0s);
}

/* 匹配主题的发光特效 (和文章卡片同款魔法！) */
.collection-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  transition: all 0.5s var(--aero-animation);
  z-index: -1;
}

/* Frontend 赛博蓝 */
.theme-frontend .collection-card::before {
  background: linear-gradient(120deg, transparent, rgba(70, 181, 255, 0.15), transparent);
}
.dark-theme .theme-frontend .collection-card::before {
  background: linear-gradient(120deg, transparent, rgba(6, 112, 218, 0.2), transparent);
}

/* Novels 治愈绿 */
.theme-novels .collection-card::before {
  background: linear-gradient(120deg, transparent, rgba(19, 193, 158, 0.15), transparent);
}
.dark-theme .theme-novels .collection-card::before {
  background: linear-gradient(120deg, transparent, rgba(16, 122, 100, 0.2), transparent);
}

/* Topics 活力橙 */
.theme-topics .collection-card::before {
  background: linear-gradient(120deg, transparent, rgba(204, 84, 20, 0.15), transparent);
}
.dark-theme .theme-topics .collection-card::before {
  background: linear-gradient(120deg, transparent, rgba(144, 71, 20, 0.2), transparent);
}

/* 悬停时的魔法交互 */
.collection-card:hover {
  transform: translateY(-4px) scale(1.02);
  border-color: var(--accent-color);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.collection-card:hover::before {
  left: 100%; /* 扫光效果 */
}

.card-icon-wrapper {
  font-size: 2rem;
  color: var(--accent-color);
  opacity: 0.8;
  margin-right: 1.2rem;
  transition: transform 0.3s var(--aero-animation);
}

.collection-card:hover .card-icon-wrapper {
  transform: scale(1.1) rotate(-5deg);
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-content h4 {
  margin: 0 0 0.4rem 0;
  font-size: 1.1rem;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge {
  display: inline-block;
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  background: rgba(var(--accent-color-rgb, 100, 100, 100), 0.1);
  color: var(--accent-color);
  border-radius: 12px;
  font-weight: 600;
}

.card-action {
  opacity: 0;
  transform: translateX(-10px);
  color: var(--accent-color);
  transition: all 0.3s var(--aero-animation);
}

.collection-card:hover .card-action {
  opacity: 1;
  transform: translateX(0);
}

.section-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.1), transparent);
  margin: 2rem 0;
}
.dark-theme .section-divider {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
}

/* 补一点基础动画关键帧 */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
