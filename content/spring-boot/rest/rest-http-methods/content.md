# HTTP Methods and Idempotency

**Module:** REST API Development · **Interview priority:** Core

## Definition

**HTTP methods** state the intended action on a resource: `GET` reads, `POST` creates or triggers processing, `PUT` replaces, `PATCH` partially updates, `DELETE` removes. Two properties classify them:

- **Safe** — the method does not change server state (read-only from the client's perspective).
- **Idempotent** — sending the same request once or many times leaves the server in the **same state**.

## Why It Matters

- PUT vs PATCH, GET vs POST and "Which methods are idempotent?" are standard interview questions.
- Idempotency decides what can be **retried safely** after a timeout — by clients, gateways and retry libraries. Retrying a non-idempotent `POST /payments` can charge a customer twice.

## HTTP Methods

| Method | Purpose | Safe | Idempotent | Request body | Typical success |
|--------|---------|------|------------|--------------|-----------------|
| `GET` | Read a resource or collection | Yes | Yes | No (semantics undefined) | 200 |
| `HEAD` | Like `GET`, headers only | Yes | Yes | No | 200 |
| `OPTIONS` | Supported methods; CORS preflight | Yes | Yes | No | 200/204 |
| `POST` | Create in a collection, or process | No | **No** | Yes | 201 (+`Location`), 200, 202 |
| `PUT` | Replace the resource (or create at a known URI) | No | Yes | Full representation | 200, 204 (201 if created) |
| `PATCH` | Partial update | No | Not guaranteed | Changes only | 200, 204 |
| `DELETE` | Remove | No | Yes | Usually none | 204, 200 (404 if absent) |

## GET

Retrieves data. Must not change state, so it can be cached, prefetched, bookmarked and retried freely.

```java
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

record ProductView(long id, String name, String category) {
}

interface ProductQueries {
    List<ProductView> search(String category);

    ProductView byId(long id);
}

@RestController
class ProductReadController {
    private final ProductQueries queries;

    ProductReadController(ProductQueries queries) {
        this.queries = queries;
    }

    @GetMapping("/api/products")
    List<ProductView> list(@RequestParam(required = false) String category) {
        return queries.search(category);
    }

    @GetMapping("/api/products/{id}")
    ProductView one(@PathVariable long id) {
        return queries.byId(id);
    }
}
```

## POST

Creates a subordinate resource (server assigns the id) or performs processing that does not fit other methods (search with a complex body, `POST /orders/42/cancellation`). Two identical POSTs create **two** orders — not idempotent. Returns **201 Created** with a `Location` header when it creates.

## PUT

Replaces the resource at the given URI with the request's **complete** representation. Fields missing from the body are reset (to null/defaults), not left unchanged. Sending the same PUT twice gives the same final state → idempotent. PUT can also create when the **client chooses the id** (`PUT /users/me/settings`).

## PATCH

Applies a **partial** modification: only the fields sent are changed.

```http
PATCH /api/users/7 HTTP/1.1
Content-Type: application/merge-patch+json

{ "phone": "+91-9876543210" }
```

Formats: **JSON Merge Patch** (RFC 7396 — send the fields to change, `null` deletes) or **JSON Patch** (RFC 6902 — a list of operations: `add`, `remove`, `replace`). Most Spring APIs use a simple merge-style DTO with nullable fields.

PATCH is **not guaranteed idempotent**: `{"op": "add", "path": "/tags/-", "value": "sale"}` appends every time, and "increment stock by 5" changes state on each call. A merge patch that sets fields to fixed values is idempotent in practice.

## DELETE

Removes the resource. Idempotent: after the first call the resource is gone; later calls leave the state unchanged, even if they return **404** instead of **204**. Idempotency is about **server state**, not identical responses.

Soft delete (setting `deleted = true`) is still `DELETE` from the API's point of view.

## Idempotency

| Retry after a timeout… | Safe to retry? |
|------------------------|----------------|
| `GET /orders/42` | Yes |
| `PUT /orders/42/address` | Yes — same final state |
| `DELETE /orders/42` | Yes |
| `POST /orders` | **No** — may create a duplicate order |
| `PATCH` "increment" | **No** |

### Making POST idempotent: idempotency keys

Payment and order APIs accept an **`Idempotency-Key`** header (a client-generated UUID per logical operation):

```text
1. Client sends POST /orders with Idempotency-Key: 3f1c…  (times out, retries with the SAME key)
2. Server looks up the key:
   • not seen       → store key (status IN_PROGRESS) with a UNIQUE constraint, process, store response
   • completed      → return the stored response (no second order)
   • in progress    → 409 Conflict (or wait)
   • same key, different request body → 422 (key reuse error)
3. Keys expire after e.g. 24 h
```

The database **unique constraint** on the key makes concurrent duplicates impossible; checking "exists?" in Java alone is a race condition. See [Project-Based Questions](../../interview/spring-project-based-questions/content.md) for the duplicate-order scenario.

## PUT vs PATCH

| Aspect | PUT | PATCH |
|--------|-----|-------|
| Semantics | Replace the whole resource | Modify part of it |
| Body | Complete representation | Only the changes |
| Missing fields | Reset/cleared | Unchanged |
| Idempotent | Yes | Not guaranteed |
| Can create | Yes, at a client-chosen URI | Normally no |
| Spring | `@PutMapping` + full DTO | `@PatchMapping` + DTO with nullable fields, or JSON Patch |

## GET vs POST

| Aspect | GET | POST |
|--------|-----|------|
| Purpose | Read | Create / process |
| Safe / idempotent | Yes / yes | No / no |
| Parameters | URL query string | Request body |
| Cacheable | Yes (by default rules) | Rarely |
| Bookmarkable, visible in logs/history | Yes — never put secrets in URLs | Body not in URL |
| Length limits | URL length limits (servers/proxies, often ~8 KB) | Large bodies allowed |
| Retried automatically by browsers/proxies | May be | Should not be |

Using `POST` for a complex search (large filter object) is acceptable; using `GET` to change state is not.

## Common Mistakes

- State-changing `GET` endpoints (`GET /orders/42/cancel`) — crawlers and prefetch can trigger them.
- Implementing PUT as a partial update — clients that send partial bodies cause silent data loss elsewhere.
- Retrying POST without idempotency keys.
- Request bodies on `GET` — many proxies and clients drop them.

## Common Interview Traps

- **"DELETE is not idempotent because the second call returns 404."** Idempotency concerns the resulting state, not the status code.
- **"PATCH is idempotent like PUT."** Not by definition.
- **"POST is for create, PUT is for update."** PUT means *replace at this URI* (it can create); POST means *let the server process/create subordinate*.

## Key Takeaways

- Safe: GET, HEAD, OPTIONS. Idempotent: those plus PUT and DELETE. POST is neither; PATCH is not guaranteed idempotent.
- PUT replaces, PATCH modifies; GET reads, POST creates/processes.
- Make critical POSTs retry-safe with idempotency keys backed by a unique constraint.
