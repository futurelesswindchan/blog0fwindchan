/* 处理 Vue 单文件组件类型 */

/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

/* 处理字体图标库类型 */
declare module '@fortawesome/vue-fontawesome' {
  import type { DefineComponent } from 'vue'
  export const FontAwesomeIcon: DefineComponent<{
    icon: string | string[]
    size?: string
    rotation?: number
    flip?: 'horizontal' | 'vertical' | 'both'
    spin?: boolean
    pulse?: boolean
    border?: boolean
    fixedWidth?: boolean
  }>
}

/* 处理 CSS 模块类型 */
declare module '*.module.css' {
  const classes: { readonly [key: string]: string }
  export default classes
}
