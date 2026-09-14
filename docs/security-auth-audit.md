# Security audit: credential storage and client-to-API trust

## 1) Credential storage vulnerability

The original password implementation in `apps/api/src/services/utils.ts` used a deterministic SHA-256 hash of `password + "salt"`.

Why this is dangerous:

- SHA-256 is fast and designed for non-secret inputs, so it can be brute-forced efficiently with GPUs or distributed cracking rigs.
- The same password always maps to the same digest, which means attackers can precompute likely password candidates in offline dictionaries.
- The constant salt was effectively public and not unique per user, so it did not protect against rainbow table or batch cracking.
- If the database were exposed, all accounts could be attacked offline immediately.

Severity: Critical. With a leaked password database, an attacker can recover a large fraction of user accounts quickly, often before the platform can take action.

### Backwards-compatible migration

The fix keeps compatibility with previously seeded SHA-256 values during a transition window:

- New passwords are stored with bcrypt.
- Existing legacy SHA-256 hashes are still accepted for login.
- After a successful login, the legacy hash is replaced with a bcrypt hash automatically.
- This preserves access for existing seeded users without requiring plaintext passwords.

## 2) Client/API trust establishment vulnerability

The server and browser clients were trusting shared hardcoded JWT secrets such as `chirp-grpc-jwt-secret-key-at-least-32-chars` and session secrets like `chirp-session-secret-key-at-least-32-chars`.

Why this is dangerous:

- Any client or attacker who learns the repository or deployed config can mint tokens using the same secret.
- That lets a malicious party impersonate authenticated users or privileged admin sessions.
- Trust is effectively public rather than environment-bound.

Severity: Critical. This allows forged sessions and authorization bypass if the secret is exposed in code, logs, or copied env files.

### Fix

The API and client code now require `GRPC_JWT_SECRET` and `SESSION_SECRET` to be configured as non-empty, minimum-length secrets. If they are missing, the app throws instead of silently falling back to a publicly known value.

This ensures the trust boundary is established with environment-controlled secrets rather than repository-committed defaults.

## 3) Regression coverage

The tests in `apps/api/src/services/auth.service.test.ts` cover the original vulnerability and the fix:

- bcrypt hashing is enforced for new passwords
- legacy SHA-256 hashes still authenticate during the migration period
- legacy hashes are upgraded to bcrypt after successful login
- missing `GRPC_JWT_SECRET` fails instead of accepting an insecure fallback
