import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  base: '/',
  // 添加开发服务器配置
  server: {
    proxy: {
      // 只要请求路径是以 /api 开头
      '/api': {
        target: 'http://127.0.0.1:5000', // 转发给 Flask 后端
        changeOrigin: true, // 允许跨域
        // 如果 Flask 路由本身就包含 /api (比如 @app.route('/api/articles'))，
        // 那么就不需要 rewrite。如果后端是 @app.route('/articles')，这里就需要 rewrite 去掉 /api
        // 根据仓库中的的 app.py，路由已经是 /api/xxx 了，所以这里不需要 rewrite
      },
      '/static': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
