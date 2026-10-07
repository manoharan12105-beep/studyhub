# REST vs SOAP vs GraphQL vs gRPC — Practice

### P1. Pick the style

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** gRPC

Which API style is the best fit for high-volume calls between internal microservices with strict latency budgets?

- A) SOAP
- B) gRPC
- C) GraphQL
- D) Email

<details>
<summary>Answer</summary>

**Answer:** B) gRPC

</details>

### P2. Data formats

**Difficulty:** Easy · **Type:** Comparison · **Concepts:** data formats

Match each style to its usual data format: REST, SOAP, GraphQL, gRPC — with XML, JSON, Protocol Buffers.

<details>
<summary>Answer</summary>

REST → JSON; SOAP → XML; GraphQL → JSON (responses); gRPC → Protocol Buffers.

</details>

### P3. Mobile screen

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** over- and under-fetching

A product screen makes four REST calls (product, seller, reviews, related items), each returning large objects. On slow networks it takes 3 s. Suggest two solutions, one using GraphQL and one without it.

<details>
<summary>Answer</summary>

GraphQL: a single query requesting only the needed fields of all four, resolved server-side in parallel. Without GraphQL: a backend-for-frontend endpoint (`GET /screens/product/{id}`) that aggregates the four calls server-side and returns a slim, screen-shaped payload — also one round trip.

</details>

### P4. Caching difference

**Difficulty:** Medium · **Type:** Trade-off · **Concepts:** HTTP caching

Why can a CDN cache `GET /products/42` easily but not a GraphQL query for the same product?

<details>
<summary>Answer</summary>

HTTP caches key responses by method and URL; a REST GET has a unique, stable URL. GraphQL typically sends POST requests to one `/graphql` URL with the query in the body, so the URL does not identify the data. Workarounds exist (persisted queries sent via GET with a hash, client-side normalised caches) but need extra setup.

</details>
