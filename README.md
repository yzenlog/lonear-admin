# Lonear Admin

一个基于 React、Vite 和 TypeScript 的开源后台管理系统脚手架，内置管理端布局、路由守卫、基础 UI 组件、PWA manifest 和 service worker。

## Project Structure

```text
src/
  api/            按业务域组织的接口模块
  components/
    ui/             基础 UI 组件，目录使用 lon-xxx，组件名使用 LonXxx
    shared/         多页面复用组件，每个组件一个文件夹，组件名至少两个单词
  config/           模块注册、路由路径、导航和应用常量
  layouts/          后台主布局框架
  mocks/            本地演示数据
  pages/
    auth/           登录等认证页面
    dashboard/      工作台页面
    system/         系统管理页面，每个菜单一个 TSX
    content/        内容运营页面，每个菜单一个 TSX
    message/        消息中心页面，每个菜单一个 TSX
    audit/          审计页面
    showcase/       演示台页面
  routes/           路由守卫、路由注册和页面映射
  services/         会话、请求、存储等应用服务
  styles/           全局样式与设计 tokens
  utils/            与框架无关的通用工具
```

新增业务页时，优先在 `src/pages/<domain>` 添加独立页面组件，再在 `src/config/modules.ts` 注册模块元信息、菜单与路由，并在 `src/routes/adminPages.tsx` 建立 `ModuleId -> Page` 映射；应用入口 `src/App.tsx` 只保留顶层装配。

## Scripts

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
```

PWA 的 service worker 只在生产构建中注册，使用 `pnpm build && pnpm preview` 可以验证安装和离线缓存能力。

## Mock API

开发环境可通过 `VITE_USE_MOCK=true` 启用 fetch 请求拦截。页面仍然调用 `src/api` 中的业务接口，匹配到的请求会由 `src/mocks` 返回本地数据。
