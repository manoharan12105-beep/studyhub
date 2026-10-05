# HTTP Methods, Safety, Idempotency and REST — Interview Questions

## Beginner

### Q1. What are the common HTTP methods and what do they do?

<details>
<summary>Answer</summary>

GET reads a resource; HEAD is GET without the body; POST creates a resource or triggers processing; PUT replaces a resource at a known URL; PATCH partially updates it; DELETE removes it; OPTIONS asks what is supported (used for CORS preflight).

</details>

### Q2. What does idempotent mean? Which methods are idempotent?

<details>
<summary>Answer</summary>

Making the same request once or many times has the same effect on the server's state. GET, HEAD, OPTIONS, PUT and DELETE are idempotent; POST is not; PATCH is not guaranteed (it depends on the patch). The response may differ (DELETE: 204 then 404) — the state does not.

</details>

## Intermediate

### Q3. What is the difference between PUT and PATCH? And PUT and POST?

**Style:** Comparison

<details>
<summary>Answer</summary>

PUT sends a full replacement of the resource at the target URL (missing fields are reset) and is idempotent; PATCH sends only changes and is not guaranteed idempotent. POST targets a collection and the server assigns the new resource's identity — repeating it creates duplicates; PUT targets the resource URL the client already knows, so repeating it leaves the same state.

</details>

### Q4. Why does idempotency matter for networking?

**Style:** Why

<details>
<summary>Answer</summary>

Networks fail mid-request: a timeout does not tell the client whether the server processed the request. Idempotent requests can be retried safely — and clients, proxies and load balancers do retry them automatically. Retrying a non-idempotent POST may duplicate an order or a payment, so such APIs use idempotency keys.

</details>

### Q5. What is a safe method?

<details>
<summary>Answer</summary>

One that does not change server state — GET, HEAD, OPTIONS (and TRACE). Safe methods can be cached, prefetched and followed by crawlers. Every safe method is idempotent, but not every idempotent method is safe (PUT, DELETE).

</details>

## Advanced

### Q6. A mobile client sends `POST /payments`; the connection drops before the response. How do you design the API so the client can retry without charging twice?

**Style:** Scenario

<details>
<summary>Answer</summary>

Require an `Idempotency-Key` header (a client-generated UUID per logical payment). The server stores the key with the request fingerprint and the resulting response (in a table with a unique constraint, within the payment transaction). A retry with the same key returns the stored response instead of charging again; the same key with a different body is rejected. Keys expire after a retention window.

</details>
