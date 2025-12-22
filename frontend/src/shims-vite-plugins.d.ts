// src/shims-vite-plugins.d.ts
declare module 'vite-plugin-vue-devtools' {
  import { Plugin } from 'vite'
  export interface DevToolsPluginOptions {
    launchEditor?: string
  }
  export default function devToolsPlugin(options?: DevToolsPluginOptions): Plugin
}
