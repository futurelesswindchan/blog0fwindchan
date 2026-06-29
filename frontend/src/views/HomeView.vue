<!-- src/views/HomeView.vue -->
<template>
  <div class="home-view-container">
    <h2 class="page-title-art">{{ homeInfo.pageTitle }}</h2>
    <div class="home-dashboard">
      <!-- Hero: 个人信息展示区 -->
      <section class="hero-section glass-content">
        <div class="hero-content">
          <!-- 左侧：头像（点击翻转显示二维码）+ 状态 -->
          <div class="profile-group">
            <div class="avatar-wrapper" @click="toggleAvatarFlip">
              <div class="avatar-inner" :class="{ 'is-flipped': isAvatarFlipped }">
                <div class="avatar-front">
                  <LazyImage
                    :src="avatarUrl"
                    alt="Avatar"
                    className="avatar-img"
                    :containerStyle="{ width: '100%', height: '100%' }"
                  />
                </div>
                <div class="avatar-back">
                  <LazyImage
                    :src="qrCodeUrl"
                    alt="QRCode"
                    className="qrcode-img"
                    :containerStyle="{ width: '100%', height: '100%' }"
                  />
                </div>
              </div>
            </div>

            <div class="profile-info">
              <h1 class="nickname">{{ homeInfo.nickname }}</h1>
              <div class="status-badge">
                <span class="status-dot"></span>
                <span class="status-text">{{ homeInfo.statusText }}</span>
              </div>
            </div>
          </div>

          <!-- 右侧：Slogan 打字机 + 社交链接 -->
          <div class="slogan-group">
            <TypeWriter :text="homeInfo.sloganText" :speed="80" :delay="500" class="slogan-text" />
            <p class="slogan-sub" v-html="homeInfo.sloganSub1"></p>

            <div class="social-links">
              <a
                v-for="link in socialLinks"
                :key="link.name"
                :href="link.link"
                target="_blank"
                class="social-btn"
                :title="link.name"
                :style="{ '--hover-color': link.color }"
              >
                <i :class="link.icon"></i>
              </a>
            </div>
            <p class="slogan-sub">{{ homeInfo.sloganSub2 }}</p>
          </div>
        </div>
      </section>

      <!-- B区: Dynamic Stream (动态内容) -->
      <section class="dynamic-section">
        <h2 class="section-title"><i class="fas fa-bolt"></i> 最新动态</h2>

        <div class="dynamic-grid">
          <!-- 加载态：骨架屏占位 -->
          <template v-if="isLoading">
            <!-- 文章骨架卡 ×2 -->
            <div
              v-for="n in 2"
              :key="'skeleton-article-' + n"
              class="dynamic-card glass-container skeleton-card"
            >
              <div class="card-content">
                <SkeletonBlock width="70%" height="1.3rem" />
                <SkeletonBlock width="40%" height="0.9rem" style="margin-top: 0.6rem" />
                <SkeletonBlock width="55%" height="0.9rem" style="margin-top: 0.5rem" />
              </div>
            </div>
            <!-- 画作骨架卡 ×1 -->
            <div class="dynamic-card glass-container skeleton-card">
              <SkeletonBlock width="100%" height="100%" radius="8px" />
            </div>
          </template>

          <!-- 加载完成：真实内容 -->
          <template v-else>
            <!-- 1. 最新文章卡片 (2篇) -->
            <div
              v-for="article in latestArticles"
              :key="article.id"
              class="dynamic-card article-card glass-content"
              @click="navigateToArticle(article)"
            >
              <div class="card-badge">New Article</div>
              <div class="card-content">
                <h3 class="card-title">{{ article.title }}</h3>
                <div class="card-meta">
                  <i class="far fa-calendar-alt"></i>
                  {{ article.date }}
                </div>
                <p class="card-desc">点击阅读全文...</p>
              </div>
              <div class="card-icon">
                <i class="fas fa-file-alt"></i>
              </div>
            </div>

            <!-- 2. 最新画作卡片 (1幅) -->
            <div
              v-if="latestArtwork"
              class="dynamic-card artwork-card glass-container"
              @click="navigateToGallery"
            >
              <div class="card-badge">New Art</div>
              <!-- 背景图 -->
              <LazyImage
                :src="latestArtwork.thumbnail ?? ''"
                :alt="latestArtwork.title ?? ''"
                className="artwork-bg"
                :containerStyle="{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 0,
                  opacity: 0.6,
                }"
              />
              <div class="card-content artwork-content">
                <h3 class="card-title">{{ latestArtwork.title }}</h3>
                <div class="card-meta">
                  <i class="fas fa-palette"></i>
                  {{ latestArtwork.date }}
                </div>
              </div>
            </div>
          </template>
        </div>
      </section>

      <!-- C区: Navigation Portals (传送门) -->
      <section class="portal-section">
        <h2 class="section-title"><i class="fas fa-compass"></i> 快捷导航</h2>

        <div class="portal-grid">
          <div
            v-for="item in portalItems"
            :key="item.title"
            class="portal-card glass-content"
            @click="navigateToFeature(item.route)"
          >
            <div class="portal-icon">
              <i :class="['fas', item.icon]"></i>
            </div>
            <div class="portal-info">
              <h3>{{ item.title }}</h3>
              <p>{{ item.desc }}</p>
            </div>
            <!-- 悬停时的背景装饰 -->
            <div class="portal-glow"></div>
          </div>
        </div>
      </section>

      <!-- D区: Stats & Plans (轨迹与未来awa) -->
      <section class="stats-plan-section">
        <h2 class="section-title"><i class="fas fa-chart-line"></i> 轨迹与未来</h2>
        <div class="stats-grid">
          <ContributionHeatmap class="glass-content heatmap-container" />
          <PlanBoard class="glass-content plan-container" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAllArticles } from '@/composables/useAllArticles'
import type { ArticleWithCategory } from '@/types/article'
import { socialLinks, portalItems, homeInfo } from '@/site.config'
import { useArtworkStore } from '@/stores/artworkStore'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import ContributionHeatmap from '@/components/home/ContributionHeatmap.vue'
import TypeWriter from '@/components/common/TypeWriter.vue'
import SkeletonBlock from '@/components/common/SkeletonBlock.vue'
import LazyImage from '@/components/common/LazyImage.vue'
import PlanBoard from '@/components/home/PlanBoard.vue'

import '@/styles/layout/pageTitleArt.css'

// --- 资源路径 ---
const avatarUrl = '/assets/images/logo.webp'
const qrCodeUrl = '/assets/images/qrcode.svg'

// --- 状态管理 ---
const router = useRouter()
const artworkStore = useArtworkStore()
const { fetchAllArticles, sortedArticles, isFetchingGlobal } = useAllArticles()
const isAvatarFlipped = ref(false)

// --- 数据获取 ---
const isLoading = computed(() => isFetchingGlobal.value || artworkStore.loading)

// 获取最新文章 (合并所有分类，按日期排序，取前2篇)
const latestArticles = computed<ArticleWithCategory[]>(() => {
  return sortedArticles.value.slice(0, 2)
})

// 获取最新画作 (取第1幅)
const latestArtwork = computed(() => {
  if (artworkStore.artworks.length > 0) {
    return artworkStore.artworks[artworkStore.artworks.length - 1]
  }
  return null
})

onMounted(async () => {
  // 并行加载数据
  await Promise.all([fetchAllArticles(), artworkStore.fetchArtworks()])
})

// --- 交互逻辑 ---
const toggleAvatarFlip = () => {
  isAvatarFlipped.value = !isAvatarFlipped.value
}

const navigateToArticle = (article: ArticleWithCategory) => {
  // 不用再痛苦地反查啦，直接用 article.category 0v0
  router.push(`/articles/${article.category}/${article.id}`)
}

const navigateToGallery = () => {
  router.push('/gallery')
}

const navigateToFeature = (route: string) => {
  router.push(route)
}
</script>

<style scoped>
/* --- 基础布局 --- */
.home-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 3rem;
  min-height: 80vh;
}

.section-title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.9;
}

/* --- A区: Hero Section --- */
.hero-section {
  padding: 3rem;
  position: relative;
  overflow: hidden;
}

.hero-content {
  display: flex;
  align-items: center;
  gap: 4rem;
  position: relative;
  z-index: 2;
}

/* 头像翻转特效 */
.avatar-wrapper {
  margin: 0 auto;
  width: 180px;
  height: 180px;
  perspective: 1000px;
  cursor: pointer;
}

.avatar-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.8s;
  transform-style: preserve-3d;
}

.avatar-inner.is-flipped {
  transform: rotateY(180deg);
}

.avatar-front,
.avatar-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

.avatar-back {
  transform: rotateY(180deg);
  background: white; /* 二维码通常需要白底 */
}

/* 个人信息 */
.profile-info {
  margin-top: 1.5rem;
  text-align: center;
}

.nickname {
  font-family: 'ZiYanShiFanXingShouJi-2', cursive;
  font-size: 2rem;
  margin: 0;
  line-height: 1.2;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #4caf50;
  border-radius: 50%;
  box-shadow: 0 0 8px #4caf50;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

/* 右侧 Slogan 与 社交 */
.slogan-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.slogan-text {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 1rem;
  min-height: 2.4rem; /* 防止打字时高度跳动 */
}

.slogan-sub {
  font-size: 1.1rem;
  line-height: 1.6;
  opacity: 0.8;
}

.social-links {
  display: flex;
  gap: 1.5rem;
}

.social-btn {
  width: 45px;
  height: 45px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: inherit;
  transition: all 0.3s ease;
  text-decoration: none;
}

.social-btn:hover {
  background: var(--hover-color);
  color: white;
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

/* --- B区: Dynamic Grid --- */
.dynamic-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.dynamic-card {
  height: 100px;
  padding: 1.5rem;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    background-color 0.3s;
}

.dynamic-card:hover {
  transform: translateY(-5px);
}

.card-badge {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  z-index: 2;
}

.card-content {
  margin: auto 0;
  position: relative;
}

.card-title {
  font-size: 1.3rem;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
  z-index: 2;
  position: relative;
}

.card-meta {
  font-size: 0.9rem;
  opacity: 0.7;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 2;
  position: relative;
}

.card-desc {
  font-size: 0.9rem;
  margin-top: auto;
  opacity: 0.8;
}

.card-icon {
  position: absolute;
  bottom: -10px;
  right: -10px;
  font-size: 6rem;
  opacity: 0.05;
  transform: rotate(-15deg);
  transition: all 0.3s ease;
}

.article-card:hover .card-icon {
  transform: rotate(0deg) scale(1.1);
}

/* 画作卡片特殊样式 */
.artwork-content {
  position: relative;
  z-index: 2;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  margin-top: auto; /* 推到底部 */
}

/* --- C区: Portal Grid --- */
.portal-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.portal-card {
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  position: relative;
  overflow: hidden; /* 必须隐藏溢出的光 */
  /* 保持原有过渡 */
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    border-color 0.3s;
  /* 给一个透明边框，hover时变色 */
  border: 1px solid transparent;
}

/* 悬停状态 */
.portal-card:hover {
  /* 边框亮起 */
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(var(--accent-color), 0.15);
}

.portal-card:hover::before {
  /* 触发动画：从左扫到右 */
  left: 150%;
  transition: left 0.6s ease-in-out;
}

/* 图标上浮增强 */
.portal-card:hover .portal-icon {
  transform: scale(1.1) translateY(-5px);
  text-shadow: 0 5px 15px var(--accent-color); /* 图标发光 */
}

.portal-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  transition: transform 0.3s ease;
}

.portal-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
}

.portal-info p {
  font-size: 0.9rem;
  opacity: 0.7;
  margin: 0;
}

/* --- 响应式适配 --- */

/* 平板 (Tablet) */
@media (max-width: 1024px) {
  .hero-content {
    flex-direction: column;
    text-align: center;
    gap: 2rem;
  }

  .slogan-group {
    align-items: center;
  }

  .dynamic-grid {
    grid-template-columns: repeat(2, 1fr); /* 2列 */
  }

  .dynamic-card:last-child {
    grid-column: span 2; /* 画作卡片占满一行 */
  }

  .portal-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 手机 (Mobile) */
@media (max-width: 768px) {
  .home-dashboard {
    padding: 1rem;
    gap: 2rem;
  }

  .hero-section {
    padding: 2rem 1.5rem;
  }

  .avatar-wrapper {
    width: 140px;
    height: 140px;
  }

  .nickname {
    font-size: 2.8rem;
  }

  .slogan-text {
    font-size: 1.4rem;
    min-height: auto;
  }

  .dynamic-grid {
    grid-template-columns: 1fr; /* 单列 */
  }

  .dynamic-card:last-child {
    grid-column: span 1;
  }

  .portal-grid {
    grid-template-columns: 1fr;
  }

  .portal-card {
    display: flex;
    align-items: center;
    text-align: left;
    padding: 1.5rem;
    gap: 1.5rem;
  }

  .portal-icon {
    margin-bottom: 0;
    font-size: 2rem;
  }
}

/* 深色模式微调 */
:deep(.dark-theme) .social-btn {
  background: rgba(255, 255, 255, 0.05);
}

:deep(.dark-theme) .card-icon {
  opacity: 0.1; /* 深色模式下图标稍微明显一点 */
}

/* --- 骨架卡样式 --- */
.skeleton-card {
  cursor: default;
  pointer-events: none;
}

.skeleton-card:hover {
  transform: none;
  box-shadow: none;
}

/* --- D区 --- */
.stats-plan-section {
  animation: slideUp 0.8s ease backwards;
  animation-delay: 0.4s;
}

.stats-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 3rem;
}

.heatmap-container,
.plan-container {
  padding: 1.8rem;
  border-radius: 8px;
  width: 100%;
  box-sizing: border-box;
}
/* ------------- */
</style>
