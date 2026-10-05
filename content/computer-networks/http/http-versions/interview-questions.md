# HTTP/1.1, HTTP/2 and HTTP/3 — Interview Questions

## Beginner

### Q1. What are the main differences between HTTP/1.1 and HTTP/2?

**Style:** Comparison

<details>
<summary>Answer</summary>

HTTP/1.1 is text-based and processes one request at a time per connection (browsers open about six connections per host to compensate). HTTP/2 uses binary frames, multiplexes many concurrent streams over a single TCP connection, compresses headers with HPACK and supports prioritisation. Methods, status codes and headers are unchanged.

</details>

### Q2. What is HTTP keep-alive?

<details>
<summary>Answer</summary>

Reusing one TCP (and TLS) connection for multiple requests instead of opening a new one per request. It is the default in HTTP/1.1 and saves the handshake round trips and slow-start ramp-up for every request after the first.

</details>

## Intermediate

### Q3. What is head-of-line blocking, and which versions suffer from it?

<details>
<summary>Answer</summary>

When one delayed item blocks everything queued behind it. HTTP/1.1 has it at the HTTP level: responses on a connection are returned in order, so a slow one blocks the rest. HTTP/2 removes that with multiplexing but still has it at the TCP level: a single lost TCP segment stalls all streams until it is retransmitted. HTTP/3 over QUIC removes it across streams, because each stream is delivered independently.

</details>

### Q4. Why does HTTP/3 run over UDP?

**Style:** Why

<details>
<summary>Answer</summary>

To get independent streams without TCP's in-order byte stream, to combine the transport and TLS 1.3 handshakes (1 RTT, 0-RTT on resumption), to support connection migration via connection IDs, and to deploy changes in user space — TCP is implemented in OS kernels and constrained by middleboxes, while UDP passes through almost everywhere. QUIC adds reliability and congestion control itself.

</details>

## Advanced

### Q5. A browser talks HTTP/3 to your CDN, but your Spring Boot app only supports HTTP/1.1. Does that work?

**Style:** Scenario

<details>
<summary>Answer</summary>

Yes. HTTP versions are negotiated per hop: the browser↔CDN connection uses HTTP/3 (QUIC), the CDN or load balancer terminates it and opens its own HTTP/1.1 (or HTTP/2) connections to the origin. The request semantics — method, path, headers, body — are translated unchanged.

</details>

### Q6. Why might HTTP/2 perform worse than HTTP/1.1 on a lossy mobile network?

<details>
<summary>Answer</summary>

HTTP/2 puts all requests on one TCP connection. Each packet loss stalls every stream (TCP head-of-line blocking) and halves that single connection's congestion window. HTTP/1.1 with six connections spreads the loss: only one connection stalls and backs off. HTTP/3's independent QUIC streams address this.

</details>
