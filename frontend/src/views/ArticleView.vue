<!-- ArticleView.vue -->
<template>
  <div class="article-view-container">
    <h2 class="page-title-art">Articles</h2>
    <section class="article-view">
      <div class="article-categories">
        <!-- 动态渲染分类卡片，数据源已解耦至全局配置 -->
        <div
          v-for="item in ARTICLE_CATEGORIES"
          :key="item.id"
          class="article-card"
          :class="item.className"
          @click="goToArticle(item.routeName)"
        >
          <div class="article-icon">
            <i :class="item.icon"></i>
          </div>
          <div class="card-content">
            <h3>{{ item.title }}</h3>
            <p class="description">{{ item.desc }}</p>
            <div class="article-stats">
              <div v-if="articleStore.isLoading" class="skeleton-container" style="flex: 1; margin-right: 1rem;">
                <SkeletonBlock width="80%" height="1rem" style="margin-bottom: 0.4rem;" />
                <SkeletonBlock width="50%" height="1rem" />
              </div>
              <span v-else class="article-count">{{ getStatsText(item.id) }}</span>
              <button class="view-btn">
                查看文章
                <i class="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
          <div class="article-decorations">
            <div class="circuit-line"></div>
            <div class="glow-dot"></div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useArticleStore } from '@/stores/articleStore'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ARTICLE_CATEGORIES } from '@/site.config'
import SkeletonBlock from '@/components/common/SkeletonBlock.vue'

import '@/styles/layout/pageTitleArt.css'

const router = useRouter()
const articleStore = useArticleStore()

/**
 * 动态生成分类的统计文案。
 *
 * 遍历并汇总散篇文章与连载合集中的文章数量。将所有合集内的文章数也计入总数，
 * 确保向用户展示真实的产出总量。抽离此方法以配合 v-for 进行动态渲染，
 * 避免在模板中硬编码多个独立的 computed 属性。
 *
 * @param category 当前卡片的分类标识符
 * @returns 包含总数与合集数量（如有）的多行提示文本
 */
const getStatsText = (category: string) => {
  const looseArticles = articleStore.getArticleList(category) || []
  const collections = articleStore.getCollectionList(category) || []

  const totalArticles =
    looseArticles.length + collections.reduce((sum, col) => sum + col.article_count, 0)

  if (collections.length > 0) {
    return `目前共有 ${totalArticles} 篇文章\n包含 ${collections.length} 个连载合集`
  }

  return `目前共有 ${totalArticles} 篇文章`
}

onMounted(async () => {
  // NOTE: 在挂载时预检索引数据，确保子组件或路由跳转后数据不为空
  await articleStore.fetchArticleIndex()
})

/**
 * 触发分类路由跳转。
 *
 * @param routeName 目标路由名称（需与 router 配置中的 name 保持一致）
 */
const goToArticle = (routeName: string) => {
  router.push({ name: routeName })
}
</script>

<style scoped>
.article-categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 2rem;
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.article-card {
  position: relative;
  padding: 2rem;
  min-height: 360px;
  background-color: var(--light-content-bg, rgba(255, 255, 255, 0.05));
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s var(--aero-animation);

  border: 1px solid rgba(var(--accent-color-rgb), 0.15);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.5),
    inset 0 0 20px rgba(var(--accent-color-rgb), 0.05);
}

.article-card > * {
  position: relative;
  z-index: 1;
}

.article-card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image:
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.25) 0%,
      rgba(255, 255, 255, 0.05) 30%,
      transparent 50%
    ),
    radial-gradient(circle at 90% 90%, rgba(var(--accent-color-rgb), 0.1) 0%, transparent 60%),
    linear-gradient(rgba(var(--accent-color-rgb), 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--accent-color-rgb), 0.04) 1px, transparent 1px);
  background-size:
    100% 100%,
    100% 100%,
    24px 24px,
    24px 24px;
}

.article-card::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: linear-gradient(135deg, rgba(var(--accent-color-rgb), 0.15) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.article-card:hover {
  transform: translateY(-5px);
  border-color: rgba(var(--accent-color-rgb), 0.5);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.6),
    0 0 20px rgba(var(--accent-color-rgb), 0.2),
    0 0 40px rgba(var(--accent-color-rgb), 0.1);
}

.article-card:hover::after {
  opacity: 1;
}

/* ==========================================
   暗色主题适配 (Dark Theme)
   ========================================== */
.dark-theme .article-card {
  background-color: var(--dark-content-bg, rgba(0, 0, 0, 0.2));
  border-color: rgba(var(--dark-accent-color-rgb), 0.2);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.1),
    inset 0 0 20px rgba(var(--dark-accent-color-rgb), 0.05);
}

.dark-theme .article-card::before {
  background-image:
    linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 40%),
    radial-gradient(
      circle at 90% 90%,
      rgba(var(--dark-accent-color-rgb), 0.15) 0%,
      transparent 60%
    ),
    linear-gradient(rgba(var(--dark-accent-color-rgb), 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--dark-accent-color-rgb), 0.06) 1px, transparent 1px);
}

.dark-theme .article-card::after {
  background: linear-gradient(135deg, rgba(var(--dark-accent-color-rgb), 0.2) 0%, transparent 100%);
}

.dark-theme .article-card:hover {
  border-color: rgba(var(--dark-accent-color-rgb), 0.6);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.15),
    0 0 20px rgba(var(--dark-accent-color-rgb), 0.25),
    0 0 40px rgba(var(--dark-accent-color-rgb), 0.15);
}

.article-icon {
  position: relative;
  width: 60px;
  height: 60px;
  background: rgba(var(--accent-color-rgb), 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  transition: all 0.3s;
}

.article-icon i {
  font-size: 1.8rem;
  color: var(--accent-color);
}

.article-card:hover .article-icon {
  transform: scale(1.1) rotate(-5deg);
  background: rgba(var(--accent-color-rgb), 0.2);
  box-shadow: 0 0 20px rgba(var(--accent-color-rgb), 0.3);
}

.card-content h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--accent-color);
}

.description {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.article-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.article-count {
  font-size: 0.9rem;
  opacity: 0.7;
  white-space: pre-line;
}

.view-btn {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s var(--aero-animation);
  position: relative;
  overflow: hidden;
  font-weight: 500;
}

.view-btn::before {
  content: '';
  position: absolute;
  inset: 1px;
  background: rgba(var(--accent-color-rgb), 0.15);
  border-radius: 18px;
  opacity: 0;
  transition: opacity 0.3s var(--aero-animation);
  z-index: -1;
}

.view-btn:hover {
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow:
    0 5px 15px rgba(var(--accent-color-rgb), 0.15),
    0 0 20px rgba(255, 255, 255, 0.1);
}

.view-btn:hover::before {
  opacity: 1;
}

.view-btn::after {
  content: '';
  position: absolute;
  inset: -50%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transform: translateX(-100%) skewX(-15deg);
  transition: transform 0.6s var(--aero-animation);
}

.view-btn:hover::after {
  transform: translateX(100%) skewX(-15deg);
}

.view-btn i {
  font-size: 0.9em;
  transition: all 0.3s var(--aero-animation);
  opacity: 0.8;
}

.view-btn:hover i {
  transform: translateX(3px);
  opacity: 1;
  text-shadow: 0 0 10px rgba(var(--accent-color-rgb), 0.5);
}

.view-btn:active {
  transform: translateY(0);
  box-shadow:
    0 2px 8px rgba(var(--accent-color-rgb), 0.1),
    0 0 10px rgba(255, 255, 255, 0.05);
}

.article-decorations {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  pointer-events: none;
  overflow: hidden;
}

.circuit-line {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(var(--accent-color-rgb), 0.3), transparent);
}

.glow-dot {
  position: absolute;
  top: 19px;
  right: 70px;
  width: 4px;
  height: 4px;
  background: var(--accent-color);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--accent-color);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.3;
  }
}

@media screen and (max-width: 1289px) {
  .article-categories {
    grid-template-columns: 1fr;
  }

  .article-card {
    min-height: 220px;
  }
}
</style>
