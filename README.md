# Admin Linear Demo

基于 `linear-admin-menu.html` 视觉风格搭建的 React 后台管理系统框架，内置 PWA manifest 和 service worker。

## Scripts

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
```

PWA 的 service worker 只在生产构建中注册，使用 `pnpm build && pnpm preview` 可以验证安装和离线缓存能力。
