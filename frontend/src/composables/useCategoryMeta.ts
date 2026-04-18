/**
 * @fileoverview 路由分类元数据缓存钩子 (Composable)
 * @description 用于动态读取 vue-router 中的 meta 配置，并提供状态缓存机制。
 *
 * 【核心作用】：
 * 当用户从列表页跳转到详情页时，路由发生变化，详情页的 route.meta 可能不包含 categoryKey。
 * 如果使用 computed，会导致组件在卸载/过渡的瞬间，categoryKey 跌落回默认值，
 * 从而引起文章列表数据瞬间突变，触发不必要的 DOM 重新渲染甚至报错崩溃。
 * 此钩子使用 ref 作为缓存，安全锁住离开时的最后有效状态，确保平滑过渡。
 */

import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

/**
 * 分类列表路由元数据接口
 * @interface CategoryMeta
 */
export interface CategoryMeta {
  /** 分类标识符 (如 'frontend', 'novels') */
  categoryKey: string
  /** 页面展示标题 */
  pageTitle: string
  /** 对应的详情页路由名称 */
  detailRouteName: string
  /** 页面主题 CSS 类名 */
  themeClass: string
}

/**
 * 获取并缓存当前分类的路由元数据
 *
 * @returns {{ currentMeta: import('vue').Ref<CategoryMeta> }} 包含当前分类元数据的响应式引用
 */
export function useCategoryMeta() {
  const route = useRoute()

  // 初始化默认的缓存状态
  const currentMeta = ref<CategoryMeta>({
    categoryKey: 'frontend',
    pageTitle: '文章列表',
    detailRouteName: 'FrontEndArticle',
    themeClass: 'theme-frontend',
  })

  /**
   * 监听路由 Meta 变化并更新缓存
   * @description 仅当目标路由包含 categoryKey 时才进行更新。
   * 如果跳转去了详情页，条件不成立，currentMeta 保持原样，完美护航组件卸载动画。
   */
  watchEffect(() => {
    if (route.meta.categoryKey) {
      currentMeta.value = {
        categoryKey: route.meta.categoryKey as string,
        pageTitle: route.meta.pageTitle as string,
        detailRouteName: route.meta.detailRouteName as string,
        themeClass: route.meta.themeClass as string,
      }
    }
  })

  return {
    currentMeta,
  }
}
