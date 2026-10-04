# API Versioning and REST API Best Practices — Practice

### P1. Breaking or not?

**Difficulty:** Easy · **Type:** MCQ

Which change requires a new major API version?

- A) Adding a `trackingUrl` field to the order response
- B) Adding a new endpoint `GET /api/orders/{id}/invoice`
- C) Renaming `total` to `totalAmount` in the order response
- D) Adding an optional `couponCode` request field

<details>
<summary>Answer</summary>

**Answer:** C) Renaming `total` to `totalAmount` in the order response

**Explanation:** Clients reading `total` break; the other changes are additive.

</details>

### P2. Choose a strategy

**Difficulty:** Medium · **Type:** Scenario

Your API is consumed by a public mobile app and accessed through a CDN that caches GET responses. Which versioning strategy do you choose and why?

<details>
<summary>Answer</summary>

URI path versioning (`/api/v2/...`): each version has distinct URLs, so CDN caching works without `Vary` headers, routing at gateways is simple, and mobile developers see the version explicitly. Header versioning would require `Vary: API-Version` to avoid serving the wrong cached version.

</details>

### P3. Review the API

**Difficulty:** Medium · **Type:** Code analysis

An endpoint `GET /api/getOrdersOfUser?userId=17` returns all orders (thousands) as entities, returns 200 with `{"error":"not found"}` when the user does not exist, and allows any logged-in user to pass any `userId`. List the fixes.

<details>
<summary>Answer</summary>

Resource naming: `GET /api/users/17/orders` (or `/api/me/orders` for the caller). Paginate with a max size. Return DTOs. Return 404 via global exception handling with a ProblemDetail body. Enforce object-level authorisation: only the user themselves (or an admin) may read their orders.

</details>

### P4. Rate limit response

**Difficulty:** Easy · **Type:** Conceptual

What should an API return when a client exceeds its rate limit?

<details>
<summary>Answer</summary>

429 Too Many Requests with a `Retry-After` header (seconds or a date), and optionally rate-limit headers describing the limit and remaining quota, plus a ProblemDetail body.

</details>
