# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the React + TypeScript app. Entry points are `src/main.tsx` and `src/App.tsx`.
- `src/components/` holds UI building blocks (PascalCase filenames like `ModulePanel.tsx`).
- `src/logic.ts`, `src/validate.ts`, and `src/types.ts` contain core domain logic and types.
- Tests live alongside code as `src/*.test.ts`.
- Static assets are in `src/assets/` (bundled) and `public/` (copied as-is).
- Build output is generated in `dist/` (do not edit manually).

## Build, Test, and Development Commands
- `npm run dev` starts the Vite dev server with HMR for local development.
- `npm run build` runs TypeScript project build plus the Vite production build.
- `npm run lint` checks the codebase with ESLint.
- `npm run preview` serves the production build locally.
- `npx vitest` runs the test suite (no `test` script is defined).

## Coding Style & Naming Conventions
- TypeScript + React with ES modules (`"type": "module"` in `package.json`).
- Use 2-space indentation and semicolons to match existing files.
- Components use PascalCase filenames; utilities are lower camelCase (`logic.ts`, `validate.ts`).
- Keep logic in `src/logic.ts` and validation in `src/validate.ts` instead of bloating UI components.
- ESLint is the primary style gate (`eslint.config.js`).

## Testing Guidelines
- Framework: Vitest with jsdom for browser-like tests (see `// @vitest-environment jsdom`).
- Name tests as `*.test.ts` alongside the code they cover.
- Prefer unit tests for logic/validation helpers; keep UI tests focused and minimal.

## Commit & Pull Request Guidelines
- Commit messages are short, descriptive, and sentence case (e.g., “Add named patch saves…”).
- Reference issues/PRs when relevant (e.g., “(#123)”).
- PRs should include a clear description, test notes, and screenshots for UI changes.

## Configuration & Environment Notes
- Build tooling: Vite + TypeScript; styling uses Tailwind via Vite plugin.
- If you add new env needs, document them in `README.md` and update this file.
