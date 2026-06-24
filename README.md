# Lonear Admin

Lonear Admin 是一个基于 React、Vite 和 TypeScript 构建的开源后台管理系统模板。项目内置登录页、后台主布局、路由守卫、菜单导航、管理类页面、基础 UI 组件、本地 Mock API 和 PWA 支持，适合用作中后台系统、内容管理平台、运营后台或企业管理端的前端起点。

## 在线演示

演示地址：[http://8.138.186.154](http://8.138.186.154)

默认演示账号：

```text
邮箱：admin@acme.local
密码：admin123
```

当前演示环境使用前端本地 Mock 数据，登录、菜单、角色、系统管理等请求会在浏览器端拦截并返回模拟数据，无需连接真实后端服务。

## 项目特性

- 基于 React 18、React Router、Vite 和 TypeScript。
- 内置管理员登录页、登录状态持久化和基础路由守卫。
- 提供工作台、系统管理、内容运营、消息中心、审计中心、开发辅助等常见后台模块。
- 内置角色、菜单、权限、组织、字典、文章、Banner、文件、通知、站内信等示例页面。
- 自研轻量 UI 组件，包含按钮、输入框、选择器、日期选择器、弹窗、抽屉、通知、标签、上传等。
- 支持浅色 / 深色主题、强调色切换、页签样式切换和主内容区布局配置。
- 使用本地 Mock API 演示完整交互流程，便于静态部署和快速预览。
- 包含 Web App Manifest 和 Service Worker，可作为 PWA 基础模板继续扩展。

## 技术栈

```text
React 18
TypeScript
Vite
React Router
Lucide React
CSS Modules / 原生 CSS
Local Mock API
PWA Manifest + Service Worker
```

## 快速开始

安装依赖：

```bash
pnpm install
```

启动开发环境：

```bash
pnpm dev
```

生产构建：

```bash
pnpm build
```

本地预览生产构建：

```bash
pnpm preview
```

类型检查：

```bash
pnpm typecheck
```

## 目录结构

```text
src/
  api/            按业务域组织的接口模块
  components/
    ui/           基础 UI 组件，目录使用 lon-xxx，组件名使用 LonXxx
    shared/       多页面复用组件
  config/         模块注册、路由路径、导航和应用常量
  layouts/        后台主布局框架
  mocks/          本地 Mock 数据和请求拦截器
  pages/
    auth/         登录等认证页面
    dashboard/    工作台页面
    system/       系统管理页面
    content/      内容运营页面
    message/      消息中心页面
    audit/        审计页面
    development/  开发辅助页面
    showcase/     组件演示页面
  routes/         路由守卫、路由注册和页面映射
  services/       会话、请求、存储等应用服务
  styles/         全局样式与设计 tokens
  utils/          与框架无关的通用工具
```

新增业务页时，建议先在 `src/pages/<domain>` 添加独立页面组件，再到 `src/config/modules.ts` 注册模块信息、菜单和路由，最后在 `src/routes/adminPages.tsx` 建立 `ModuleId -> Page` 映射。

## Mock API

项目默认启用本地 Mock API。页面仍然通过 `src/api` 中的业务接口发起请求，匹配到的请求会由 `src/mocks` 返回本地数据。

如需关闭 Mock 并接入真实后端，可以在环境变量中设置：

```env
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://your-api.example.com
```

## 部署说明

构建后将 `dist` 目录部署到静态 Web 服务即可：

```bash
pnpm build
```

如果使用 Nginx 并启用浏览器 history 路由，需要添加 SPA fallback：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

PWA 安装能力需要 HTTPS 环境；公网 IP 的 HTTP 访问通常不会触发浏览器的安装入口。部署到正式环境时建议绑定域名并配置 SSL 证书。

## License

MIT

---

# Lonear Admin

Lonear Admin is an open-source admin dashboard template built with React, Vite, and TypeScript. It includes an authentication page, admin layout, protected routes, navigation, management pages, reusable UI components, local Mock API, and PWA basics. It is designed as a practical frontend starting point for admin panels, CMS dashboards, operation platforms, and internal business tools.

## Live Demo

Demo URL: [http://8.138.186.154](http://8.138.186.154)

Demo account:

```text
Email: admin@acme.local
Password: admin123
```

The demo uses browser-side local mock data. Login, menu, role, and system management requests are intercepted in the browser and resolved without a real backend service.

## Features

- Built with React 18, React Router, Vite, and TypeScript.
- Includes an admin login page, persisted auth state, and basic route protection.
- Provides common admin modules such as dashboard, system management, content operations, message center, audit center, and developer tools.
- Includes sample pages for roles, menus, permissions, organizations, dictionaries, articles, banners, files, notices, messages, and operation logs.
- Ships with lightweight custom UI components, including buttons, inputs, selects, date pickers, modals, drawers, notifications, tags, and upload controls.
- Supports light / dark themes, accent color switching, page tab styles, and main area layout preferences.
- Uses local Mock API for static deployment and complete interactive demos.
- Includes Web App Manifest and Service Worker files as a foundation for PWA support.

## Tech Stack

```text
React 18
TypeScript
Vite
React Router
Lucide React
CSS Modules / Plain CSS
Local Mock API
PWA Manifest + Service Worker
```

## Getting Started

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Build for production:

```bash
pnpm build
```

Preview the production build locally:

```bash
pnpm preview
```

Run type checking:

```bash
pnpm typecheck
```

## Project Structure

```text
src/
  api/            API modules grouped by business domain
  components/
    ui/           Base UI components
    shared/       Reusable cross-page components
  config/         Module registration, route paths, navigation, and app constants
  layouts/        Main admin layout
  mocks/          Local mock data and request interceptor
  pages/
    auth/         Authentication pages
    dashboard/    Dashboard pages
    system/       System management pages
    content/      Content operation pages
    message/      Message center pages
    audit/        Audit pages
    development/  Developer utility pages
    showcase/     Component showcase pages
  routes/         Route guards, route registration, and page mapping
  services/       Session, request, and storage services
  styles/         Global styles and design tokens
  utils/          Framework-agnostic utilities
```

When adding a business page, create the page component under `src/pages/<domain>`, register its metadata, menu item, and route in `src/config/modules.ts`, then map the `ModuleId` to the page component in `src/routes/adminPages.tsx`.

## Mock API

Local Mock API is enabled by default. The UI still calls the business APIs from `src/api`, while matched requests are handled by `src/mocks` and return local demo data.

To disable Mock API and connect a real backend, configure:

```env
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://your-api.example.com
```

## Deployment

Build the project and deploy the `dist` directory to any static web server:

```bash
pnpm build
```

If you deploy with Nginx and use browser history routing, add an SPA fallback:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

PWA installation requires HTTPS in production. HTTP access through a public IP address usually will not show the browser install prompt. For production deployment, bind a domain name and configure an SSL certificate.

## License

MIT
