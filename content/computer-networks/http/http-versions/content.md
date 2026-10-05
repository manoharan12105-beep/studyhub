# HTTP/1.1, HTTP/2 and HTTP/3

**Module:** HTTP · **Interview priority:** Frequently asked

## What Is It?

The meaning of HTTP — methods, status codes, headers — has stayed the same since the 1990s. What changed across versions is **how messages are carried** over the network:

| Version | Year | Transport | Format | Requests per connection |
|---------|------|-----------|--------|-------------------------|
| HTTP/1.0 | 1996 | TCP | Text | One (new connection per request by default) |
| **HTTP/1.1** | 1997 (RFC 9112 today) | TCP | Text | Many, **one at a time** (keep-alive) |
| **HTTP/2** | 2015 | TCP (+TLS in practice) | **Binary frames** | Many, **in parallel** (multiplexed streams) |
| **HTTP/3** | 2022 | **QUIC over UDP** | Binary frames | Many, in parallel, **independent streams** |

## Why It Exists

Web pages grew from one HTML file to hundreds of resources, and APIs became chatty. Each version attacks the cost of connections and round trips: HTTP/1.1 reused connections, HTTP/2 removed one-at-a-time ordering, and HTTP/3 removed TCP's head-of-line blocking and sped up the handshake.

## How It Works

### HTTP/1.0 → HTTP/1.1

- **Persistent connections** (keep-alive) by default: no new TCP (and TLS) handshake for every request.
- **Host header** mandatory → virtual hosting.
- Chunked transfer encoding, caching improvements (ETag, Cache-Control), more methods.

**Limitation — head-of-line blocking at the HTTP level:** on one connection, the responses come back **in order**; a slow response blocks those behind it. Pipelining (sending several requests without waiting) existed but was broken in practice and disabled. Browsers work around it by opening **about 6 parallel connections per host**, and sites used hacks: domain sharding, sprite images, bundling.

### HTTP/2

```text
HTTP/1.1 (one connection):   [req1]──►[resp1]  [req2]──►[resp2]  [req3]──►[resp3]
HTTP/2   (one connection):   stream 1 ▓▓░░▓▓   stream 3 ▓░▓▓░   stream 5 ▓▓▓░  frames interleaved
```

- **Binary framing:** messages are split into frames tagged with a **stream ID**.
- **Multiplexing:** many requests and responses travel **concurrently** on **one** TCP connection; a slow response no longer blocks others at the HTTP level.
- **Header compression (HPACK):** repeated headers (cookies, user agent) are sent as small references.
- **Stream prioritisation** and **server push** (push was little used and removed by major browsers).
- In browsers, HTTP/2 is used only over TLS (negotiated via **ALPN** during the TLS handshake — the `ALPN: server accepted h2` line in `curl -v`).

**Remaining limitation — TCP head-of-line blocking:** all streams share one TCP byte stream. If one TCP segment is lost, **every** stream waits until it is retransmitted, because TCP delivers bytes strictly in order. On lossy networks (mobile), HTTP/2 can be worse than several HTTP/1.1 connections.

### HTTP/3 over QUIC

- **QUIC** is a transport protocol built on **UDP**, implementing reliability, congestion control and streams itself, with **TLS 1.3 built in**.
- **Independent streams:** a lost packet only delays the stream it belongs to.
- **Faster setup:** transport + TLS handshake in **1 RTT**; **0-RTT** when resuming a known server.
- **Connection migration:** connections are identified by a connection ID, not the 4-tuple, so a phone switching from Wi-Fi to 4G keeps its connection.
- Discovered via the `Alt-Svc` response header or DNS (HTTPS records); clients fall back to HTTP/2 if UDP 443 is blocked.

## Comparison

| | HTTP/1.1 | HTTP/2 | HTTP/3 |
|---|----------|--------|--------|
| Transport | TCP | TCP | QUIC (UDP) |
| Encoding | Text | Binary frames | Binary frames |
| Concurrency on one connection | One request at a time | Multiplexed streams | Multiplexed, independent streams |
| Head-of-line blocking | HTTP level and TCP level | TCP level only | None across streams |
| Header compression | No | HPACK | QPACK |
| Handshake before first request (new HTTPS) | TCP + TLS (2 RTT with TLS 1.3) | Same as 1.1 | 1 RTT (0-RTT on resumption) |
| Encryption | Optional (HTTPS) | Effectively required by browsers | Always (TLS 1.3 built in) |
| Typical connections per host | ~6 | 1 | 1 |

## Real World

- **Backend services:** gRPC runs on HTTP/2. Spring Boot's embedded Tomcat supports HTTP/2 with `server.http2.enabled=true` (with TLS for browsers; `h2c` cleartext for internal traffic). Java's `HttpClient` speaks HTTP/2 by default and falls back to 1.1.
- **Load balancers/CDNs** commonly speak HTTP/2 or HTTP/3 to browsers and HTTP/1.1 to the backend — the version is per connection (per hop), not end to end.
- Many 1.1-era optimisations (domain sharding, concatenating everything into one file) are counter-productive with HTTP/2.

## Common Traps

- **"HTTP/2 changed the methods and status codes."** Semantics are identical; only the wire format and connection handling changed.
- **"HTTP/2 removed head-of-line blocking."** At the HTTP level yes; at the TCP level no — HTTP/3 fixes that.
- **"HTTP/3 is unreliable because it uses UDP."** QUIC provides reliability on top of UDP.
- **"The client and the backend use the same HTTP version."** Each hop (browser→CDN, CDN→LB, LB→app) negotiates its own.

## Interview Follow-up

- *"HTTP/1.1 vs HTTP/2?"* Text vs binary; one request at a time vs multiplexed streams on one connection; no vs HPACK header compression.
- *"Why does HTTP/3 use UDP?"* To escape TCP's head-of-line blocking and ossified middleboxes/kernels, and to merge transport and TLS handshakes.

## Key Takeaways

- HTTP/1.1: persistent connections, text, one request at a time per connection (≈6 connections per host).
- HTTP/2: binary frames, multiplexing on one TCP connection, HPACK; still suffers TCP head-of-line blocking.
- HTTP/3: QUIC over UDP, independent streams, TLS 1.3 built in, 1-RTT/0-RTT setup, connection migration.
- Semantics (methods, codes, headers) are the same in every version.
