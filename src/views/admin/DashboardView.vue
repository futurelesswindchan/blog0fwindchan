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

// 组件挂载时，获取文章列表
onMounted(() => {
  articleStore.fetchArticleIndex()
})

// 编辑文章
const editArticle = (article: ArticleSummary & { category: string }) => {
  // 跳转到我们即将改造的 Editor 路由
  router.push({
    name: 'EditorEdit',
    params: { category: article.category, slug: article.id },
  })
}

// 删除文章
const deleteArticle = async (article: ArticleSummary & { category: string }) => {
  if (confirm(`确定要删除文章《${article.title}》吗？这个操作不可撤销！`)) {
    try {
      await api.delete(`/articles/${article.id}`)
      // 这里做了更新 store 的操作，移除被删除的文章

      articleStore.$patch((state) => {
        const list = state.articles[article.category]
        if (list) {
          state.articles[article.category] = list.filter((item) => item.id !== article.id)
        }
      })
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
/* 公共样式 - 浅色深色共享的布局和尺寸 */
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
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  cursor: pointer;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s var(--aero-animation);
  padding: 0 0.5rem;
  text-decoration: none;
  color: black;
}

.dark-theme .action-area {
  color: white;
  border-left-color: rgba(255, 255, 255, 0.05);
}

.action-area:hover {
  background-color: rgb(0, 119, 255);
}

.action-area:hover i {
  transform: translateX(3px);
  color: white;
}

.action-area i {
  font-size: 1.2em;
  transition: transform 0.3s var(--aero-animation);
  color: var(--accent-color);
}

/* glass-container 公共样式 */
.glass-container {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

.dark-theme .glass-container {
  background: rgba(30, 30, 40, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* 文章列表区域 */
.article-list-wrapper {
  margin: 2rem 0 0 0;
  padding: 1rem;
  overflow-x: auto;
}

.article-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  color: inherit;
}

.article-table th,
.article-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.dark-theme .article-table th,
.dark-theme .article-table td {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.article-table th {
  font-weight: 600;
  color: var(--accent-color);
  background: rgba(0, 119, 255, 0.08);
  border-bottom: 2px solid rgba(0, 119, 255, 0.2);
}

.dark-theme .article-table th {
  background: rgba(0, 119, 255, 0.08);
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.article-table tr {
  transition: background-color 0.2s ease;
}

.article-table tr:hover {
  background: rgba(0, 119, 255, 0.05);
}

.dark-theme .article-table tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

/* 分类标签 */
.category-badge {
  background: rgba(0, 119, 255, 0.15);
  color: #0077ff;
  border: 1px solid rgba(0, 119, 255, 0.3);
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
  display: inline-block;
}

.dark-theme .category-badge {
  color: #a0c8ff;
}

/* 操作按钮 */
.action-cell {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: var(--text-color-secondary);
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark-theme .action-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #b0b0b0;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dark-theme .action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.edit-btn:hover {
  color: #43e97b;
  border-color: rgba(67, 233, 123, 0.3);
}

.delete-btn:hover {
  color: #ff6b6b;
  border-color: rgba(255, 107, 107, 0.3);
}

/* 加载状态和错误消息 */
.loading-wrapper,
.error-message {
  color: inherit;
  padding: 1rem;
  text-align: center;
  border-radius: 8px;
}

.loading-wrapper {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
}

.dark-theme .loading-wrapper {
  background: rgba(30, 30, 40, 0.7);
}

.error-message {
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.2);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .dashboard-content {
    padding: 0.5rem;
    margin: 1rem auto;
  }

  .article-list-wrapper {
    margin: 1rem 0 0 0;
    padding: 0.5rem;
  }

  .article-table th,
  .article-table td {
    padding: 0.75rem 0.5rem;
  }

  .category-badge {
    padding: 0.15rem 0.5rem;
    font-size: 0.75rem;
  }

  .action-cell {
    gap: 0.25rem;
  }

  .action-btn {
    width: 30px;
    height: 30px;
  }

  .action-area {
    width: 60px;
    padding: 0;
    background: rgba(255, 255, 255, 0.1);
  }

  .dark-theme .action-area {
    background: rgba(0, 0, 0, 0.1);
  }

  .action-area:active {
    background: rgba(0, 119, 255, 0.2);
  }

  .action-area i {
    font-size: 1.4em;
  }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
  .article-table {
    font-size: 0.9rem;
  }

  .article-table th,
  .article-table td {
    padding: 0.5rem 0.25rem;
  }

  .category-badge {
    font-size: 0.7rem;
    padding: 0.1rem 0.4rem;
  }
}
</style>
