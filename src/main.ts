import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

// 确保样式引入顺序正确
import '@/styles/theme.css'
import '@/styles/customColor.css'
import '@fortawesome/fontawesome-free/css/all.css'
import 'highlight.js/styles/base16/tomorrow-night.css'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faBookOpen,
  faUsers,
  faCode,
  faImages,
  faPaw,
  faCog,
  faHome,
  faPenNib,
} from '@fortawesome/free-solid-svg-icons'

library.add(faBookOpen, faUsers, faCode, faImages, faPaw, faCog, faHome, faPenNib)
// 创建Vue应用
const app = createApp(App)

// 配置Pinia
app.use(createPinia())

// 配置路由
app.use(router)

// 优化初始化渲染
requestAnimationFrame(() => {
  app.mount('#app')
  // 添加ready类名以触发过渡动画
  setTimeout(() => {
    document.getElementById('app')?.classList.add('ready')
  }, 0)
})

// 全局组件注册
app.component('font-awesome-icon', FontAwesomeIcon)
