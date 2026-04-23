<!-- frontend/src/views/articles/CollectionView.vue -->
<template>
  <div class="story-view-container" :class="themeClass">
    <!--
      为了保持和原分类一致的沉浸感，我们可以尝试从 query 获取主题色，
      如果没有，就给一个默认的合集专属主题色
    -->
    <!-- 顶部导航 -->
    <div class="page-header">
      <div @click="$router.back()" class="back-area">
        <i class="fas fa-arrow-left"></i>
      </div>
      <h2 class="page-title">{{ currentMeta?.pageTitle || '加载中...' }}</h2>
    </div>

    <div class="story-view">
      <!-- 状态区：加载与错误 -->
      <div v-if="articleStore.isLoading" class="loading-wrapper glass-container">
        <i class="fas fa-circle-notch fa-spin"></i>
        <span>正在从书库中搬运合集数据...</span>
      </div>

      <div v-else-if="articleStore.error" class="error-message glass-container">
        {{ articleStore.error }}
      </div>

      <!-- 合集内容区 -->
      <div v-else-if="currentCollection" class="collection-content">
        <!-- ==========================================
             1. 合集简介卡片 (书籍封面区)
             ========================================== -->
        <div class="collection-info-card glass-container">
          <div class="info-header">
            <i class="fas fa-book-open info-icon"></i>
            <div>
              <h3>{{ currentCollection.name }}</h3>
              <div class="meta-tags">
                <span class="badge">
                  <i class="fas fa-list-ol"></i> 共 {{ currentCollection.articles?.length || 0 }} 篇
                </span>
              </div>
            </div>
          </div>
          <div class="info-body">
            <p>{{ currentCollection.description || '作者很神秘，什么简介都没有留下呢...' }}</p>
          </div>
        </div>

        <div class="section-divider"></div>

        <!-- ==========================================
             2. 目录正文区 (完美接入打字机动画！)
             ========================================== -->
        <div class="section-header">
          <i class="fas fa-bookmark section-icon"></i>
          <h3>正文目录</h3>
        </div>

        <!-- 只有当合集里有文章时，才显示搜索栏和内容 -->
        <template v-if="currentCollection.articles && currentCollection.articles.length > 0">
          <!-- 搜索与排序控制栏 -->
          <FilterBar
            v-model:searchText="searchText"
            :sort-button="sortButton"
            placeholder="在合集中搜索章节..."
            style="margin-bottom: 1.5rem"
          />
          <!-- 章节列表 -->
          <div
            v-if="filteredItems.length > 0"
            class="chapter-list type-writer"
            v-type-writer="{
              mode: 'both',
              delay: 200,
              elementDelay: 150,
              textDelay: 250,
            }"
          >
            <div
              v-for="article in filteredItems"
              :key="article.id"
              class="chapter-item glass-container"
              @click="readArticle(article.id)"
            >
              <div class="chapter-info">
                <!-- 使用计算好的固定序号，确保搜索和分页都不会乱 -->
                <span class="chapter-date"> 第 {{ article.chapterNum }} 篇 </span>
                <h3>{{ article.title }}</h3>
              </div>
              <div class="chapter-right-meta">
                <span class="article-date">{{ formatDate(article.date) }}</span>
                <i class="fas fa-chevron-right"></i>
              </div>
            </div>
          </div>
          <!-- 引入通用空状态组件 -->
          <EmptyState v-else icon="fa-search" message="在这个合集里没有找到相关章节呢..." />
          <!-- 分页组件 -->
          <PaginationControls
            v-if="pagination && pagination.totalPages > 1"
            :pagination="pagination"
          />
        </template>
        <!-- 如果合集里一篇文章都没有 -->
        <EmptyState
          v-else
          icon="fa-pen-fancy"
          message="这个合集还在筹备中哦，作者正在努力码字呢！"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useArticleContent } from '@/composables/useArticleContent'
import { useSettingsStore } from '@/views/stores/useSettingsStore'
import { useSearchAndSort } from '@/composables/useSearchAndSort'
import { useCategoryMeta } from '@/composables/useCategoryMeta'
import { vTypeWriter } from '@/directives/typeWriterDirective'
import { useArticleStore } from '@/views/stores/articleStore'
import { useRoute, useRouter } from 'vue-router'
import { onMounted, computed } from 'vue'

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
const { formatDate } = useArticleContent() // 引入格式化日期的小工具

// 一行代码搞定路由状态缓存！清爽又优雅 0wO
const { currentMeta } = useCategoryMeta()

// 绑定全局状态里的当前合集数据
const currentCollection = computed(() => articleStore.currentCollection)

// 如果上一级页面传了主题色，我们就接住它，否则用默认的紫罗兰色调
const themeClass = computed(() => (route.query.themeClass as string) || 'theme-collection')

// 组件挂载时，根据路由参数拉取合集详情
onMounted(async () => {
  const slug = route.params.slug as string
  if (slug) {
    await articleStore.fetchCollectionDetail(slug)
  }
})

// 阅读合集内的单篇文章
const readArticle = (articleId: string) => {
  // 从 query 中提取刚刚 CategoryListView 传过来的路由名 (如 FrontEndArticle)
  const detailRouteName = (route.query.detailRouteName as string) || 'FrontEndArticle'

  router.push({
    name: detailRouteName,
    params: { id: articleId },
  })
}

// 提前给文章打上绝对的章节序号，防止分页和搜索打乱序号
const articlesWithChapter = computed(() => {
  if (!currentCollection.value?.articles) return []
  return currentCollection.value.articles.map((article, index) => ({
    ...article,
    chapterNum: index + 1, // 绝对序号
  }))
})

// 引入搜索、排序与分页逻辑
const { searchText, filteredItems, sortButton, pagination } = useSearchAndSort({
  items: articlesWithChapter,
  searchFields: (article) => [article.title],
  sortType: 'date',
  // 合集内文章通常是旧的在前面
  sortBy: (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  itemsPerPage: computed(() => settingsStore.pagination.articles),
})
</script>

<style scoped>
/* =========================================
   合集专属样式补丁
   ========================================= */

.collection-info-card {
  padding: 1.5rem;
  margin-bottom: 2rem;
  border-left: 4px solid var(--accent-color); /* 增加一点书本装订线的质感 */
  animation: fadeInDown 0.6s var(--aero-animation) both;
}

.info-header {
  display: flex;
  align-items: flex-start;
  gap: 1.2rem;
  margin-bottom: 1rem;
}

.info-icon {
  font-size: 2.5rem;
  color: var(--accent-color);
  opacity: 0.9;
  margin-top: 0.2rem;
}

.info-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.4rem;
  color: var(--text-color);
}

.meta-tags {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.badge {
  display: inline-block;
  font-size: 0.8rem;
  padding: 0.3rem 0.8rem;
  background: rgba(var(--accent-color-rgb, 100, 100, 100), 0.1);
  color: var(--accent-color);
  border-radius: 20px;
  font-weight: 600;
}
.time-badge {
  background: rgba(156, 39, 176, 0.1);
  color: #9c27b0;
}
.dark-theme .time-badge {
  background: rgba(206, 147, 216, 0.15);
  color: #ce93d8;
}
.info-body {
  font-size: 0.95rem;
  line-height: 1.6;
  white-space: pre-wrap;
  opacity: 0.85;
  padding-top: 0.8rem;
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
}
.dark-theme .info-body {
  border-top-color: rgba(255, 255, 255, 0.1);
}
.section-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.1), transparent);
  margin: 2rem 0;
}
.dark-theme .section-divider {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
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
/* =========================================
   章节列表专属微调
   ========================================= */
.chapter-right-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.article-date {
  font-size: 0.85rem;
  opacity: 0.6;
}
/* 默认的合集主题光效 (如果没传主题过来，就用神秘紫罗兰色) */
.theme-collection .chapter-item::before {
  background: radial-gradient(circle at top right, rgba(156, 39, 176, 0.9), transparent);
}
.dark-theme .theme-collection .chapter-item::before {
  background: radial-gradient(circle at top right, rgba(123, 31, 162, 0.9), transparent);
}
/* 基础动画 */
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
/* 移动端适配 */
@media (max-width: 768px) {
  .article-date {
    display: none; /* 手机屏幕太小的话，就隐藏精确日期，保持清爽 */
  }
}
</style>
