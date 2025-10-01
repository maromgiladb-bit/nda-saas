This repository is a small Next.js (app dir) TypeScript project. The goal of these instructions
is to give an AI coding agent the exact, actionable context needed to be productive without
making assumptions.

High-level architecture
- App framework: Next.js 15 using the app directory (`src/app`). Routes and UI live under
  `src/app` as React Server Components by default. Client components must include `"use client"`
  at the top of the file.
- Entry & layout: `src/app/layout.tsx` sets global fonts via `next/font/google` and imports
  `src/app/globals.css` (see font CSS variables `--font-geist-sans` / `--font-geist-mono`).
- Static assets: `public/` contains images referenced with `next/image` (see `src/app/page.tsx`).

Important files and why they matter
- `package.json` — scripts and dependency versions. Key scripts:
  - `npm run dev` -> `next dev --turbopack` (development server, turbopack enabled)
  - `npm run build` -> `next build --turbopack`
  - `npm run start` -> `next start`
  - `npm run lint` -> `eslint`
- `tsconfig.json` — strict TypeScript. Note path alias: `@/*` -> `./src/*`. Prefer this alias
  when adding imports.
- `eslint.config.mjs` — uses `FlatCompat` to extend `next/core-web-vitals` and `next/typescript`.
  Lint ignores: `.next`, `node_modules`, `out`, `build`, `next-env.d.ts`.
- `postcss.config.mjs` and `src/app/globals.css` — Tailwind is wired through the PostCSS
  plugin `@tailwindcss/postcss`. Global CSS sets design tokens (CSS variables) used by layout.

Project-specific conventions and patterns
- Server vs Client: Files in `src/app` are server components by default. Add `"use client"`
  on top of a file to make it a client component (for hooks, state, event handlers, or browser
  APIs). Example: `src/app/page.tsx` is a server component that imports `next/image`.
- Fonts: `next/font/google` is used to set CSS variables in `layout.tsx`. When referencing fonts
  in CSS, use the variables `--font-geist-sans` and `--font-geist-mono` (already present in
  `globals.css`).
- Images: Use `next/image` with `src` paths pointing to `/` (public root). See `src/app/page.tsx`.
- Path imports: Use the `@/` path alias for code in `src/` (configured in `tsconfig.json`).

Build / dev / debug notes (explicit)
- Development: run `npm run dev` and open http://localhost:3000. The script uses Turbopack
  (experimental) — if you hit Turbopack-specific issues, re-run without it by temporarily
  editing the script to `next dev`.
- Build: `npm run build` uses `--turbopack`. If CI or local build fails due to turbopack, try
  `next build` (remove the flag) to narrow the problem.
- Linting: `npm run lint` runs `eslint`. Use `npx eslint --fix <path>` when suggesting automatic
  fixes.

Integration & dependencies
- Core: `next@15`, `react@19`, `typescript` and `eslint` (see `package.json` for exact versions).
- Styling: Tailwind via `@tailwindcss/postcss` plugin. Global tokens are in
  `src/app/globals.css` (including `@theme inline` blocks used in this project).
- Deployment: README references Vercel. Default expectation is Vercel/Next deployment, but the
  repo contains no project-specific serverless or infra scripts.

How to modify UI and add features (examples an agent can follow)
- Add a route: create `src/app/<route>/page.tsx` (server component by default).
- Add a client component: create a component with `"use client"` on the first line and put it
  under `src/components/` or `src/app/<route>/components/`. Import with `@/components/...`.
- Add styles: update `src/app/globals.css` or add component-level module CSS. Prefer CSS
  variables already declared for colors and fonts.

Searchable places to learn more (use these exact files)
- `package.json` — scripts and deps
- `tsconfig.json` — path aliases
- `eslint.config.mjs` — lint rules and ignores
- `src/app/layout.tsx` — fonts and layout conventions
- `src/app/globals.css` — design tokens and Tailwind entry
- `src/app/page.tsx` — example usage of `next/image` and className patterns

When in doubt
- Prefer small, incremental changes and run `npm run dev` to smoke-test UI changes.
- Preserve `"use client"` semantics — moving server logic into client files or vice-versa is
  a common source of bugs.

If any of these sections are unclear or you'd like more examples (routing, API routes,
testing setup, or CI), tell me which area to expand and I'll add focused, example-driven
instructions.
