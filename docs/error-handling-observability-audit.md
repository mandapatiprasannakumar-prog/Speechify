# Error handling and observability audit

## Handler audit

| Handler | Existing behavior | Unified treatment |
|---|---|---|
| Auth | Converts registration/login failures to response errors; throws for current-user failures; returns invalid session state | Classified as invalid credentials, authentication, or internal failures and logged with a trace ID |
| Posts | Converts create/update/delete failures to response errors; public reads ignore invalid optional tokens | Same response contracts; unexpected failures are logged and classified |
| Comments | Converts mutation failures; reads return an empty response on failure | Same response contracts; failures receive structured logs |
| Likes | Converts mutations to response errors; status failures return false | Same response contracts; failures are classified |
| Follows | Converts mutations to response errors; count/status failures return zero/false | Same response contracts; failures are classified |
| Feed | Requires auth for home; treats explore as public and ignores invalid optional tokens | Same public/private behavior; every call is traced |
| Search | Treats optional invalid tokens as anonymous | Same behavior; every call is traced |
| Users | Treats optional invalid tokens as anonymous; converts profile updates to response errors | Same behavior; every call is traced |
| Admin | Converts mutation failures to response errors and protects admin operations | Same response contracts; authorization failures are classified |
| Notifications | Returns empty/zero for read failures and response errors for mutations | Same response contracts; failures are classified |
| Bookmarks | Converts toggles to response errors and returns false/empty for reads | Same response contracts; failures are classified |

## Implementation

`apps/api/src/grpc/observability.ts` defines the error taxonomy (`INVALID_ARGUMENT`, `UNAUTHENTICATED`, `PERMISSION_DENIED`, `NOT_FOUND`, and `INTERNAL`) and wraps each registered service. Every call gets a UUID trace ID, structured request/completion/failure logs, duration, and a mapped error code. The wrapper is installed in `apps/api/src/grpc/server.ts`, so new handler methods on registered services receive the same behavior automatically.

Existing protobuf response contracts remain unchanged. Existing handlers continue returning their established success/error/empty response shapes; the observability layer adds operational context without changing those payloads.
