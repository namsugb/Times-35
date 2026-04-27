# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 15 appointment scheduling app. Route handlers, pages, loading states, and layouts live in `app/`, including token-based vote and results routes under `app/vote/[token]` and `app/results/[token]`. Shared React components live in `components/`; reusable shadcn/Radix primitives are in `components/ui/`. Domain and infrastructure code lives in `lib/`, with Supabase clients, auth/session helpers, result calculation, Kakao notification helpers, and appointment types. Global styles are in `app/globals.css` and `styles/globals.css`; Tailwind config is in `tailwind.config.ts`. Static images are in `public/`. Database changes are tracked as ordered SQL files in `migrations/`.

## Build, Test, and Development Commands

- `npm run dev`: start the local Next.js development server.
- `npm run build`: create a production build and catch build-time route issues.
- `npm run start`: run the production build locally after `npm run build`.
- `npm run lint`: run Next.js linting.
- `npm run type-check`: run TypeScript with `tsc --noEmit`.

Use Node `>=18` and npm `>=8`, as declared in `package.json`.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Prefer the `@/` path alias for internal imports, for example `@/lib/supabase-server` or `@/components/ui/button`. Keep route files named by Next.js convention: `page.tsx`, `layout.tsx`, `loading.tsx`, and `route.ts`. Component files in this repository use both kebab-case (`share-modal.tsx`) and PascalCase (`GroupsTab.tsx`); follow the local folder pattern when adding nearby files. Style UI with Tailwind classes and existing shadcn/Radix components before adding custom primitives.

## Testing Guidelines

No automated test framework is currently configured. For changes, run `npm run type-check`, `npm run lint`, and `npm run build` before handing off. If adding tests later, colocate them near the feature or under a dedicated test directory, and use names such as `result-calculator.test.ts` or `VoteTimeScheduling.test.tsx`.

## Commit & Pull Request Guidelines

Recent commit subjects are brief and informal. Going forward, prefer concise imperative subjects such as `Add group creation modal` or `Fix Kakao invite route`, with a body when behavior or schema changes need context. Pull requests should include a summary, verification commands run, linked issues if any, screenshots for UI changes, and migration notes when SQL files or environment variables change.

## Security & Configuration Tips

Keep secrets in `.env.local` and out of git. Supabase and Kakao integrations rely on server-side helpers in `lib/` and `app/api/`; avoid exposing service keys in client components. Apply migrations in numeric order and document any required production configuration changes in the PR.
