# REST Principles and Resource Design

**Module:** REST API Development · **Interview priority:** Core

## Definition

**REST (Representational State Transfer)** is an architectural style for networked systems, defined by Roy Fielding (2000). A REST API exposes **resources** (orders, products, users) identified by **URIs**; clients manipulate them by transferring **representations** (usually JSON) with the standard **HTTP methods**, and every request is **stateless** — it carries everything the server needs to process it.

## Why It Matters

- "What is REST?" and "What makes an API RESTful?" open most backend interviews.
- Good resource design produces predictable APIs that clients, caches and gateways understand without custom documentation for every call.
- Many "REST" APIs are really RPC over HTTP (`POST /getOrders`); interviewers notice.

## What Is REST?

REST is **not** a protocol, a standard or a library. It is a set of constraints. HTTP is the protocol most REST APIs use, and JSON the most common representation format.

```http
GET /api/orders/42 HTTP/1.1
Host: shop.example.com
Accept: application/json
Authorization: Bearer eyJhbGciOi...

HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{ "id": 42, "status": "SHIPPED", "total": 149900 }
```

The resource is *order 42*; the JSON is one *representation* of its current *state*; the client *transferred* that state with `GET`.

## REST Principles

Fielding's six constraints:

| Constraint | Meaning | Practical effect |
|------------|---------|------------------|
| **Client–server** | UI and data storage are separated | Mobile app, web app and partners share one API |
| **Stateless** | No client session state on the server between requests; each request is self-contained (e.g. carries its token) | Any instance behind a load balancer can serve any request; easy horizontal scaling |
| **Cacheable** | Responses state whether they can be cached | `Cache-Control`, `ETag` → fewer requests |
| **Uniform interface** | Same conventions for all resources: URIs identify resources, representations manipulate them, messages are self-descriptive (media types, status codes), hypermedia links drive transitions (HATEOAS) | Clients learn the pattern once |
| **Layered system** | Clients cannot tell if they talk to the server or an intermediary | Gateways, load balancers, CDNs can be inserted |
| **Code on demand** (optional) | Server may send executable code | Rare in APIs |

"Stateless" refers to **session state**, not data: the server still stores orders in a database. A JWT in each request is stateless authentication; an HTTP session stored in server memory is not.

## Resource-Oriented Design

Design around **nouns (resources)**, and let **HTTP methods** be the verbs.

| Operation | RPC style (avoid) | Resource style |
|-----------|-------------------|----------------|
| List orders | `POST /getAllOrders` | `GET /orders` |
| Get one | `GET /getOrder?id=42` | `GET /orders/42` |
| Create | `POST /createOrder` | `POST /orders` |
| Replace | `POST /updateOrder` | `PUT /orders/42` |
| Partial update | `POST /updateOrderStatus` | `PATCH /orders/42` |
| Delete | `GET /deleteOrder?id=42` | `DELETE /orders/42` |
| Items of an order | `GET /getItemsForOrder?id=42` | `GET /orders/42/items` |

Guidelines:

- **Plural nouns** for collections: `/products`, `/products/{id}`.
- **Hierarchy for ownership**, at most one or two levels: `/customers/7/orders`. Deeper nesting becomes brittle; use query filters instead (`/orders?customerId=7`).
- **Lower-case, hyphenated** paths: `/order-items`, not `/orderItems`.
- **No verbs in paths** — except for actions that are not CRUD, which can be modelled as sub-resources or controller-style endpoints: `POST /orders/42/cancellation` or `POST /orders/42/cancel`. Both are seen in practice; be consistent.
- **Filtering, sorting, pagination via query parameters:** `/orders?status=SHIPPED&sort=createdAt,desc&page=0&size=20`.
- **Representations are not tables:** a resource can combine several tables, or one table can back several resources.

## HATEOAS Awareness

**Hypermedia As The Engine Of Application State**: responses include links describing what the client can do next, so clients navigate the API like a website rather than hard-coding URLs.

```json
{
  "id": 42,
  "status": "PLACED",
  "_links": {
    "self":   { "href": "/api/orders/42" },
    "cancel": { "href": "/api/orders/42/cancellation" },
    "items":  { "href": "/api/orders/42/items" }
  }
}
```

The `cancel` link appears only while cancellation is allowed — the server drives the state transitions. **Spring HATEOAS** (`spring-boot-starter-hateoas`) provides `EntityModel`, `CollectionModel` and link builders.

In practice, most public and internal APIs stop short of HATEOAS (Richardson Maturity Model level 2): resources + HTTP methods + status codes. Know what it is and why it is rarely fully implemented (client tooling, OpenAPI-driven development).

### Richardson Maturity Model

| Level | Description | Example |
|-------|-------------|---------|
| 0 | One endpoint, one method; RPC over HTTP | `POST /api` with an action in the body |
| 1 | Resources (many URIs) | `POST /orders/42` for everything |
| 2 | Resources + HTTP methods + status codes | `GET/POST/PUT/DELETE /orders` — most "REST" APIs |
| 3 | + Hypermedia controls (HATEOAS) | Responses with links |

## Common Mistakes

- Verbs in URIs and `POST` for everything.
- Returning 200 with `{"error": "..."}` for failures.
- Storing per-client state in server memory (sessions) in an API meant to scale horizontally.
- Exposing database structure directly (`/tbl_order_master`).

## Common Interview Traps

- **"REST = JSON over HTTP."** REST is an architectural style; JSON and HTTP are common choices, not the definition.
- **"Stateless means the server stores no data."** It means no client *session* state between requests.
- **"REST is a protocol like SOAP."** SOAP is a protocol with a specification; REST is a set of constraints.

## Key Takeaways

- REST: resources identified by URIs, manipulated through representations with uniform HTTP methods, stateless requests, cacheable responses.
- Nouns in paths, plural collections, HTTP methods as verbs, query parameters for filtering/sorting/paging.
- HATEOAS (level 3) adds links that drive state transitions; most APIs are level 2.
