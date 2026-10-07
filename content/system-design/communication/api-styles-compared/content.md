# REST vs SOAP vs GraphQL vs gRPC

**Module:** Communication and APIs · **Interview priority:** Frequently asked

## What Is It?

Four common styles for exposing an API:

- **REST:** resources at URLs, standard HTTP methods, usually JSON. Many endpoints, one per resource.
- **SOAP (Simple Object Access Protocol):** XML messages in a strict envelope, described by a WSDL contract. Older; common in enterprise and banking integrations.
- **GraphQL:** one endpoint; the client sends a query describing exactly the fields it wants, and the server returns that shape.
- **gRPC:** remote procedure calls defined in Protocol Buffers (`.proto` files), sent in a compact binary format over HTTP/2, with generated client and server code. Built at Google; common between microservices.

## Why It Exists

Different consumers need different things. Public web APIs value simplicity and caching; mobile front ends value fetching exactly the right data in one round trip; internal services value speed and strict contracts; legacy enterprise systems value formal schemas and standards.

## How It Works

### The same request in each style

```http
GET /api/v1/users/42
```

```text
GraphQL (one POST to /graphql):
  query { user(id: 42) { name  avatarUrl  posts(last: 3) { title } } }

gRPC (generated stub, binary on the wire):
  UserServiceGrpc.newBlockingStub(channel).getUser(GetUserRequest.newBuilder().setId(42).build())

SOAP (XML envelope POSTed to one endpoint):
  <soap:Envelope><soap:Body><GetUser><Id>42</Id></GetUser></soap:Body></soap:Envelope>
```

### Over-fetching and under-fetching

A mobile profile screen needs a user's name, avatar and last three post titles.

- **REST:** `GET /users/42` returns 30 fields the screen ignores (over-fetching), then `GET /users/42/posts?limit=3` is a second round trip (under-fetching).
- **GraphQL:** one query returns exactly those fields.

GraphQL's flexibility has costs: responses are hard to cache by URL (everything is a POST to `/graphql`), a single query can be very expensive (deeply nested fields), so servers need query cost limits, and naive resolvers cause the **N+1 query problem** (one database query per item), solved with batching (for example a DataLoader).

### Why gRPC is fast between services

- **Protocol Buffers** are binary and much smaller and faster to parse than JSON or XML.
- **HTTP/2** multiplexes many calls on one connection and supports **streaming** in either or both directions.
- **Generated code** gives typed clients in many languages from one `.proto` contract, and the contract enforces compatibility rules.

The costs: not human-readable, limited direct browser support (needs a proxy such as gRPC-Web), and harder debugging with plain HTTP tools.

## Comparison

| Aspect | REST | SOAP | GraphQL | gRPC |
|--------|------|------|---------|------|
| Data format | JSON (usually) | XML | JSON | Protocol Buffers (binary) |
| Endpoints | Many (per resource) | One per service | One | Methods on services |
| Contract | Optional (OpenAPI) | Required (WSDL) | Required (schema) | Required (`.proto`) |
| Transport | HTTP/1.1 or 2 | HTTP (also others) | HTTP | HTTP/2 |
| HTTP caching | Excellent (GET + URL) | Poor | Poor (needs custom) | Poor |
| Streaming | Limited (SSE, chunked) | No | Subscriptions | Native, bidirectional |
| Best for | Public APIs, CRUD, web | Legacy enterprise, strict standards | Flexible front ends, many client types | Internal service-to-service, low latency |

**Think about it:** you are designing (a) a public API for third-party developers, (b) calls between 40 internal microservices with tight latency budgets, (c) a backend for web, iOS and Android apps that each need different slices of the same data. Which style for each?

<details>
<summary>Answer</summary>

(a) REST: easy to learn, works with any HTTP tool, cacheable. (b) gRPC: small binary messages, HTTP/2, typed contracts. (c) GraphQL (often as a gateway in front of internal services), so each client fetches exactly what it needs in one round trip.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** "GraphQL replaces REST everywhere." It shifts complexity to the server (query cost control, N+1, caching). Simple CRUD and public APIs are often better as REST.

- **"gRPC is only for Google-scale systems."** It suits any internal service mesh where typed contracts and low latency matter.

## Interview Follow-up

- *"Why would you put a GraphQL layer in front of microservices?"* To give front ends one endpoint that aggregates data from many services in one round trip, while services keep their own REST or gRPC APIs.

## Key Takeaways

- REST: resources + HTTP methods; simple and cacheable — the default for public APIs.
- SOAP: XML with strict contracts; mostly legacy integrations.
- GraphQL: one endpoint, client-shaped queries; solves over- and under-fetching, costs caching and query control.
- gRPC: binary Protocol Buffers over HTTP/2 with streaming and generated clients; ideal between services.
