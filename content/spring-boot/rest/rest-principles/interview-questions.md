# REST Principles and Resource Design — Interview Questions

## Beginner

### Q1. What is REST?

<details>
<summary>Answer</summary>

An architectural style in which a server exposes resources identified by URIs, and clients read and change them by exchanging representations (usually JSON) through a uniform interface — standard HTTP methods and status codes — with stateless requests and cacheable responses.

</details>

### Q2. What are the REST constraints?

<details>
<summary>Answer</summary>

Client–server separation, statelessness, cacheability, a uniform interface (resource identification, manipulation through representations, self-descriptive messages, hypermedia), a layered system, and optionally code on demand.

</details>

### Q3. What does "stateless" mean in REST?

<details>
<summary>Answer</summary>

The server keeps no client session state between requests; each request contains all information needed to process it (authentication token, parameters). Application data is still stored in databases. Statelessness lets any server instance handle any request, which simplifies load balancing and scaling.

</details>

## Intermediate

### Q4. How do you design URIs for a REST API?

<details>
<summary>Answer</summary>

Use nouns for resources and plural collection names (`/orders`, `/orders/{id}`), let HTTP methods express the action, nest only for clear ownership and shallowly (`/customers/{id}/orders`), use lower-case hyphenated segments, and put filtering, sorting and pagination in query parameters. Non-CRUD actions can be modelled as sub-resources (`POST /orders/{id}/cancellation`).

</details>

### Q5. What is HATEOAS, and why do few APIs implement it fully?

<details>
<summary>Answer</summary>

Hypermedia as the engine of application state: responses include links to related resources and allowed next actions, so clients follow links rather than constructing URLs, and the server can change URLs or allowed transitions. It is rarely implemented fully because most clients are written against a documented contract (OpenAPI), generic hypermedia clients are uncommon, and the extra payload and tooling cost provide limited benefit for internal APIs.

</details>

### Q6. What is the Richardson Maturity Model?

<details>
<summary>Answer</summary>

A way to grade how RESTful an HTTP API is: level 0 uses one endpoint for everything (RPC), level 1 introduces separate resources, level 2 uses HTTP methods and status codes properly, and level 3 adds hypermedia controls (HATEOAS). Most production APIs are level 2.

</details>

## Advanced

### Q7. Is a JWT-authenticated API stateless even though the user is "logged in"?

<details>
<summary>Answer</summary>

Yes, with respect to REST: the server stores no session for the user; every request carries a self-contained, signed token that the server validates independently. If the server keeps a token denylist or refresh-token table, there is some server-side state for security, but individual requests are still processed without a server-side session.

</details>

### Q8. How would you model "approve a leave request" in a resource-oriented way?

<details>
<summary>Answer</summary>

Options: `PATCH /leave-requests/{id}` with `{"status": "APPROVED"}` when approval is just a state change; or `POST /leave-requests/{id}/approval` creating an approval sub-resource (with approver, comment, timestamp) when approval has its own data and rules. Avoid `GET /approveLeave?id=…` — `GET` must be safe. Choose one style and use it consistently across the API.

</details>
