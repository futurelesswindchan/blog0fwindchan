<!-- HomeView.vue -->
<template>
  <div class="home-view-container">
    <!-- 添加根元素 -->
    <section class="home-view">
      <h2 class="welcome-title">欢迎 ~\(≧▽≦)/~ 欢迎</h2>

      <!-- 新增个人明信片 -->
      <div class="vcard-container">
        <div class="vcard">
          <div class="vcard-content">
            <a href="#" class="vcard-title"> Ff's Blog </a>
            <h2 class="vcard-contact">
              唔~这都被你发现啦awa...<br />本网站还在更新中哦0v0！&emsp;上次更新在2025/06/29
            </h2>
            <span class="vcard-desc">
              恭喜你发现了传说中的OAO...？！！<br />风酱的网站qwq...?!<br /><br />
              虽然很喜欢咕咕...（小声）<br />不过迟早有一天会更新的！ヾ(•ω•`)
              <br />同时欢迎通过下方联系方式与我交流互动~(≧▽≦)/
            </span>
          </div>

          <div class="vcard-cylinders">
            <div v-for="i in 4" :key="i" class="cylinder" :style="cylinderStyle(i)"></div>
            <div class="special-cylinder"></div>
          </div>

          <!-- 使用LazyImage组件替换原有img标签 -->
          <LazyImage
            :src="qrCode"
            alt="qwq?"
            className="vcard-qrcode"
            :containerStyle="{
              width: '275px',
              height: '275px',
              position: 'absolute',
              margin: '60px 45px 45px 50px',
              opacity: 0,
              transition: 'opacity 1s linear',
            }"
          />
        </div>
      </div>

      <!-- 在 vcard-container 后面添加新的移动端明信片 -->
      <div class="mobile-vcard">
        <div class="mobile-vcard__content">
          <div class="mobile-vcard__text">
            <a href="#" class="vcard-title mobile-vcard-title">Ff's Blog</a>
            <h4 class="mobile-vcard-contact">
              <div class="mobile-vcard__qrcode">
                <LazyImage
                  :src="qrCode"
                  alt="qwq?"
                  className="mobile-qrcode"
                  :containerStyle="{
                    width: '200px',
                    height: '200px',
                    borderRadius: '12px',
                    border: '3px solid var(--accent-color)',
                  }"
                />
              </div>
              <span
                ><br />传说中的风风博客qwq?! <br />正在更新中（很慢QAQ） <br />但是...一定会的~！
              </span>
            </h4>
          </div>
        </div>
      </div>

      <!-- 新增平板端明信片 -->
      <div class="tablet-vcard">
        <div class="tablet-vcard__content">
          <div class="tablet-vcard__qrcode">
            <LazyImage
              :src="qrCode"
              alt="qwq?"
              className="tablet-qrcode"
              :containerStyle="{
                width: '180px',
                height: '180px',
                borderRadius: '12px',
                border: '3px solid var(--accent-color)',
              }"
            />
          </div>
          <div class="tablet-vcard__text">
            <a href="#" class="vcard-title tablet-vcard-title">Ff's Blog</a>
            <h4 class="tablet-vcard-contact">
              <br />恭喜你发现了传说中的OAO...？！！ <br />风风博客qwq...?!
              <br />虽然大家都喜欢咕咕咕...（小声） <br />不过迟早有一天会更新的！ヾ(•ω•`)
            </h4>
            <p class="tablet-vcard-desc">欢迎通过下方联系方式与我交流互动~(≧▽≦)/</p>
          </div>
        </div>
      </div>

      <h3 class="welcome-title welcome-title-tiny">---这里有着...(*/ω＼*)---</h3>

      <div class="feature-grid">
        <div
          v-for="item in features"
          :key="item.title"
          class="feature-card glass-container"
          @click="navigateToFeature(item.route)"
        >
          <LazyImage
            :src="item.bgImage"
            :alt="item.title"
            className="feature-bg"
            :containerStyle="{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 0,
            }"
          />
          <div class="feature-content">
            <div class="feature-icon">
              <i :class="['fas', item.icon]"></i>
            </div>
            <div class="feature-text">
              <h3>{{ item.title }}</h3>
              <p>{{ item.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="contact-section">
        <h3 class="contact-section__title">联系方式喵ヽ(￣ω￣〃)ゝ</h3>
        <div class="contact-section__grid">
          <a
            v-for="contact in contacts"
            :key="contact.name"
            :href="contact.link"
            target="_blank"
            class="contact-section__card"
            :style="{ background: contact.color }"
          >
            <i class="contact-section__icon" :class="[contact.icon]"></i>
            <span class="contact-section__text">{{ contact.name }}</span>
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import LazyImage from '@/components/common/LazyImage.vue'

// 修改图片导入
const qrCode = '/assets/images/qrcode.svg'
const cardBg1 = '/assets/images/card-bg1.jpg'
const cardBg2 = '/assets/images/card-bg2.jpg'
const cardBg3 = '/assets/images/card-bg3.jpg'
const cardBg4 = '/assets/images/card-bg4.jpg'

import { useRouter } from 'vue-router'

// 圆柱样式生成器
const cylinderStyle = (i: number) => ({
  '--i': i,
  '--w': [1.5, 1.6, 1.4, 1.7][i - 1],
})

const router = useRouter()

// 添加导航函数
const navigateToFeature = (route: string) => {
  router.push(route)
}

const features = [
  {
    icon: 'fa-laptop-code',
    title: '技术手札',
    desc: '前端开发笔记与心得',
    bgImage: cardBg4,
    route: '/articles/frontend',
  },
  {
    icon: 'fa-user',
    title: '奇怪杂谈',
    desc: '关于生活与兴趣的随笔',
    bgImage: cardBg1,
    route: '/articles/topics',
  },
  {
    icon: 'fa-feather',
    title: '幻想物语',
    desc: '轻小说风格故事连载',
    bgImage: cardBg3,
    route: '/articles/novels',
  },
  {
    icon: 'fa-palette',
    title: '绘卷长廊',
    desc: '插画与设计作品展示',
    bgImage: cardBg2,
    route: '/gallery',
  },
]

const contacts = [
  {
    name: 'GitHub',
    icon: 'fab fa-github',
    link: 'https://github.com/futurelesswindchan',
    color: 'rgba(36, 41, 46, 0.2)', // GitHub的深灰色
  },
  {
    name: 'Bilibili',
    icon: 'fab fa-bilibili',
    link: 'https://space.bilibili.com/273245032?spm_id_from=333.1007.0.0',
    color: 'rgba(251, 114, 153, 0.2)', // B站粉色
  },
  {
    name: 'Email',
    icon: 'fas fa-envelope',
    link: 'mailto:windchan0v0@foxmail.com',
    color: 'rgba(66, 133, 244, 0.2)', // 邮件蓝色
  },
]
</script>

<style scoped>
.home-view-container {
  width: 100%;
  min-height: inherit;
}

/* 标题样式调整 */
.welcome-title {
  text-align: center;
  color: var(--accent-color);
  margin-bottom: 2rem;
  background-color: rgba(255, 255, 255, 0.1);
  line-height: 350%;
}

.dark-theme .welcome-title {
  background-color: rgba(0, 0, 0, 0.1);
}

/* 移动端标题样式 */
@media (max-width: 767px) {
  .welcome-title,
  .welcome-title-tiny {
    margin: 0.5rem 10px; /* 统一移动端间距 */
    padding: 0.8rem;
    line-height: 1.6;
  }
}

/* 桌面端明信片控制 */
.vcard-container {
  display: none; /* 默认隐藏 */
}

@media (min-width: 1101px) {
  .vcard-container {
    display: flex; /* 仅在桌面端显示 */
    justify-content: center;
    margin: 2rem 0;
  }
}

/* 明信片基础样式调整 */
.vcard {
  position: relative;
  width: 900px;
  height: 400px;
  border: 10px solid rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.8); /* 白底 */
  color: #222; /* 黑字 */
  border-radius: 20px;
  overflow: hidden;
  backdrop-filter: blur(5px);
  transition: transform 0.3s;
}

.vcard:hover {
  transform: translateY(-5px);
}

/* 文字内容区 */

.vcard-title {
  transition: 0.4s;
  text-decoration: none;
  color: var(--accent-color);
  font-size: 5rem;
  font-family: 'FleurDeLeah', sans-serif;
  line-height: 1;
  letter-spacing: 5px;
}

.vcard-content {
  position: absolute;
  width: 500px;
  margin-left: 2em;
  margin: 75px 50px;
  transition: 1s;
  z-index: 1;
}

.vcard-contact {
  transition: 0.4s;
  opacity: 0;
  color: #1ed2c8;
  font-size: 1rem;
  margin: 1rem 0 0 2em;
}

.vcard-desc {
  transition: 0.4s;
  color: #444;
  margin-left: 2em;
  font: 500 15px sans-serif;
  position: absolute;
  top: 100px;
  line-height: 1.6;
}

/* 深色主题下的桌面端明信片 */
.dark-theme .vcard {
  border: 10px solid rgba(0, 0, 0, 0.4);
  background: rgba(0, 0, 0, 0.85); /* 黑底 */
  color: #fff; /* 白字 */
}

.dark-theme .vcard-title {
  color: var(--accent-color);
}

.dark-theme .vcard-contact {
  color: #1ed2c8;
}

.dark-theme .vcard-desc {
  color: rgba(255, 255, 255, 0.85);
}

/* 圆柱动画效果 */
.vcard-cylinders {
  position: absolute;
  top: -130px;
  right: -240px;
}

.cylinder {
  position: absolute;
  right: calc(var(--i) * 100px);
  width: calc(var(--w) * 40px);
  height: 500px;
  border-radius: 100px;
  transform: rotateZ(220deg) translate(0, 0);
  background: rgba(240, 220, 150, 0.8);
  transition: 0.5s calc(var(--i) * 0.1s);
}

.cylinder:nth-child(2) {
  background: rgba(240, 190, 230, 0.8);
}

/* 二维码样式 */
.vcard-qrcode {
  width: 275px;
  height: 275px;
  position: absolute;
  margin: 60px 45px 45px 50px;
  opacity: 0;
  transition: opacity 2s linear; /* 改为线性动画保证同步 */
}

/* 悬停动画 */
.vcard:hover .vcard-content {
  left: 370px;
  transition: left 1s 0.1s cubic-bezier(0.4, 0, 0.2, 1); /* 明确指定过渡属性 */
}

.vcard:hover .vcard-desc {
  top: 155px;
  transition: 1s 0.5s;
}

.vcard:hover .vcard-contact {
  will-change: left;
  opacity: 1;
  transition: 1s 0.5s;
}

/* 圆柱动画效果 */
.vcard:hover .cylinder {
  transform: rotateZ(220deg) translate(-200px, 400px);
}

.vcard:hover .vcard-qrcode {
  will-change: opacity;
  opacity: 1;
}

/* 修改二维码悬停动画样式 */
.vcard:hover :deep(.lazy-image-container) {
  opacity: 1 !important;
}

/* 调整动画时间关系 */
.vcard:not(:hover) .vcard-content {
  left: 0;
  transition: left 1s 0s cubic-bezier(0.4, 0, 0.2, 1); /* 移出时立即执行 */
}

.vcard:not(:hover) .vcard-qrcode {
  opacity: 0;
  transition: opacity 0.5s 0s linear; /* 同步开始消失 */
}

/* 移动端明信片样式优化 */
.mobile-vcard {
  display: none; /* 默认隐藏 */
}

@media (max-width: 1100px) {
  .mobile-vcard {
    display: block; /* 在平板和手机端显示 */
  }
}

/* 平板端明信片默认隐藏 */
.tablet-vcard {
  display: none;
}

/* 优化平板端布局 */
@media (min-width: 769px) and (max-width: 1100px) {
  .mobile-vcard {
    max-width: 800px;
    margin: 1.5rem auto;
    padding: 1.5rem;
  }
  .mobile-vcard__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.2rem;
    position: relative;
  }
  .mobile-vcard__qrcode {
    position: static;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 1rem;
  }
  .mobile-vcard__text {
    width: 100%;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
  .mobile-vcard-title {
    font-size: 2.2rem;
    color: var(--accent-color);
    font-family: 'FleurDeLeah', sans-serif;
    text-decoration: none;
    margin-bottom: 0.5rem;
  }
  .mobile-vcard-contact {
    text-align: center;
    position: static;
    left: unset;
    font-size: 1rem;
    color: #1ed2c8;
    margin: 0.5rem 0;
    line-height: 1.6;
  }
}

/* 平板端专属样式 */
@media (min-width: 769px) and (max-width: 1100px) {
  .tablet-vcard {
    display: flex;
    justify-content: center;
    margin: 2rem 0;
  }
  .tablet-vcard__content {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.92);
    border-radius: 18px;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
    padding: 2rem 2.5rem;
    gap: 2.5rem;
    max-width: 700px;
    width: 100%;
    position: relative;
  }
  .tablet-vcard__qrcode {
    flex: 0 0 180px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .tablet-vcard__text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    min-width: 0;
  }
  .tablet-vcard-title {
    transition: 0.4s;
    font-size: 5rem;
    color: var(--accent-color);
    font-family: 'FleurDeLeah', sans-serif;
    text-decoration: none;
  }
  .tablet-vcard-contact {
    transition: 0.4s;
    font-size: 1.1rem;
    margin: 0;
    line-height: 1.6;
    margin-left: 2em;
  }
  .tablet-vcard-desc {
    transition: 0.4s;
    font-size: 1rem;
    margin-left: 2em;
  }
  /* 深色主题适配 */
  .dark-theme .tablet-vcard__content {
    background: rgba(0, 0, 0, 0.7);
  }
  .dark-theme .tablet-vcard-title {
    color: var(--accent-color);
  }
  .dark-theme .tablet-vcard-contact,
  .dark-theme .tablet-vcard-desc {
    color: rgba(255, 255, 255, 0.85);
  }
}

/* 只在平板端显示 tablet-vcard，隐藏桌面和移动端明信片 */
@media (min-width: 769px) and (max-width: 1100px) {
  .vcard-container,
  .mobile-vcard {
    display: none !important;
  }
}

.feature-grid {
  display: grid;
  gap: 20px;
  padding: 0 15px;
  margin: 2rem 0;
}

/* 手机端：单列左右布局 */
@media (max-width: 768px) {
  .feature-grid {
    grid-template-columns: 1fr;
    padding: 0 10px;
    gap: 15px;
  }

  .feature-card {
    aspect-ratio: 5/2;
    padding: 0;
  }

  .feature-content {
    padding: 0.6rem 1rem;
  }

  .feature-icon {
    font-size: 2.2rem;
    width: 3rem;
    height: 3rem;
  }

  .feature-text {
    gap: 0.2rem;
    padding-right: 0.5rem;
  }
}

/* 平板设备：两列布局 */
@media (min-width: 769px) and (max-width: 1110px) {
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
    padding: 0 15px;
    gap: 20px;
  }

  .feature-card {
    aspect-ratio: 5/2;
    padding: 0;
  }

  .feature-content {
    flex-direction: row;
    align-items: center;
    padding: 0.8rem 1.2rem;
    gap: 1rem;
  }

  .feature-icon {
    font-size: 2.4rem;
    width: 3.2rem;
    height: 3.2rem;
    margin-bottom: 0;
  }

  .feature-text {
    text-align: left;
    gap: 0.3rem;
  }

  .feature-text h3 {
    font-size: 1.15rem;
  }

  .feature-text p {
    font-size: 0.9rem;
    line-height: 1.4;
  }
}

/* 桌面端：四列布局 */
@media (min-width: 1111px) {
  .feature-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 30px;
    padding: 0 20px;
  }

  .feature-content {
    flex-direction: column;
    text-align: center;
    padding: 1rem;
  }

  .feature-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .feature-text h3 {
    font-size: 1.2rem;
  }
}

/* 修改特性卡片样式 */
.feature-card {
  position: relative;
  padding: 1.5rem;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s var(--aero-animation);
  aspect-ratio: 16/9;
  display: flex;
  align-items: center;
  will-change: transform;
  -webkit-tap-highlight-color: transparent;
}

.feature-content {
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 0.8rem;
}

.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: var(--accent-color);
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.feature-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.feature-text h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--accent-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.feature-text p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  white-space: normal;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .feature-grid {
    grid-template-columns: 1fr;
    padding: 0 10px;
    gap: 15px;
  }

  .feature-card {
    aspect-ratio: 5/2;
    padding: 0;
  }

  .feature-content {
    padding: 0.6rem 1rem;
  }

  .feature-icon {
    font-size: 2.2rem;
    width: 3rem;
    height: 3rem;
  }

  .feature-text {
    gap: 0.2rem;
    padding-right: 0.5rem;
  }

  .feature-text h3 {
    font-size: 1.1rem;
  }

  .feature-text p {
    font-size: 0.85rem;
    line-height: 1.3;
  }
}

/* 平板竖屏：2列 */
@media (min-width: 769px) and (max-width: 1199px) {
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 25px;
  }
}

/* 大桌面：4列 */
@media (min-width: 1200px) {
  .feature-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 30px;
  }

  .feature-content {
    flex-direction: column;
    text-align: center;
  }

  .feature-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }
}

/* 深色主题样式 */
:deep(.dark-theme) .feature-card {
  background: rgba(0, 0, 0, 0.3);
}

/* 确保背景图默认完全透明 */
.feature-card :deep(.feature-bg) {
  opacity: 0 !important; /* 桌面端默认隐藏 */
  transition: opacity 0.3s ease;
}

/* 桌面端悬停时显示背景图 */
@media (min-width: 1111px) {
  .feature-card:hover :deep(.feature-bg) {
    opacity: 0.7 !important;
  }
}

/* 移动端和平板端默认显示背景图 */
@media (max-width: 1110px) {
  .feature-card :deep(.feature-bg) {
    opacity: 0.5 !important;
  }
}

/* 深色主题下的特性卡片基础样式 */
.dark-theme .feature-card {
  background: rgba(0, 0, 0, 0.3);
}

/* 内容始终保持在最上层 */
.feature-content {
  position: relative;
  z-index: 1;
  width: 100%;
  text-align: center;
  padding: 1rem;
  border-radius: 8px;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100%; /* 确保填满父容器 */
  padding: 12px;
  position: relative;
  z-index: 1;
}

/* 标题样式 */
h3 {
  font-size: 1.2em;
  margin: 12px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 描述文本样式 */
p {
  font-size: 0.9em;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.icon {
  font-size: 2.5em;
  margin-bottom: 1rem;
  color: var(--accent-color);
  transition: transform 0.3s;
}

/* Contact section styles */
.contact-section {
  margin: 40px 0;
  padding: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
}

.contact-section__title {
  font-size: 1.2rem;
  margin: 0;
  color: inherit;
}

.contact-section__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.contact-section__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  transition: all 0.3s var(--aero-animation);
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.contact-section__card:hover {
  transform: translateY(-3px);
  filter: brightness(1.1) saturate(1.2);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.contact-section__icon {
  font-size: 2.5em;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.contact-section__text {
  font-size: 1rem;
  text-align: center;
}

/* 图标特定颜色 */
.contact-section__card:hover .fa-github {
  color: #24292e;
}

.contact-section__card:hover .fa-bilibili {
  color: #fb7299;
}

.contact-section__card:hover .fa-envelope {
  color: #4285f4;
}

/* 深色主题适配 */
.dark-theme .contact-section {
  background: rgba(0, 0, 0, 0.3);
}

.dark-theme .contact-section__title {
  color: rgba(255, 255, 255, 0.9);
}

.dark-theme .contact-section__card {
  background: rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.9);
}

.dark-theme .contact-section__card:hover {
  background: rgba(0, 0, 0, 0.4);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

/* 移动端适配 */
@media (max-width: 800px) {
  .contact-section {
    margin: 20px 10px;
    padding: 1.5rem;
  }

  .contact-section__title {
    font-size: 1.1rem;
  }

  .contact-section__grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
  }

  .contact-section__card {
    padding: 15px 10px;
  }

  .contact-section__icon {
    font-size: 2rem;
    margin-bottom: 8px;
  }

  .contact-section__text {
    font-size: 0.9rem;
  }
}

/* 优化移动端点击效果 */
@media (hover: none) {
  .feature-card:active {
    transform: scale(0.98);
  }

  .contact-section__card:active {
    transform: scale(0.95);
    opacity: 0.8;
  }
}

/* 移动端明信片样式 */
.mobile-vcard {
  margin: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.mobile-vcard-title {
  font-size: 4em;
  letter-spacing: 3px;
  transition: 0.4s;
}

.mobile-vcard__qrcode {
  position: static;
  display: flex;
  float: left;
  justify-content: center;
  align-items: center;
  margin: 1rem 0 0 8%;
}

.mobile-vcard-contact span {
  text-align: left;
  position: static;
  font-size: 1rem;
  margin: 0.5rem 0;
  line-height: 1.6;
}

/* 深色主题适配 */
.dark-theme .mobile-vcard {
  background: rgba(0, 0, 0, 0.7);
}

.dark-theme .mobile-vcard__text h3 {
  color: var(--accent-color);
}

.dark-theme .mobile-vcard__text h4 {
  color: rgba(255, 255, 255, 0.8);
}

.dark-theme .mobile-vcard__text p {
  color: rgba(255, 255, 255, 0.9);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .mobile-vcard {
    margin: 0.8rem;
    padding: 1rem;
  }
  .mobile-vcard__content {
    flex-direction: column;
    gap: 1rem;
  }
  .mobile-vcard__qrcode :deep(.lazy-image-container) {
    width: 100px !important;
    height: 100px !important;
  }
  .mobile-vcard__text {
    text-align: center;
  }
  .mobile-vcard__text h3 {
    font-size: 1.1rem;
  }
  .mobile-vcard__text h4 {
    font-size: 0.95rem;
  }
  .mobile-vcard__text p {
    font-size: 0.85rem;
  }
}

/* 平板适配 */
@media (min-width: 769px) and (max-width: 1100px) {
  .mobile-vcard {
    max-width: 800px;
    margin: 1.5rem auto;
  }
  .mobile-vcard__qrcode :deep(.lazy-image-container) {
    width: 150px !important;
    height: 150px !important;
  }
}
</style>
