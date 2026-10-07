# HTTP and HTTPS for System Design

**Module:** Communication and APIs · **Interview priority:** Frequently asked

## What Is It?

**HTTP** is the request–response protocol almost every API and website speaks. A client sends a request (method, path, headers, optional body); the server returns a response (status code, headers, optional body). **HTTPS** is HTTP inside a **TLS** connection, which encrypts the traffic and proves the server's identity with a certificate.

```http
GET /api/v1/feed?limit=20 HTTP/1.1
Host: photoapp.example.com
Authorization: Bearer eyJhbGciOi...
Accept: application/json
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: private, max-age=30

{"items":[...],"nextCursor":"c2V0OjQy"}
```

Deeper protocol coverage lives in Computer Networks: [HTTP Fundamentals](../../../computer-networks/http/http-fundamentals/content.md) and [TLS and HTTPS](../../../computer-networks/https-and-tls/tls-handshake-and-https/content.md).

## Why It Exists

A shared, simple protocol means any client (browser, phone, another service, any language) can talk to any server, and infrastructure in between — load balancers, caches, CDNs, gateways — can understand and act on the traffic. HTTPS makes that safe on untrusted networks: on shared Wi-Fi, anyone could otherwise read passwords and tokens.

## How It Works

### What system designers use from HTTP

| Feature | Why it matters in a design |
|---------|---------------------------|
| **Methods** (GET, POST, PUT, PATCH, DELETE) | GET is safe and cacheable; GET, PUT and DELETE are **idempotent**, so they can be retried; POST is not ([Idempotency](../../reliability/idempotency-in-distributed-systems/content.md)) |
| **Status codes** | Tell clients and proxies what happened: retry on 503, do not retry on 400 |
| **Headers** | `Cache-Control` and `ETag` drive browser and CDN caching; `Authorization` carries credentials; `X-Forwarded-For` carries the client IP through proxies |
| **Statelessness** | Each request stands alone, which keeps servers interchangeable |

### Where TLS ends: TLS termination

Encrypting and decrypting costs CPU, and an L7 load balancer must decrypt traffic to read paths and headers. Common layouts:

```text
Edge termination:   client ══TLS══► load balancer ──plain HTTP──► app servers   (private network)
Re-encryption:      client ══TLS══► load balancer ══TLS══► app servers           (zero-trust / compliance)
Passthrough (L4):   client ══TLS═════════════════════════► app servers           (LB cannot read HTTP)
```

Termination at the edge simplifies certificates (one place to renew) and offloads CPU; re-encryption protects traffic inside the data centre.

### Versions in one table

| Version | Key idea | Design consequence |
|---------|----------|-------------------|
| HTTP/1.1 | One request at a time per connection (keep-alive reuses it) | Browsers open several connections per host; slow responses block others on the same connection |
| HTTP/2 | Many concurrent streams multiplexed over one TCP connection, compressed headers | Fewer connections; but one lost TCP packet stalls all streams |
| HTTP/3 | HTTP over QUIC (UDP), streams independent, faster handshakes | Better on lossy mobile networks; connections survive network changes |

**Think about it:** a mobile client times out on `POST /orders` and does not know whether the order was created. Can it safely retry? What does the API need?

<details>
<summary>Answer</summary>

Not safely by default: POST is not idempotent, so a retry may create a second order. The API should accept an **idempotency key** (a unique ID the client generates per order attempt, sent in a header). The server stores the result per key, and a retry with the same key returns the original result instead of creating a duplicate.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** "HTTPS makes an API secure." TLS protects data in transit and authenticates the server. It does nothing for authentication of users, authorisation, input validation or rate limiting.

## Interview Follow-up

- *"Where would you terminate TLS?"* At the load balancer or edge (CDN/gateway) for simplicity and performance, re-encrypting to backends when policy requires encryption inside the network.

## Key Takeaways

- HTTP is a stateless request–response protocol; methods, status codes and headers carry meaning that infrastructure acts on.
- GET, PUT and DELETE are idempotent and safe to retry; POST needs idempotency keys.
- HTTPS = HTTP over TLS: encryption and server identity. TLS is usually terminated at the load balancer or edge.
- HTTP/2 multiplexes requests on one connection; HTTP/3 runs on QUIC and avoids TCP head-of-line blocking.
