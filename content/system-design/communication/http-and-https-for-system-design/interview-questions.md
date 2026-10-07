# HTTP and HTTPS for System Design — Interview Questions

## Beginner

### Q1. What does the S in HTTPS add?

**Style:** Direct

<details>
<summary>Answer</summary>

HTTPS runs HTTP inside TLS, which encrypts traffic so intermediaries cannot read or modify it, and authenticates the server with a certificate so clients know they are talking to the real site. It does not authenticate users or authorise actions.

</details>

### Q2. Why is HTTP described as stateless, and why is that useful?

**Style:** Why

<details>
<summary>Answer</summary>

Each request is self-contained: the protocol does not remember previous requests, so any state (a session, a token) must be sent with each request or stored server-side. This lets any server behind a load balancer handle any request, which is the basis of horizontal scaling.

</details>

## Intermediate

### Q3. What is TLS termination and where would you do it?

**Style:** Design

<details>
<summary>Answer</summary>

TLS termination is the point where encrypted traffic is decrypted. Doing it at the load balancer, API gateway or CDN edge centralises certificate management, offloads cryptographic CPU work from app servers, and lets the L7 balancer route by path and headers. If internal traffic must also be encrypted, the balancer re-encrypts to backends; with L4 passthrough, backends terminate TLS themselves.

</details>

### Q4. Which HTTP methods are idempotent, and why does it matter?

**Style:** Why

<details>
<summary>Answer</summary>

GET, HEAD, PUT, DELETE and OPTIONS are idempotent: repeating the request leaves the server in the same state. POST and PATCH are not guaranteed to be. It matters because networks fail ambiguously; clients, proxies and retry libraries can safely retry idempotent requests, while non-idempotent ones need idempotency keys to avoid duplicates.

</details>

### Q5. What changed from HTTP/1.1 to HTTP/2 and HTTP/3?

**Style:** Comparison

<details>
<summary>Answer</summary>

HTTP/1.1 handles one request at a time per connection, so clients open several connections. HTTP/2 multiplexes many concurrent streams over one TCP connection with header compression, but packet loss stalls all streams (TCP head-of-line blocking). HTTP/3 runs over QUIC on UDP with independent streams and faster handshakes, improving performance on lossy mobile networks.

</details>

## Advanced

### Q6. How does the backend see the real client IP when TLS is terminated at a load balancer?

**Style:** How

<details>
<summary>Answer</summary>

The load balancer opens its own connection to the backend, so the TCP source address is the balancer's. It adds headers such as `X-Forwarded-For` (client IP) and `X-Forwarded-Proto` (original scheme), or the standard `Forwarded` header; L4 balancers can use the PROXY protocol. The backend must trust these headers only from its own proxies, otherwise clients could forge them.

</details>
