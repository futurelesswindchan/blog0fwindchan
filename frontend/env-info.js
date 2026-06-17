// env-info.js
// 执行此脚本以收集项目环境信息，帮助诊断测试相关问题
import os from 'os'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

function getPkgVersion(pkgName) {
  try {
    const pkgJsonPath = path.resolve('node_modules', pkgName, 'package.json')
    if (fs.existsSync(pkgJsonPath)) {
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
      return pkgJson.version || 'Not found'
    }
    return 'Not found'
  } catch {
    return 'Error reading'
  }
}

function getPackageJsonDeps() {
  try {
    const pkgFile = path.resolve('package.json')
    if (fs.existsSync(pkgFile)) {
      const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'))
      return {
        vue: pkg.dependencies?.vue || pkg.devDependencies?.vue || 'Not specified',
        vitest: pkg.devDependencies?.vitest || pkg.dependencies?.vitest || 'Not specified',
        vueTestUtils:
          pkg.devDependencies?.['@vue/test-utils'] ||
          pkg.dependencies?.['@vue/test-utils'] ||
          'Not specified',
      }
    }
  } catch {
    return {}
  }
  return {}
}

console.log('=== 项目环境信息收集报告 ===\n')

// 1. 操作系统
console.log(`操作系统: ${os.type()} ${os.release()} (${os.platform()} - ${os.arch()})`)

// 2. Node 版本
console.log(`Node 版本: ${process.version}`)

// 3. npm 版本
try {
  const npmVersion = execSync('npm -v').toString().trim()
  console.log(`npm 版本: ${npmVersion}`)
} catch {
  console.log('npm 版本: 未能检测到')
}

// 4. package.json 中的依赖版本
const deps = getPackageJsonDeps()
console.log(`Vue 版本: ${deps.vue}`)
console.log(`Vitest 版本: ${deps.vitest}`)
console.log(`@vue/test-utils 版本: ${deps.vueTestUtils}`)

// 5. node_modules 里实际安装的版本
console.log('\n实装依赖版本:')
console.log(`vue: ${getPkgVersion('vue')}`)
console.log(`vitest: ${getPkgVersion('vitest')}`)
console.log(`@vue/test-utils: ${getPkgVersion('@vue/test-utils')}`)

// 6. 运行环境说明
console.log('\n运行环境:')
console.log('测试运行环境为 jsdom（Vitest 默认使用），非真实浏览器环境。\n')

console.log('=== 环境信息收集完毕 ===')
