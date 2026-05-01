# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Supenli.io** — AI-powered content creation platform for social media creators. Centralizes research sources (PDFs, URLs, YouTube, notes), provides an AI chat assistant, and generates ready-to-publish posts for X, LinkedIn, Instagram, YouTube, Facebook and TikTok.

**Interface language: English.** All user-facing text (labels, placeholders, messages, toasts) must be in English.

## Commands

- `npm run dev` — start dev server on port 8080
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run test` — run all tests (vitest)
- `npm run test:watch` — run tests in watch mode
- `npx vitest run src/path/to/file.test.ts` — run a single test file

## Tech Stack

### Frontend
- **React 18** + **TypeScript** with **Vite** (SWC plugin)
- **React Router v6** for client-side routing
- **TanStack React Query** for async state management
- **Tailwind CSS** with CSS variable-based theming (dark mode via `class` strategy)
- **shadcn/ui** (Radix primitives) — components in `src/components/ui/`
- **Framer Motion** for animations

### Backend & Services
- **Supabase** — auth, database (PostgreSQL), storage
- **Claude Sonnet** (Anthropic API) — AI chat and content generation
- **Tavily API** — web search
- **Stripe** — payments and subscriptions

### Testing
- **Vitest** + **React Testing Library** + **jsdom** for unit tests
- **Playwright** for e2e tests

## Path Alias

`@/` maps to `src/` — use this for all imports (e.g., `import { cn } from "@/lib/utils"`).

## Architecture

### Routing (`src/App.tsx`)

- `/` — Landing page (marketing site with features, pricing, FAQ)
- `/login` — Login page
- `/dashboard` — Notebook view (sources panel + AI chat)
- `/dashboard/studio` — Content Studio (select platform, format, generate content)
- `/dashboard/tools` — Tools page

### Layout

All dashboard routes wrap their content in `DashboardLayout`, which provides a compact icon-only sidebar (64px wide) with navigation for Notebook, Studio, and Tools.

### Key Components

- `SourcePanel` — left sidebar in the Notebook view; lists research sources (files, URLs, notes) with quick-add actions
- `ChatPanel` — main area in Notebook view; AI chat interface with suggested prompts and message bubbles
- `Studio` (page) — two-step flow: select a platform from a grid, then pick a format, enter a topic, and generate content

### Styling Conventions

- Use the `cn()` utility from `@/lib/utils` for conditional class merging
- Custom colors defined as CSS variables: `surface`, `surface-hover`, `glow`, plus full `sidebar-*` palette
- Custom animations: `fade-in`, `pulse-glow` (defined in tailwind config)
- `glow-sm` / `glow-md` CSS classes used on CTAs and highlighted elements

## Testing

- Test setup in `src/test/setup.ts` (imports `@testing-library/jest-dom`, mocks `window.matchMedia`)
- Tests go in `src/**/*.{test,spec}.{ts,tsx}`
- Vitest globals are enabled (no need to import `describe`, `it`, `expect`)

## TypeScript Config

- `strictNullChecks` is **off**
- `noImplicitAny` is **off**
- `noUnusedLocals` and `noUnusedParameters` are **off**

## Development Rules

- **Strict TypeScript**: Write clean, typed code. Explicitly type props, function returns, and state. Avoid `any`.
- **Never use placeholder/setTimeout to simulate AI**: Always use the real API (Anthropic for chat/generation, Tavily for web search). If an integration is missing, implement it — never simulate it.
