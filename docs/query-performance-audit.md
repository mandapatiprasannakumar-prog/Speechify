# Query performance audit

The feed and bookmark services used a per-post enrichment loop. Each post issued separate queries for like count, comment count, and the requester's like status.

## Measured query counts

Counts below are for a page of 10 posts with an authenticated requester.

| Operation | Before | After | Notes |
|---|---:|---:|---|
| Home feed | 32 | 5 | 1 following lookup, 1 post lookup, 3 batched enrichment queries |
| Profile page (`getUser`) | 5 | 5 | One user lookup plus follower, following, post, and relationship counts |
| Bookmarks | 41 | 5 | 1 bookmark lookup, 1 joined post lookup, 3 batched enrichment queries |

The previous counts are deterministic from the code path: home feed performs `2 + 3N`; bookmarks performs `1 + 4N`; for `N = 10`, that is 32 and 41.

## Fix

`apps/api/src/services/post-enrichment.ts` is the reusable pattern. It takes the page's post IDs and fetches like counts, comment counts, and requester like state with `IN (...)` aggregate queries. Feed and bookmark responses retain the same fields and ordering.

Future list endpoints should fetch the page first and enrich the complete page in batches. A per-item database call inside `map`, `Promise.all`, or a loop is prohibited for this response shape.
