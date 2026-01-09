<template>
  <div class="story-view-container">
    <div class="page-header">
      <div class="back-area" @click="$router.push({ name: 'Articles' })">
        <i class="fas fa-arrow-left"></i>
      </div>
      <h2 class="page-title">幻想物语</h2>
    </div>
    <div class="story-view">
      <!-- 搜索栏重新进行了封装 -->
      <FilterBar
        v-model:searchText="searchText"
        :sort-button="sortButton"
        placeholder="搜索文章..."
      />

      <div v-if="articleStore.isLoading" class="loading-wrapper glass-container">
        <i class="fas fa-circle-notch fa-spin"></i>
        <span>加载中...</span>
      </div>

      <div v-else-if="articleStore.error" class="error-message">{{ articleStore.error }}</div>

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

      <!-- 分页组件以重新进行了封装 -->
      <PaginationControls v-if="pagination && pagination.totalPages > 1" :pagination="pagination" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useArticleContent } from '@/composables/useArticleContent'
import { useSettingsStore } from '@/views/stores/useSettingsStore'
import { useSearchAndSort } from '@/composables/useSearchAndSort'
import { vTypeWriter } from '@/directives/typeWriterDirective'
import { useArticleStore } from '@/views/stores/articleStore'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import PaginationControls from '@/components/common/PaginationControls.vue'
import FilterBar from '@/components/common/FilterBar.vue'

import '@/styles/correctContentMargin.css'
import '@/styles/pageHeader.css'
import '@/styles/typeWriter.css'
import '@/styles/storyCard.css'

const router = useRouter()
const articleStore = useArticleStore()
const { formatDate } = useArticleContent()
const settingsStore = useSettingsStore()

// 前端文章列表
const articles = computed(() => {
  const list = articleStore.getArticleList('novels') || []
  return list.map((article) => ({
    ...article,
    category: 'novels' as const,
  }))
})

// 解构出 pagination
const { searchText, filteredItems, sortButton, pagination } = useSearchAndSort({
  items: articles,
  searchFields: (article) => [article.title],
  sortType: 'date',
  sortBy: (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),

  // 这里使用了 computed，所以当 settingsStore 变化时，
  // useSearchAndSort 内部的 pageSize 也会变化，从而触发重新计算分页
  // 使用 articles 专属分页配置
  itemsPerPage: computed(() => settingsStore.pagination.articles),
})

// 组件挂载时，获取小说文章列表
onMounted(async () => {
  if (!(articleStore.getArticleList('novels') || []).length) {
    await articleStore.fetchArticleIndex()
  }
})

// 阅读文章
const readArticle = (id: string) => {
  router.push({ name: 'NovelsArticle', params: { id } })
}
</script>

<style scoped>
.chapter-item::before {
  background: radial-gradient(circle at top right, rgba(19, 193, 158, 0.9), transparent);
}

.dark-theme .chapter-item::before {
  background: radial-gradient(circle at top right, rgba(16, 122, 100, 0.9), transparent);
}
</style>
