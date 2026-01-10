<!-- src/components/admin/LoginModal.vue -->
<template>
  <!-- width 使用 clamp 函数实现响应式 (最小300px, 90%视口宽, 最大850px) -->
  <!-- height 改为 auto，由内容撑开，避免移动端溢出 -->
  <BaseModal
    :show="modalStore.showLogin"
    width="clamp(300px, 90vw, 850px)"
    height="auto"
    @close="modalStore.closeLogin"
  >
    <div class="login-layout">
      <!-- 左侧：Visual (40%) -->
      <div class="login-visual">
        <div class="visual-content">
          <div class="visual-icon">
            <i class="fas fa-user-secret"></i>
          </div>
          <h3 class="visual-title">Authentication</h3>
          <p class="visual-desc">
            <span class="line">警告：前方是绝对领域</span>
            <span class="line">非请勿入哦 ( •̀ ω •́ )✧</span>
          </p>
        </div>
        <!-- 装饰圆 -->
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
      </div>

      <!-- 右侧：Form (60%) -->
      <div class="login-form-wrapper">
        <div class="form-header">
          <h3>Identity Check</h3>
          <span class="subtitle">请输入口令以解除封印...</span>
        </div>

        <form @submit.prevent="handleLogin">
          <div class="input-group">
            <label>执行官代号</label>
            <div class="input-box">
              <i class="fas fa-user-astronaut"></i>
              <input
                v-model="username"
                type="text"
                placeholder="Operator Name..."
                required
                :disabled="loading"
              />
            </div>
          </div>

          <div class="input-group">
            <label>灵魂密钥</label>
            <div class="input-box">
              <i class="fas fa-key"></i>
              <input
                v-model="password"
                type="password"
                placeholder="Access Key..."
                required
                :disabled="loading"
              />
            </div>
          </div>

          <!-- 错误提示 -->
          <div class="message-area">
            <transition name="fade">
              <p v-if="errorMsg" class="error-tip">
                <i class="fas fa-exclamation-triangle"></i> {{ errorMsg }}
              </p>
            </transition>
          </div>

          <button type="submit" class="login-btn" :disabled="loading">
            <span v-if="loading"><i class="fas fa-circle-notch fa-spin"></i> 同步中...</span>
            <span v-else>Link Start! <i class="fas fa-arrow-right"></i></span>
          </button>
        </form>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/views/stores/adminStore'
import { useGlobalModalStore } from '@/views/stores/globalModalStore'
import { useToast } from '@/composables/useToast'

import BaseModal from '../common/BaseModal.vue'

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const router = useRouter()
const adminStore = useAdminStore()
const modalStore = useGlobalModalStore()
const { notify } = useToast()

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''

  // 来点小延迟让别人感觉你在干事）
  await new Promise((resolve) => setTimeout(resolve, 800))

  const success = await adminStore.login(username.value, password.value)

  if (success) {
    modalStore.closeLogin()
    router.push('/dashboard') // 登录成功去仪表盘

    notify({
      message: '欢迎回来，超级无敌Master！(^・ω・^)',
      type: 'success',
    })
  } else {
    errorMsg.value = '识别失败！你不是 Master QAQ！'
  }
  loading.value = false
}
</script>

<style scoped>
.login-layout {
  display: flex;
  min-height: 520px; /* 保持桌面端高度 */
}

/* 左侧样式 */
.login-visual {
  flex: 2;
  background: linear-gradient(135deg, #0062ff 0%, #60efff 100%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  overflow: hidden;
}

.visual-content {
  position: relative;
  z-index: 2;
  text-align: center;
}

.visual-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.visual-title {
  font-family: 'FleurDeLeah', cursive;
  font-size: 2.5rem;
  margin: 0 0 0.5rem 0;
}

.visual-desc {
  font-size: 0.95rem;
  opacity: 0.9;
  line-height: 1.5;
}

.visual-desc .line {
  display: block;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.circle-1 {
  width: 150px;
  height: 150px;
  top: -30px;
  left: -30px;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  right: -30px;
}

/* 右侧表单 */
.login-form-wrapper {
  flex: 3;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8); /* 确保有背景色 */
}

.dark-theme .login-form-wrapper {
  background: rgba(30, 30, 30, 0.8);
}

.form-header {
  margin-bottom: 2rem;
}

.form-header h3 {
  font-size: 1.8rem;
  color: var(--accent-color);
  margin: 0 0 0.5rem 0;
}

.form-header .subtitle {
  color: #888;
  font-size: 0.9rem;
}

.input-group {
  margin-bottom: 1.2rem;
}

.input-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
  color: var(--text-color);
}

.input-box {
  position: relative;
  display: flex;
  align-items: center;
}

.input-box i {
  position: absolute;
  left: 0.8rem;
  color: var(--accent-color);
  opacity: 0.6;
}

.input-box input {
  width: 100%;
  padding: 0.7rem 1rem 0.7rem 2.5rem;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
  font-size: 0.95rem;
  outline: none;
  transition: all 0.3s;
  color: var(--text-color);
}

.input-box input:focus {
  border-color: var(--accent-color);
  background: white;
}

.dark-theme .input-box input {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.1);
}
.dark-theme .input-box input:focus {
  background: rgba(0, 0, 0, 0.4);
  border-color: var(--accent-color);
}

.message-area {
  min-height: 24px;
  margin-bottom: 0.5rem;
}

.error-tip {
  color: #ff4757;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.login-btn {
  width: 100%;
  padding: 0.9rem;
  border: none;
  border-radius: 8px;
  background: var(--light-text);
  color: var(--dark-text);
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-btn:hover:not(:disabled) {
  background: #0056e0;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 119, 255, 0.25);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .login-layout {
    flex-direction: column; /* 改为上下布局 */
    min-height: auto; /* 移除最小高度限制 */
  }

  /* 顶部视觉区域变矮 */
  .login-visual {
    flex: 0 0 140px; /* 固定高度 */
    padding: 1rem;
  }

  .visual-icon {
    margin: 1rem 0 0 0;
  }

  .visual-title {
    margin-bottom: 0;
  }

  .visual-desc {
    display: none; /* 移动端隐藏描述文字，节省空间 */
  }

  /* 表单区域适配 */
  .login-form-wrapper {
    flex: 1;
    padding: 1.5rem 1.5rem 2rem 1.5rem; /* 减小内边距 */
  }

  .form-header {
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .form-header h3 {
    font-size: 1.5rem;
  }
}
</style>
