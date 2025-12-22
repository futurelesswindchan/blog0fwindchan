<!-- ArticleView.vue (renamed from TechView.vue) -->
<template>
  <div class="article-view-container">
    <h2 class="page-title-ark">Articles</h2>
    <section class="article-view">
      <div class="article-categories">
        <!-- 技术手札 -->
        <div class="article-card glass-container frontend" @click="goToArticle('FrontEnd')">
          <div class="article-icon">
            <i class="fas fa-laptop-code"></i>
          </div>
          <div class="card-content">
            <h3>技术手札</h3>
            <p class="description">网站开发笔记与心得（前后端技术栈等等等等~0vo）</p>
            <div class="article-stats">
              <span class="article-count">{{ frontendArticlesCount }} 篇文章</span>
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

        <!-- 幻想物语（连载小说） -->
        <div class="article-card glass-container novels" @click="goToArticle('Novels')">
          <div class="article-icon">
            <i class="fas fa-feather"></i>
          </div>
          <div class="card-content">
            <h3>幻想物语</h3>
            <p class="description">非常非常神秘的连载与短篇故事？！（更新非——常——慢）</p>
            <div class="article-stats">
              <span class="article-count">{{ novelsArticlesCount }} 篇文章</span>
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

        <!-- 奇怪杂谈（topics） -->
        <div class="article-card glass-container topics" @click="goToArticle('Topics')">
          <div class="article-icon">
            <i class="fas fa-user-astronaut"></i>
          </div>
          <div class="card-content">
            <h3>奇怪杂谈</h3>
            <p class="description">关于生活、兴趣与日常的随笔，当然也有一些奇奇怪怪的教程awa？</p>
            <div class="article-stats">
              <span class="article-count">{{ topicsArticlesCount }} 篇文章</span>
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
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useArticleStore } from '@/views/stores/articleStore'

import '@/styles/pageTitleArt.css'

const router = useRouter()
const articleStore = useArticleStore()

// 各类文章数量
const frontendArticlesCount = computed(() => (articleStore.getArticleList('frontend') || []).length)
const topicsArticlesCount = computed(() => (articleStore.getArticleList('topics') || []).length)
const novelsArticlesCount = computed(() => (articleStore.getArticleList('novels') || []).length)

onMounted(async () => {
  await articleStore.fetchArticleIndex()
})

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
  border: 1px solid rgba(0, 119, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  overflow: hidden;
  transition: all 0.3s var(--aero-animation);
}

.article-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0, 119, 255, 0.1) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.article-card:hover {
  transform: translateY(-5px);
  border-color: rgba(0, 119, 255, 0.5);
  box-shadow:
    0 0 20px rgba(0, 119, 255, 0.2),
    0 0 40px rgba(0, 119, 255, 0.1);
}

.article-card:hover::before {
  opacity: 1;
}

.article-icon {
  position: relative;
  width: 60px;
  height: 60px;
  background: rgba(0, 119, 255, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  transition: all 0.3s;
}

.article-icon i {
  font-size: 1.8rem;
  color: rgb(0, 119, 255);
}

.article-card:hover .article-icon {
  transform: scale(1.1) rotate(-5deg);
  background: rgba(0, 119, 255, 0.2);
  box-shadow: 0 0 20px rgba(0, 119, 255, 0.3);
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
  background: rgba(0, 119, 255, 0.15);
  border-radius: 18px;
  opacity: 0;
  transition: opacity 0.3s var(--aero-animation);
  z-index: -1;
}

.view-btn:hover {
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow:
    0 5px 15px rgba(0, 119, 255, 0.15),
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
  text-shadow: 0 0 10px rgba(0, 119, 255, 0.5);
}

.view-btn:active {
  transform: translateY(0);
  box-shadow:
    0 2px 8px rgba(0, 119, 255, 0.1),
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
  background: linear-gradient(90deg, transparent, rgba(0, 119, 255, 0.3), transparent);
}

.glow-dot {
  position: absolute;
  top: 19px;
  right: 70px;
  width: 4px;
  height: 4px;
  background: rgb(0, 119, 255);
  border-radius: 50%;
  box-shadow: 0 0 10px rgb(0, 119, 255);
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
