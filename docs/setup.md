# Development setup

1. Install Node.js 20+ and pnpm 9.15.
2. Run `pnpm install`.
3. Copy required environment values into a local env file:
   - `GRPC_JWT_SECRET`: at least 32 random characters
   - `SESSION_SECRET`: at least 32 random characters
   - `DATABASE_URL`: SQLite or LibSQL URL
4. Generate protocol and database artifacts with `pnpm proto:generate` and `pnpm db:generate`.
5. Run migrations with `pnpm db:migrate`.
6. Seed local data with `pnpm db:seed`.
7. Start development with `pnpm dev`.
8. Run `pnpm typecheck`, `pnpm lint`, `pnpm test:unit`, and `pnpm build` before opening a PR.
9. Enable the local hook once with `git config core.hooksPath .githooks`.

The user app runs on port 3000, the admin app on 3002, and the API health endpoint is available on port 3001.
