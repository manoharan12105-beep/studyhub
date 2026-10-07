# REST vs SOAP vs GraphQL vs gRPC — Interview Questions

## Beginner

### Q1. What is the main difference between REST and GraphQL?

**Style:** Comparison

<details>
<summary>Answer</summary>

REST exposes many endpoints, one per resource, each returning a fixed representation. GraphQL exposes one endpoint and a typed schema; the client sends a query describing exactly the fields and nested data it wants, and receives that shape in one response.

</details>

### Q2. Why is gRPC popular for communication between microservices?

**Style:** Why

<details>
<summary>Answer</summary>

Protocol Buffers are compact binary messages that are faster to serialise than JSON, HTTP/2 lets many calls share one connection with streaming support, and `.proto` contracts generate typed clients and servers in many languages, which keeps services compatible as they evolve.

</details>

## Intermediate

### Q3. What are over-fetching and under-fetching?

**Style:** Direct

<details>
<summary>Answer</summary>

Over-fetching is receiving more data than the client needs (a 30-field user object for a screen that shows a name). Under-fetching is needing several requests to assemble one screen (user, then posts, then comments). Both waste bandwidth and round trips, especially on mobile; GraphQL addresses both by letting the client specify the exact shape.

</details>

### Q4. What are the downsides of GraphQL?

**Style:** Trade-off

<details>
<summary>Answer</summary>

HTTP caching by URL does not work well (queries are usually POSTs to one endpoint), clients can send very expensive or deeply nested queries (needing depth and cost limits), naive resolvers cause N+1 database queries (needing batching), authorisation must be enforced per field, and monitoring is harder because every request hits the same endpoint.

</details>

### Q5. When would you still use SOAP?

**Style:** Scenario

<details>
<summary>Answer</summary>

When integrating with existing enterprise or financial systems that expose SOAP services and WS-* standards (formal WSDL contracts, WS-Security). New public APIs rarely choose it; a common approach is a middleware adapter that converts between SOAP/XML and the organisation's REST or event APIs.

</details>

## Advanced

### Q6. A browser front end needs data from services that speak gRPC. How do you connect them?

**Style:** Design

<details>
<summary>Answer</summary>

Browsers cannot make native gRPC calls (they lack the required HTTP/2 control), so put a translation layer in front: an API gateway or backend-for-frontend that exposes REST or GraphQL to the browser and calls the services over gRPC, or gRPC-Web through a proxy such as Envoy.

</details>

### Q7. How do you avoid the N+1 problem in a GraphQL server?

**Style:** How

<details>
<summary>Answer</summary>

Batch and cache data loading per request: resolvers request items by key, and a loader (such as DataLoader) collects all keys requested in the same tick and fetches them in one query (`WHERE id IN (...)`), caching results for the rest of that request. Also limit query depth and complexity.

</details>
