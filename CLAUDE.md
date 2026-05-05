# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a monorepo with two separate applications:

- `agentic-research-assistant-be/` — NestJS backend (Node.js, TypeScript, ESM)
- `agentic-research-assistant-fe/` — Next.js frontend (React 19, TypeScript)

Each app has its own `node_modules`, `package.json`, and must be run independently from its own directory.

## Backend (NestJS)

```bash
cd agentic-research-assistant-be
npm run start:dev      # watch mode with SWC compiler
npm run build          # production build
npm run lint           # ESLint with auto-fix
npm run test           # unit tests (Jest)
npm run test:e2e       # end-to-end tests
npm run test:cov       # coverage report
```

- Runs on port `3000` by default (overridable via `PORT` env var)
- Environment loaded from `../.env` (repo root) via `@nestjs/config` (global) — single `.env` shared with frontend
- Uses SWC for fast compilation (`-b swc` flag)
- Path alias `@/*` maps to `src/*`
- ESM (`"type": "module"`): imports must use `.js` extension even for `.ts` source files

### Environment Variables

The `.env` file lives at the repo root. Required variables:

```
DB_HOST=aws-1-ap-southeast-2.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.<project-ref>
DB_PASWORD=<password>        # note: single 's' typo — must match exactly
DB_DATABASE=postgres

JWT_ACCESS_SECRET=<openssl rand -base64 64>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<openssl rand -base64 64>
JWT_REFRESH_EXPIRES_IN=7d
```

Database is **Supabase PostgreSQL** connected via the Transaction pooler (port `6543`). SSL is required (`rejectUnauthorized: false`). TypeORM `synchronize: true` is enabled — tables are auto-created on startup. `prepareThreshold: 0` disables prepared statements (required for the transaction pooler).

## Frontend (Next.js)

```bash
cd agentic-research-assistant-fe
npm run dev            # development server
npm run build          # production build
npm run lint           # ESLint
```

- Uses Next.js App Router (`src/app/`)
- React Compiler enabled (`reactCompiler: true` in `next.config.ts`)
- **Important:** This is Next.js 16 — APIs and conventions may differ significantly from Next.js 13/14/15. Read `node_modules/next/dist/docs/` before writing any Next.js-specific code and heed deprecation notices.

## Architecture

The backend follows standard NestJS module structure: `AppModule` imports feature modules, each module groups its `Controller`, `Service`, and any providers. New features should be added as NestJS modules under `src/`.

Current backend modules:
- `AuthModule` (`src/auth/`) — register, login, logout, token refresh. Access token via Bearer header, refresh token via HttpOnly cookie.
- `UserModule` (`src/user/`) — user entity + CRUD helpers consumed by AuthModule.

To protect a route with JWT, apply `@UseGuards(JwtAuthGuard)` — the guard is at `src/auth/guards/jwt-auth.guard.ts`. The authenticated user is available as `req.user = { userId, email }`.

The frontend uses the App Router file-system convention: pages go in `src/app/`, with `layout.tsx` at each level for shared UI. CSS Modules (`.module.css`) are used for component styles.
