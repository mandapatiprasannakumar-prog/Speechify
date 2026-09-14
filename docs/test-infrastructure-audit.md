# Test infrastructure audit

The API setup creates a fresh in-memory LibSQL database for each test file and clears dependent tables before every test. The cleanup order follows foreign-key dependencies, which prevents state leaking between tests.

The main coverage gap was security behavior: password hashing, legacy credential migration, and missing secret enforcement were not covered. These are now covered in `apps/api/src/services/auth.service.test.ts`.

The handler suite covers auth, posts, comments, likes, and admin behavior. Remaining handler gaps are the public/anonymous error paths for feed, search, users, notifications, follows, and bookmarks. These paths are catalogued in the error audit and should be added as focused tests as those services evolve.

Client unit tests use Testing Library cleanup after each test and shared mocks for TanStack Start server APIs. Client E2E tests use Playwright project configuration and should run against the built app/API in CI.
