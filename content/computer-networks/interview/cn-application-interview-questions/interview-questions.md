# HTTP, HTTPS, DNS and Backend Networking — Interview Questions

## Beginner

### Q1. HTTP vs HTTPS?

**Style:** Comparison

<details>
<summary>Answer</summary>

HTTPS is HTTP inside TLS (port 443 instead of 80): the traffic is encrypted, tamper-evident, and the server is authenticated with a CA-signed certificate. HTTP is clear text and unauthenticated. HTTPS adds a TLS handshake (1 RTT with TLS 1.3), reduced by connection reuse and resumption.

</details>

### Q2. What are idempotent HTTP methods, and why does it matter?

**Style:** Why

<details>
<summary>Answer</summary>

GET, HEAD, OPTIONS, PUT and DELETE: repeating them leaves the server in the same state. POST is not; PATCH is not guaranteed. It matters because after a network timeout the client cannot know whether the request was processed — idempotent requests can be retried safely (and are retried automatically by clients/proxies); POST needs idempotency keys.

</details>

### Q3. 401 vs 403?

**Style:** Comparison

<details>
<summary>Answer</summary>

401 Unauthorized: not authenticated — missing, invalid or expired credentials. 403 Forbidden: authenticated but not permitted. In Spring Security, a missing/invalid JWT gives 401; a valid JWT without the required role gives 403.

</details>

## Intermediate

### Q4. HTTP/1.1 vs HTTP/2 vs HTTP/3?

**Style:** Comparison

<details>
<summary>Answer</summary>

HTTP/1.1: text, keep-alive, one request at a time per connection (browsers open ~6). HTTP/2: binary frames, multiplexed streams on one TCP connection, HPACK header compression — but TCP head-of-line blocking remains. HTTP/3: QUIC over UDP, independent streams, TLS 1.3 built in, 1-RTT (0-RTT resumed) setup, connection migration. Semantics are the same in all.

</details>

### Q5. Walk through the TLS 1.3 handshake.

**Style:** What happens internally

<details>
<summary>Answer</summary>

ClientHello (versions, ciphers, key share, SNI, ALPN) → ServerHello (chosen cipher, key share); both derive keys via ECDHE; the server sends its certificate chain, CertificateVerify (signature with its private key) and Finished; the client validates the chain, hostname and signature, sends Finished; encrypted application data follows with symmetric session keys. One round trip.

</details>

### Q6. How does DNS resolution work, and what is the difference between recursive and iterative queries?

**Style:** How

<details>
<summary>Answer</summary>

The stub resolver sends a recursive query to a recursive resolver, which (on a cache miss) queries root servers → TLD servers → authoritative servers iteratively, following referrals, then caches the answer for its TTL and returns it. Recursive: "give me the final answer"; iterative: "give me the answer or a referral".

</details>

### Q7. Cookies vs sessions vs JWT?

**Style:** Comparison

<details>
<summary>Answer</summary>

A cookie is browser storage sent automatically on each request. A session keeps user state on the server, found through a session-ID cookie — easy to revoke, needs a shared store with several instances. A JWT is a signed, self-contained token (often in the `Authorization` header) that any instance can verify without a store — scalable, harder to revoke (short lifetimes + refresh tokens).

</details>

### Q8. L4 vs L7 load balancing?

**Style:** Comparison

<details>
<summary>Answer</summary>

L4 balances TCP/UDP connections by IP/port without reading payloads — fast, protocol-agnostic, TLS usually passed through. L7 terminates TLS and balances individual HTTP requests by path, host, headers or cookies, can add `X-Forwarded-For`, rewrite, cache and rate-limit — more features, more CPU.

</details>

### Q9. How does a CDN make a site faster?

**Style:** How

<details>
<summary>Answer</summary>

Edge servers near users serve cached content with short RTTs; TLS terminates close to the user; the edge keeps warm connections to the origin for misses; it offloads bandwidth and requests from the origin and absorbs spikes and DDoS. Cache-Control headers decide what may be cached.

</details>

## Advanced

### Q10. Behind a load balancer, your Spring Boot app logs the LB's IP for every request and builds `http://` redirect URLs. Explain and fix.

**Style:** Debugging

<details>
<summary>Answer</summary>

The LB terminates the client's HTTPS connection and opens its own plain-HTTP connection to the app, so the TCP peer is the LB and the scheme seen is http. The LB passes the original values in `X-Forwarded-For` and `X-Forwarded-Proto`. Set `server.forward-headers-strategy=native` (or `framework`) and trust these headers only from the LB.

</details>

### Q11. 502 vs 503 vs 504 behind a load balancer?

**Style:** Comparison

<details>
<summary>Answer</summary>

502: the backend returned an invalid response or closed/reset the connection (crash, restart, keep-alive mismatch). 503: no healthy backend or the service is overloaded/in maintenance. 504: the backend did not answer within the LB's timeout (slow request, blocked threads, slow DB).

</details>

### Q12. Why should a service reuse one HTTP client instance instead of creating one per request?

**Style:** Why

<details>
<summary>Answer</summary>

A shared client keeps a connection pool, so requests reuse established TCP+TLS connections (no handshake RTTs, warm congestion window). A new client per request opens a new connection each time, adding latency and CPU, leaving many sockets in TIME_WAIT and risking ephemeral port exhaustion.

</details>

### Q13. Follow-up chain: "You changed an A record but users still hit the old server. Why? … How do you plan the next change?"

**Style:** Follow-up

<details>
<summary>Answer</summary>

Resolvers, OS and browsers cached the old record and will use it until its TTL expires — there is no push. Next time: lower the TTL well in advance (at least one old TTL before), make the change, keep the old server serving until traffic drains, then raise the TTL again; test the new server early with `curl --resolve`.

</details>
