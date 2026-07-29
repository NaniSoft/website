# Nanisoft

The website for **nanisoft.com** — a multilingual documentation + product-landing
site built on the Next.js 16 + Nextra 4 starter. Deployed to **Cloudflare Workers**
(via OpenNext) at [www.nanisoft.com](https://www.nanisoft.com).

English | 中文

[![License](https://img.shields.io/github/license/pdsuwwz/nextjs-nextra-starter?color=466fe8)](./LICENSE)

🔥 A Next.js 16 starter for indie developers and small teams: Tailwind CSS 4, React 19, Nextra 4, TypeScript, Shadcn UI, Radix UI, Aceternity UI, Sass, ESLint 9, Iconify, and i18n multilingual support. Built for Blog, Docs, and AI SaaS landing pages with responsive layout, dark mode, login page, and frontend auth examples. Deploys to Cloudflare Workers via OpenNext.

- [🚀 Live Site](https://www.nanisoft.com)

## 🚀 What's New

- **Tailwind CSS v4 Upgrade**: Fully upgraded to Tailwind CSS v4, optimizing performance and introducing new features.
- **Nextra v4 Refactoring**: Upgraded to Nextra v4, enhancing document generation efficiency and development experience.

## 🎉 Features

- ⚡️ **Next.js 16 + React 19 + TypeScript**: Modern core stack with strong type safety and developer productivity
- 🎨 **Tailwind CSS v4 + Sass**: Utility-first styling with scalable style organization
- 📚 **Nextra v4 (content-driven)**: Great fit for docs, knowledge bases, and blogs
- 🧩 **Shadcn UI + Radix UI + Aceternity UI**: Composable UI system for fast product page building
- 🌍 **i18n multilingual support**: Built-in structure for localized content and routes
- 🌙 **Dark mode + responsive design**: Consistent UX across desktop and mobile
- 🔐 **Login page + frontend auth examples**: Practical auth flow reference for rapid integration
- 🖼️ **Iconify icon support**: Unified icon strategy with low integration cost
- 🛠️ **ESLint v9**: Consistent code quality and team-friendly standards
- 🚀 **Deployment-ready**: Deploys to Cloudflare Workers via OpenNext

## 🎯 Use Cases

- Personal blog (Blog Starter Template)
- Developer docs and product documentation sites
- AI product websites and conversion-focused SaaS landing pages
- Personal projects and small team product showcases

## Prerequisites

- React 19.x
- Node >= 24.x
- Pnpm 11.x
- **VS Code plugin `dbaeumer.vscode-eslint` >= v3.0.5 (pre-release)**

## Installation and Running

- Install dependencies

```bash
pnpm i
```

- Local development

```bash
pnpm dev
```

Then open http://localhost:8000 in your browser to access the service.

### Cloudflare (Worker) build & deploy

```bash
pnpm cloudflare-build   # build with @opennextjs/cloudflare -> .open-next/
pnpm preview            # build + local Worker preview
pnpm deploy             # build + wrangler deploy
```

CI/CD runs through `.github/workflows/deploy.yml` (lint + build on PRs, build +
`wrangler deploy` on pushes to `main`). Required GitHub secrets:
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. There is no database / Supabase.

## Using Shadcn UI Components

This project has integrated [Shadcn UI](https://ui.shadcn.com). Follow these steps to install/edit components and use them:

### Shadcn Structure Initialization

Execute `pnpm dlx shadcn@latest init` command to initialize the basic project structure for `Shadcn UI` (if not already initialized)

💡 Note

> This initialization command is used to create the basic project structure for `Shadcn UI`
>
> **This project has already been initialized, so there's no need to run this command again**

### Component Installation

1. Use `Shadcn CLI` to add components:

   ```bash
   pnpm dlx shadcn@latest add <component-name>
   ```

   For example, to add the `<Alert />` component, execute the following command, [see documentation](https://ui.shadcn.com/docs/components/alert#installation)

   ```bash
   pnpm dlx shadcn@latest add alert
   ```

2. Using components

```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function Home() {
  return (
    <Alert>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components and dependencies to your app using the cli.
      </AlertDescription>
    </Alert>
  )
}
```

3. Customizing component styles (optional)

`Shadcn UI` components typically provide popular default styles and functionality that meet most needs. If you truly need to customize, you can edit the respective component files, such as:

Open [`src/components/ui/alert.tsx`](src/components/ui/alert.tsx) to modify the styles of the `Alert` component

> Tips: In most cases, the default styles provided by `Shadcn UI` are sufficient to meet requirements without additional modifications

## 🚨 Disclaimer

This template is provided as a technical reference solution. Users must acknowledge the following risks and obligations:

- **Technical Risks**:
  Dependent frameworks (Next.js/Nextra/Tailwind CSS) carry version iteration risks. Third-party components (e.g. Shadcn UI) follow their original repositories' specifications. Environment configuration changes may cause unforeseen build exceptions

- **Usage Restrictions**:
  Prohibited for use in scenarios violating open-source licenses or applicable laws/regulations. Users must conduct independent code security audits and production environment validation

- **Liability Exclusion**:
  No guarantees are provided regarding:

1. Business applicability of technical solutions
2. Security assurance of dependencies
3. Official customization support

Users assume full responsibility for any direct/indirect consequences arising from usage or modifications. Continued use constitutes acceptance of these terms

## License

[MIT](./LICENSE) License | Copyright © 2020-PRESENT [Wisdom](https://github.com/pdsuwwz)