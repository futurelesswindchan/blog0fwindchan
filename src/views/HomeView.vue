<!-- src/views/HomeView.vue -->
<template>
  <div class="home-dashboard">
    <!-- A区: Hero Dashboard -->
    <section class="hero-section glass-container">
      <div class="hero-content">
        <!-- 左侧：头像与状态 -->
        <div class="profile-group">
          <div class="avatar-wrapper" @click="toggleAvatarFlip">
            <div class="avatar-inner" :class="{ 'is-flipped': isAvatarFlipped }">
              <!-- 正面：头像 -->
              <div class="avatar-front">
                <LazyImage
                  :src="avatarUrl"
                  alt="Avatar"
                  className="avatar-img"
                  :containerStyle="{ width: '100%', height: '100%' }"
                />
              </div>
              <!-- 背面：二维码 -->
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
            <h1 class="nickname">Wind Chan</h1>
            <div class="status-badge">
              <span class="status-dot"></span>
              <span class="status-text">Coding & Dreaming...</span>
            </div>
          </div>
        </div>

        <!-- 右侧：Slogan 打字机 -->
        <div class="slogan-group">
          <TypeWriter :text="sloganText" :speed="80" :delay="500" class="slogan-text" />
          <p class="slogan-sub">
            欢迎来到风风的赛博小屋 ~\(≧▽≦)/~<br />
            这里记录着代码、故事和...忘了还有什么了！QAQ
          </p>

          <!-- 社交链接集成在 Hero 区域 -->
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
          <p class="slogan-sub">⬆️联系方式⬆️ 欢迎交流哦ov0</p>
        </div>
      </div>
    </section>

    <!-- B区: Dynamic Stream (动态内容) -->
    <section class="dynamic-section">
      <h2 class="section-title"><i class="fas fa-bolt"></i> 最新动态</h2>

      <div class="dynamic-grid">
        <!-- 1. 最新文章卡片 (2篇) -->
        <div
          v-for="article in latestArticles"
          :key="article.id"
          class="dynamic-card article-card glass-container"
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
            :src="latestArtwork.thumbnail"
            :alt="latestArtwork.title"
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

        <!-- 骨架屏/加载占位 (当数据未加载时) -->
        <div v-if="isLoading" class="dynamic-card glass-container loading-card">
          <i class="fas fa-circle-notch fa-spin"></i>
          <span>Loading...</span>
        </div>
      </div>
    </section>

    <!-- C区: Navigation Portals (传送门) -->
    <section class="portal-section">
      <h2 class="section-title"><i class="fas fa-compass"></i> 探索世界</h2>

      <div class="portal-grid">
        <div
          v-for="item in features"
          :key="item.title"
          class="portal-card glass-container"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useArticleStore, type ArticleSummary } from '@/views/stores/articleStore'
import { useArtworkStore } from '@/views/stores/artworkStore'
import LazyImage from '@/components/common/LazyImage.vue'
import TypeWriter from '@/components/common/TypeWriter.vue'

// --- 资源路径 ---
const avatarUrl = '/assets/images/logo.webp' // 假设这是头像
const qrCodeUrl = '/assets/images/qrcode.svg'

// --- 状态管理 ---
const router = useRouter()
const articleStore = useArticleStore()
const artworkStore = useArtworkStore()

const isAvatarFlipped = ref(false)
const sloganText = '唔...这都被你发现啦？(*/ω＼*)'

// --- 数据获取 ---
const isLoading = computed(() => articleStore.isLoading || artworkStore.loading)

// 获取最新文章 (合并所有分类，按日期排序，取前2篇)
const latestArticles = computed<ArticleSummary[]>(() => {
  const allArticles: ArticleSummary[] = [
    ...articleStore.getArticleList('frontend'),
    ...articleStore.getArticleList('topics'),
    ...articleStore.getArticleList('novels'),
  ]

  // 简单的日期字符串比较 (假设格式为 YYYY-MM-DD)
  return allArticles.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2)
})

// 获取最新画作 (取第1幅)
const latestArtwork = computed(() => {
  if (artworkStore.artworks.length > 0) {
    // 假设 artworkStore.artworks 已经是按时间倒序或者是无序的
    // 这里简单取第一个，如果需要排序请自行添加 sort 逻辑
    return artworkStore.artworks[0]
  }
  return null
})

onMounted(async () => {
  // 并行加载数据
  await Promise.all([articleStore.fetchArticleIndex(), artworkStore.fetchArtworks()])
})

// --- 交互逻辑 ---
const toggleAvatarFlip = () => {
  isAvatarFlipped.value = !isAvatarFlipped.value
}

const navigateToArticle = (article: ArticleSummary) => {
  // 需要反查分类，或者在 ArticleSummary 中包含 category 字段
  // 这里做一个简单的遍历查找 category
  let category = 'frontend' // 默认
  if (articleStore.getArticleList('topics').find((a) => a.id === article.id)) category = 'topics'
  if (articleStore.getArticleList('novels').find((a) => a.id === article.id)) category = 'novels'

  router.push(`/articles/${category}/${article.id}`)
}

const navigateToGallery = () => {
  router.push('/gallery')
}

const navigateToFeature = (route: string) => {
  router.push(route)
}

// --- 静态配置数据 ---
const socialLinks = [
  {
    name: 'GitHub',
    icon: 'fab fa-github',
    link: 'https://github.com/futurelesswindchan',
    color: '#24292e',
  },
  {
    name: 'Bilibili',
    icon: 'fab fa-bilibili',
    link: 'https://space.bilibili.com/273245032',
    color: '#fb7299',
  },
  {
    name: 'Email',
    icon: 'fas fa-envelope',
    link: 'mailto:windchan0v0@foxmail.com',
    color: '#4285f4',
  },
]

const features = [
  {
    icon: 'fa-laptop-code',
    title: '技术手札',
    desc: '代码与Bug的爱恨情仇',
    route: '/articles/frontend',
  },
  {
    icon: 'fa-coffee',
    title: '奇怪杂谈',
    desc: '生活琐事与碎碎念',
    route: '/articles/topics',
  },
  {
    icon: 'fa-feather-alt',
    title: '幻想物语',
    desc: '中二病发作现场',
    route: '/articles/novels',
  },
  {
    icon: 'fa-palette',
    title: '绘卷长廊',
    desc: '黑历史堆放处',
    route: '/gallery',
  },
]
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
  color: var(--accent-color);
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
  border: 4px solid var(--accent-color);
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
  font-family: 'FleurDeLeah', cursive;
  font-size: 3.5rem;
  color: var(--accent-color);
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
  color: var(--accent-color);
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
    box-shadow 0.3s ease;
}

.dynamic-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
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
  opacity: 0.1;
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
  overflow: hidden;
  transition: all 0.3s ease;
}

.portal-card:hover {
  transform: translateY(-5px);
}

.portal-icon {
  font-size: 2.5rem;
  color: var(--accent-color);
  margin-bottom: 1rem;
  transition: transform 0.3s ease;
}

.portal-card:hover .portal-icon {
  transform: scale(1.1);
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
</style>
