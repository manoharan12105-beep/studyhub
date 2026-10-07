# The Journey of a Request

**Module:** Communication and APIs · **Interview priority:** Core

## What Is It?

When a user opens `photoapp.com` and their feed appears, one request travels through several components and back. Knowing every hop — what it does, how long it takes and how it can fail — is the backbone of every system design discussion.

```text
 ① Client ──► ② DNS ──► ③ Load balancer ──► ④ API server ──► ⑤ Cache ──(miss)──► ⑥ Database
    ▲                                              │                                  │
    └───────────────── ⑦ Response (JSON, then images from a CDN) ◄───────────────────┘
```

## Why It Exists

Latency is the sum of the hops, and availability is the product of them. You cannot reason about "the feed is slow" or "what happens if the cache dies" without knowing the path.

## How It Works

| Step | What happens | Typical time | What can go wrong |
|------|--------------|--------------|-------------------|
| ① Client | The app builds `GET /api/feed` with the user's token | — | Flaky mobile network, retries |
| ② DNS | `photoapp.com` → the load balancer's IP. Usually answered from a cache (browser, OS, resolver) | 0 ms cached; 20–100 ms uncached | DNS outage, stale record after a change |
| Connect | TCP handshake + TLS handshake with the load balancer (reused on later requests) | 1–2 round trips | Certificate errors, packet loss |
| ③ Load balancer | Terminates TLS, picks a healthy API server | < 1 ms | Balancer overloaded or down (needs redundancy) |
| ④ API server | Verifies the token, runs business logic | 1–10 ms CPU | Server overloaded, bug, slow dependency |
| ⑤ Cache | Looks up `feed:alan`. **Hit** → answer in about a millisecond | ~1 ms | Cache down → all traffic falls on the database |
| ⑥ Database | On a **miss**: query follows + recent photos, sorted by time; result written back to the cache | 5–50 ms+ | Slow query, lock contention, connection limit |
| ⑦ Response | JSON travels back the same way; the client then fetches images from a CDN edge near the user | One round trip per hop back | Large payloads on slow networks |

### Latency vs bandwidth

- **Latency** is how long one round trip takes — the delay before the first byte arrives. Limited by distance (light in fibre covers about 200 km per millisecond) and the number of hops.
- **Bandwidth** is how much data can flow per second once the transfer is going — the width of the pipe.

A feed of 30 small thumbnails fetched one after another from a server across the planet is slow even on fast Wi-Fi: it pays 30 round trips of latency, not a bandwidth limit. That is why systems fight **round trips**: caches skip the trip to the database, CDNs answer from nearby, connection reuse (keep-alive, HTTP/2) skips repeated handshakes, and APIs batch data into fewer requests.

**Think about it:** the user is in Mumbai and the only servers are in Virginia (about 200 ms round trip). The page needs a TCP handshake, a TLS 1.3 handshake, the API call and then 4 more sequential API calls. Roughly how long before the page has its data?

<details>
<summary>Answer</summary>

TCP (1 RTT) + TLS 1.3 (1 RTT) + 5 sequential API calls (5 RTT) = 7 round trips ≈ **1.4 seconds** of pure network latency, before any server work. Fixes: serve from a closer region or edge, reuse connections, and replace sequential calls with one aggregated call.

</details>

### The write path differs

Writes (posting a photo) skip the cache lookup, go to the primary database, and usually **invalidate** cached entries that the write changed. Heavy follow-up work (thumbnails, notifying followers) goes to a queue. See [Caching Fundamentals](../../caching/caching-fundamentals/content.md) and [Message Queues](../../messaging/message-queues/content.md).

## What Can Fail

Every hop is a place to add a timeout, a retry policy and a fallback. Interviewers often ask "what happens if X is down?" for each hop: DNS (cached answers keep working until the TTL expires), load balancer (redundant pair), API server (others take over), cache (database must survive the extra load), database (failover to a replica).

## Common Traps

> [!WARNING]
> **Common trap:** "Faster internet fixes slow pages." Most slow pages are limited by latency and the number of sequential round trips, not by bandwidth.

## Interview Follow-up

- *"Walk me through what happens when a user opens the app."* Name each hop, what it does, and one failure mode for each — that answer frames the rest of the interview.

## Key Takeaways

- Client → DNS → load balancer → API server → cache → database → back, with images from a CDN.
- Latency adds up across hops; availability multiplies down across them.
- Latency (round-trip time) and bandwidth (pipe width) are different; most slowness comes from round trips.
- Caches, CDNs, connection reuse and batching all exist to cut round trips.
