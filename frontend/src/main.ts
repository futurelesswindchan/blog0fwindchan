import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

// 确保样式引入顺序正确
import '@/styles/theme/theme.css'
import '@/styles/theme/customColor.css'
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
  faSun,
  faMoon,
} from '@fortawesome/free-solid-svg-icons'

library.add(faBookOpen, faUsers, faCode, faImages, faPaw, faCog, faHome, faPenNib, faSun, faMoon)

/**
 * 此时入口开始初始化。
 * 在 Vue 相关大体积包解析就绪后，执行组件树渲染与挂载。
 */
const app = createApp(App)

// 注入状态管理与路由模块
app.use(createPinia())
app.use(router)

// 全局组件注册
app.component('font-awesome-icon', FontAwesomeIcon)

/**
 * 等待上一帧的同步任务结束，在浏览器渲染周期间隙接入 Vue 的挂载任务。
 * 并同时负责开屏原生态 Loading 动画的平滑淡出交接。
 *
 * 选用 requestAnimationFrame 而非直接 mount 是为了防止阻塞 UI 线程主屏绘制。
 */
requestAnimationFrame(() => {
  app.mount('#app')

  // Vue 的渐入过渡效果信号，避免应用闪现
  setTimeout(() => {
    document.getElementById('app')?.classList.add('ready')
  }, 0)

  // 获取注入在 index.html 中的原生动画骨架节点并执行销毁
  const splash = document.getElementById('feng-splash')
  if (splash) {
    // 延迟 50ms 确保 Vue 构建的真实 DOM 已推入渲染层后再隐去骨架，避免首屏瞬间白屏闪烁
    setTimeout(() => {
      splash.classList.add('fade-out')
      // 动画持续时间 800ms，在 850ms 销毁节点避免单页应用内存与 DOM 树冗余
      setTimeout(() => {
        splash.remove()
      }, 850)
    }, 50)
  }
})
