# REST API Design

**Module:** Communication and APIs · **Interview priority:** Core

## What Is It?

An **API** (application programming interface) lets other software use a system's features without touching its database. Delivery apps call a maps API instead of building maps; a web front end and an iOS app call the same backend without caring what language it is written in.

**REST** (Representational State Transfer) is the most common style for web APIs: the system exposes **resources** (users, photos, orders) at URLs, and clients act on them with standard HTTP methods. An **endpoint** is a method plus a path:

```text
GET  https://api.example.com  /api  /v1  /users  /42
│    │                        │     │    │       └ id: which one
│    │                        │     │    └ resource (plural noun)
│    │                        │     └ version
│    │                        └ API prefix
│    └ host
└ method: what to do
```

## Why It Exists

A well-designed API is a contract that many clients depend on for years. Consistent conventions make it predictable to use, cacheable by infrastructure, safe to retry, and possible to evolve without breaking existing clients.

## How It Works

### Resources and methods

| Endpoint | Does | Success code |
|----------|------|--------------|
| `GET /users` | List users (paginated) | 200 |
| `GET /users/42` | Read one user | 200 (404 if missing) |
| `POST /users` | Create a user from the JSON body | 201 + the new id (and `Location` header) |
| `PUT /users/42` | Replace user 42 entirely | 200 or 204 |
| `PATCH /users/42` | Change only the fields sent | 200 |
| `DELETE /users/42` | Remove user 42 | 204 |

Use **nouns** for resources and let the method be the verb: `POST /orders`, not `POST /createOrder`.

### PUT vs PATCH

User 42 is `{"id":42, "name":"Aksha", "username":"ash", "age":25}`. The client sends `{"username":"ak"}`:

- **PUT** replaces the whole resource: `name` and `age` become null or defaults (or the request is rejected as incomplete).
- **PATCH** changes only `username`.

PUT is idempotent (sending the same full representation twice gives the same result); PATCH is idempotent only if the patch is (a "set" is; an "increment" is not).

### Path, query or body?

| Put it in | When | Example |
|-----------|------|---------|
| **Path** | Identifies a resource, or a clear parent–child relationship | `/blogs/7/comments`, `/users/3/orders` |
| **Query string** | Filtering, sorting, searching, pagination | `/products?color=red&sort=price&limit=20` |
| **Body** | Data to create or change; anything sensitive or large | `POST /login` with username and password |

Paths and query strings appear in logs, browser history and proxies, so secrets never go there. Keep nesting shallow (one level): `/users/3/orders` is clear; `/users/3/orders/9/items/2/reviews` is not — use `/reviews?itemId=2`.

### Status codes that matter

| Code | Meaning | Typical use |
|------|---------|-------------|
| 200 OK | Success with a body | Reads, updates |
| 201 Created | A new resource exists | `POST` that created something |
| 204 No Content | Success, nothing to return | `DELETE` |
| 301 / 302 | Moved permanently / temporarily | Redirects (a URL shortener uses these) |
| 304 Not Modified | Client's cached copy is still valid | Conditional `GET` with `ETag` |
| 400 Bad Request | Malformed or invalid input | Validation failures |
| 401 Unauthorized | **Not authenticated** — no or invalid credentials | Missing or expired token |
| 403 Forbidden | **Authenticated but not allowed** | Logged in, but not the owner |
| 404 Not Found | No such resource | Wrong id |
| 409 Conflict | Conflicts with current state | Duplicate username, version mismatch |
| 429 Too Many Requests | Rate limit exceeded | With `Retry-After` |
| 500 Internal Server Error | Server bug | Log details; hide them from clients |
| 503 Service Unavailable | Temporarily overloaded or down | Clients may retry later |

### Response shapes that can evolve

Return an object, not a bare array:

```json
{
  "users": [ { "id": 1, "name": "Aksha" } ],
  "nextCursor": "eyJpZCI6MX0",
  "totalCount": 29
}
```

With an object, fields such as `nextCursor` or `totalCount` can be added later without breaking clients that parse the old shape. Adding fields is safe; removing or renaming them is a breaking change ([Versioning](../api-versioning-pagination-and-filtering/content.md)).

Keep errors consistent too: `{"error": {"code": "USERNAME_TAKEN", "message": "…"}}`, so clients can handle them programmatically.

**Think about it:** a user is logged in but tries to delete another user's photo. Which status code, and why not 401?

<details>
<summary>Answer</summary>

**403 Forbidden.** The server knows who the user is (authentication succeeded) but the action is not permitted. 401 means "I don't know who you are — authenticate". Some APIs return 404 instead to avoid revealing that the photo exists.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** using 401 for "not allowed". 401 = not authenticated; 403 = authenticated but forbidden.

- **Verbs in URLs** (`/getUser`) — the method is the verb.
- **Returning 200 with `{"error": …}`** — breaks clients, proxies, monitoring and retry logic that rely on status codes.
- **Passwords or tokens in query strings** — they end up in logs.

## Interview Follow-up

- *"Design the API for a URL shortener."* `POST /api/v1/urls` with `{"longUrl": …}` → 201 `{"shortCode": "aB3dE9x"}`; `GET /{shortCode}` → 301/302 with `Location`; `DELETE /api/v1/urls/{shortCode}` → 204.

## Key Takeaways

- Endpoint = method + path; plural nouns for resources; methods are the verbs.
- PUT replaces, PATCH modifies; GET/PUT/DELETE are idempotent, POST is not.
- Path for identity, query for filter/sort/page, body for data and secrets.
- Use precise status codes (401 vs 403, 201, 204, 409, 429) and object-wrapped responses that can grow.
