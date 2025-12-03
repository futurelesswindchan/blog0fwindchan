<template>
  <div class="dashboard-container">
    <div class="page-header">
      <div class="back-area" @click="$router.back()">
        <i class="fas fa-arrow-left"></i>
      </div>
      <h2 class="page-title">内容管理面板</h2>
      <router-link :to="{ name: 'EditorCreate' }" class="action-area">
        <i class="fas fa-pencil-alt">&ensp;写新文章</i>
      </router-link>
    </div>

    <div class="dashboard-content">
      <div v-if="articleStore.isLoading" class="loading-wrapper">加载中...</div>
      <div v-else-if="articleStore.error" class="error-message">{{ articleStore.error }}</div>

      <div v-else class="article-list-wrapper glass-container">
        <table class="article-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>分类</th>
              <th>发布日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="article in allArticles" :key="`${article.category}-${article.id}`">
              <td>{{ article.title }}</td>
              <td>
                <span class="category-badge">{{ article.category }}</span>
              </td>
              <td>{{ formatDate(article.date) }}</td>
              <td class="action-cell">
                <button @click="editArticle(article)" class="action-btn edit-btn" title="编辑">
                  <i class="fas fa-pen"></i>
                </button>
                <button @click="deleteArticle(article)" class="action-btn delete-btn" title="删除">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useArticleStore, type ArticleSummary } from '@/views/stores/articleStore'
import { useArticleContent } from '@/composables/useArticleContent'
import api from '@/api'
import '@/styles/pageHeader.css'

const articleStore = useArticleStore()
const router = useRouter()
const { formatDate } = useArticleContent()

// 将 store 中按分类的对象，扁平化成一个数组，方便渲染
// 并为每篇文章加上 category 属性
const allArticles = computed(() => {
  const articlesByCat = articleStore.articles
  // 使用 Object.entries 和 flatMap 来处理
  return Object.entries(articlesByCat).flatMap(([category, articles]) =>
    articles.map((article) => ({ ...article, category })),
  )
})

onMounted(() => {
  articleStore.fetchArticleIndex()
})

const editArticle = (article: ArticleSummary & { category: string }) => {
  // 跳转到我们即将改造的 Editor 路由
  router.push({
    name: 'EditorEdit',
    params: { category: article.category, slug: article.id },
  })
}

const deleteArticle = async (article: ArticleSummary & { category: string }) => {
  if (confirm(`确定要删除文章《${article.title}》吗？这个操作不可撤销！`)) {
    try {
      await api.delete(`/articles/${article.id}`)
      // 删除成功后，从前端列表里移除，实现即时刷新
      // 注意：这里只是一个简单的UI刷新，更稳健的做法是重新 fetchArticleIndex
      articleStore.fetchArticleIndex() // 重新获取列表
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert('删除失败: ' + error.message)
      } else {
        alert('删除失败: 未知错误')
      }
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  width: 100%;
  min-height: inherit;
}

.dashboard-content {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 1rem;
  position: relative;
}

.action-area {
  color: black;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  cursor: pointer;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s var(--aero-animation);
  padding: 0 0.5rem;
  text-decoration: none;
}

.dark-theme .action-area {
  color: white;
  border-left-color: rgba(255, 255, 255, 0.05);
}

.action-area:hover {
  background-color: rgb(0, 119, 255);
}

.action-area i {
  font-size: 1.2em;
  transition: transform 0.3s var(--aero-animation);
  color: var(--accent-color);
}

.action-area:hover i {
  transform: translateX(3px);
  color: white;
}

.dark-theme .action-area {
  border-left-color: rgba(255, 255, 255, 0.05);
}

.dark-theme .action-area:hover {
  background-color: rgb(0, 119, 255);
}

.article-list-wrapper {
  margin: 2rem 0 0 0;
  padding: 1rem;
  overflow-x: auto;
}

.article-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.article-table th,
.article-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dark-theme .article-table th,
.dark-theme .article-table td {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.article-table th {
  font-weight: bold;
  color: var(--accent-color);
}

.category-badge {
  background: rgba(0, 119, 255, 0.2);
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  text-transform: capitalize;
}

.action-cell {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-color-secondary);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: currentColor;
}

.edit-btn:hover {
  color: #43e97b;
}
.delete-btn:hover {
  color: #ff6b6b;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .action-area {
    width: 60px;
    padding: 0;
    background: rgba(255, 255, 255, 0.1);
  }

  .action-area:active {
    background: rgba(0, 119, 255, 0.2);
  }

  .action-area i {
    font-size: 1.4em;
  }

  .dark-theme .action-area {
    background: rgba(0, 0, 0, 0.1);
  }

  .dark-theme .action-area:active {
    background: rgba(0, 119, 255, 0.2);
  }
}
</style>
