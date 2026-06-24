# Lonear Admin

[中文](./README.md) | English

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

- React 18
- TypeScript
- Vite
- React Router
- Lucide React
- Plain CSS
- Local Mock API
- PWA Manifest + Service Worker

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
