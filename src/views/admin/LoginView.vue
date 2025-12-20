<!-- src\views\admin\LoginView.vue -->
<template>
  <div class="login-view-container">
    <h2 class="page-title">Athuntication</h2>

    <hr />

    <form class="login-form" @submit.prevent="handleLogin">
      <h1>芝麻开门</h1>
      <p class="form-subtitle">只有被选召的孩子才能进入这里哦~</p>

      <div class="form-group">
        <label>用户名：</label>
        <input
          v-model="username"
          type="text"
          placeholder="请输入用户名..."
          class="login-input"
          required
        />
      </div>

      <div class="form-group">
        <label>密码：</label>
        <input
          v-model="password"
          type="password"
          placeholder="请输入神秘代码..."
          class="login-input"
          required
        />
      </div>

      <p v-if="errorMsg" class="error-tip">{{ errorMsg }}</p>
    </form>

    <hr />

    <div class="btn-row">
      <button type="submit" class="login-btn" :disabled="loading" @click="handleLogin">
        {{ loading ? '验证中...' : '登入' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdminStore } from '@/views/stores/adminStore'

import '@/styles/pageTitle.css'

const username = ref('') // ✨ 新增
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const router = useRouter()
const route = useRoute()
const adminStore = useAdminStore()

// 异步处理登录逻辑
const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''

  // ✨ 修改：现在需要传入 username 和 password
  const success = await adminStore.login(username.value, password.value)

  if (success) {
    // 登录成功，跳回原来想去的页面，或者默认去仪表盘
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } else {
    errorMsg.value = '口令或用户名错误！你不是这里的主人QAQ！🚫'
  }
  loading.value = false
}
</script>

<style scoped>
.login-form {
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border: none;
  max-width: 700px;
  margin: 2rem auto;
  padding: 2rem 1.5rem;
  background: rgba(255, 255, 255, 0.75);
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 119, 255, 0.06);
  box-sizing: border-box;
}

.dark-theme .login-form {
  background: rgba(0, 0, 0, 0.75);
}

.login-form h1 {
  color: var(--accent-color);
  margin-bottom: 0.3rem;
  letter-spacing: 2px;
  font-weight: 600;
  text-shadow: 0 1px 0 rgba(0, 119, 255, 0.08);
}

.form-subtitle {
  color: #002457;
  font-size: 0.95rem;
  margin-bottom: 1.2rem;
  line-height: 1.6;
  font-family: 'Aa偷吃可爱长大的', sans-serif;
}

.dark-theme .form-subtitle {
  color: #b3d8ff;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: var(--accent-color);
  font-size: 1.08rem;
  letter-spacing: 1px;
}

.login-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--aero-border-color);
  background: rgba(255, 255, 255, 0.7);
  color: black;
  font-size: 1rem;
  transition:
    border 0.2s,
    background 0.2s;
  outline: none;
  box-sizing: border-box;
}

.dark-theme .login-input {
  background: rgba(0, 0, 0, 0.3);
  color: white;
}

.login-input:focus {
  background: rgba(0, 145, 255, 0.594);
  border-color: rgba(0, 119, 255, 0.85);
}

.dark-theme .login-input:focus {
  background: rgba(0, 51, 255, 0.3);
}

.error-tip {
  color: #ff6b6b;
  font-size: 0.95rem;
  margin-top: 0.8rem;
  margin-left: 0.5rem;
  line-height: 1.6;
  background: rgba(255, 107, 107, 0.15);
  border-left: 3px solid #ff6b6b;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-family: 'Aa偷吃可爱长大的', sans-serif;
}

.dark-theme .error-tip {
  background: rgba(255, 107, 107, 0.2);
}

.btn-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.2rem;
  margin: 2rem 0 0 0;
}

.login-btn {
  margin: 0 0 1.5rem 0;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.3);
  color: var(--accent-color);
  font-weight: 600;
  font-size: 1.05rem;
  letter-spacing: 1px;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 119, 255, 0.2);
  transition: all 0.3s var(--aero-animation);
  min-width: 140px;
}

.login-btn:hover:not(:disabled) {
  color: white;
  background: rgb(0, 119, 255);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 119, 255, 0.3);
}

.login-btn:active:not(:disabled) {
  transform: scale(0.98);
  opacity: 0.85;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dark-theme .login-btn {
  background: rgba(0, 0, 0, 0.3);
  color: #90caf9;
}

.dark-theme .login-btn:hover:not(:disabled) {
  background: rgb(0, 119, 255);
  color: white;
}
</style>
