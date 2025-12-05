<template>
  <div class="story-view-container">
    <div class="page-header">
      <div class="back-area" @click="$router.push({ name: 'Articles' })">
        <i class="fas fa-arrow-left"></i>
      </div>
      <h2 class="page-title">网站开发笔记</h2>
    </div>
    <div class="story-view">
      <!-- 搜索和排序栏 -->
      <div class="filter-bar glass-container">
        <input v-model="searchText" type="text" class="search-input" placeholder="搜索文章..." />
        <button class="sort-button" @click="sortButton.toggle">
          <i :class="['fas', sortButton.icon]"></i>
          {{ sortButton.label }}
        </button>
      </div>

      <div v-if="articleStore.isLoading" class="loading-wrapper glass-container">
        <i class="fas fa-circle-notch fa-spin"></i>
        <span>加载文章列表中...</span>
      </div>
      <div v-else-if="articleStore.error" class="error-message">
        {{ articleStore.error }}
      </div>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useArticleStore } from '@/views/stores/articleStore'
import { useSearchAndSort } from '@/composables/useSearchAndSort'
import { vTypeWriter } from '@/directives/typeWriterDirective'
import '@/styles/storyCard.css'
import '@/styles/pageHeader.css'
import '@/styles/searchBar.css'
import '@/styles/typeWriter.css'

const router = useRouter()
const articleStore = useArticleStore()

// 前端文章列表
const articles = computed(() => {
  const list = articleStore.getArticleList('frontend') || []
  return list.map((article) => ({
    ...article,
    category: 'frontend' as const,
  }))
})

// 搜索和排序
const { searchText, filteredItems, sortButton } = useSearchAndSort({
  // 这里原本是`articles.value`，现在已修正为`articles`
  // 确保传递的是计算属性本身，而不是其值
  // 否则会导致响应式更新失效
  items: articles,
  searchFields: (article) => [article.title],
  sortType: 'date',
  sortBy: (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
})

// 组件挂载时，获取前端文章列表
onMounted(async () => {
  if (!(articleStore.getArticleList('frontend') || []).length) {
    await articleStore.fetchArticleIndex()
  }
})

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 跳转到具体文章
const readArticle = (articleId: string) => {
  router.push({
    name: 'FrontEndArticle',
    params: { id: articleId },
  })
}
</script>

<style scoped>
.chapter-item::before {
  background: radial-gradient(circle at top right, rgba(70, 181, 255, 0.9), transparent);
}

.dark-theme .chapter-item::before {
  background: radial-gradient(circle at top right, rgba(6, 112, 218, 0.9), transparent);
}
</style>
