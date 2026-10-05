# Caching and CDNs

**Module:** Performance and Distributed Networking · **Interview priority:** Frequently asked

## What Is It?

- **Caching** stores a copy of a response (or data) closer to where it is needed, so later requests skip the network trip or the expensive work.
- A **CDN** (Content Delivery Network) is a globally distributed network of **edge servers** (points of presence, PoPs) that cache content near users and forward the rest to your **origin** server.

## Why It Exists

The fastest request is the one you do not send; the next fastest travels the shortest distance. A user in Chennai fetching images from a server in Virginia pays ~250 ms per round trip; from a CDN edge in Chennai, a few milliseconds. Caches also absorb load — the origin serves a file once instead of a million times — and help survive traffic spikes and DDoS attacks.

## How It Works

### Cache layers in a typical request

```text
Browser cache ─► (service worker) ─► CDN edge ─► reverse proxy cache ─► application cache (Redis/Caffeine) ─► database
   private          private            shared         shared                 shared                         source of truth
```

Each layer that has a fresh copy answers immediately; a **miss** passes the request on.

### HTTP caching rules

Caches decide using response headers ([HTTP Headers](../../http/http-headers-cookies-and-sessions/content.md)):

| Header | Effect |
|--------|--------|
| `Cache-Control: max-age=3600` | Fresh for 1 hour — reuse without asking |
| `Cache-Control: s-maxage=600` | Freshness for **shared** caches (CDNs, proxies) only |
| `Cache-Control: no-cache` | Store, but **revalidate** before each use |
| `Cache-Control: no-store` | Never store (personal/sensitive data) |
| `Cache-Control: private` | Only the browser may store it, not CDNs |
| `ETag` + `If-None-Match` | Revalidation: server answers **304 Not Modified** (no body) if unchanged |
| `Vary: Accept-Encoding` | Cache separate copies per header value |

**Revalidation flow:**

```text
1st request:  GET /logo.png          ← 200 OK, ETag: "v7", Cache-Control: max-age=60
after 60 s:   GET /logo.png, If-None-Match: "v7"   ← 304 Not Modified (tiny, no body)
```

### CDN request flow

```text
User (Chennai) ── DNS: cdn.example.com → nearest edge (anycast or geo-DNS)
   │
   ▼
Edge PoP Chennai ── cache HIT  → respond in ~5 ms
                 └─ cache MISS → fetch from origin (Virginia, ~250 ms), store per Cache-Control, respond
```

CDNs also:

- **Terminate TLS** close to the user (handshake round trips become short) and keep warm connections to the origin.
- Serve **HTTP/2 and HTTP/3** to users even if the origin speaks HTTP/1.1.
- Absorb **DDoS** traffic across many PoPs; provide a WAF.
- Run small code at the edge (edge functions) for redirects, headers, A/B tests.

### What to cache

| Content | Strategy |
|---------|----------|
| Static assets with versioned names (`app.3f9a1c.js`) | `public, max-age=31536000, immutable` — cache "forever"; a new version gets a new name |
| Images, videos, downloads | Long `max-age` on the CDN |
| HTML pages | Short `max-age` or `no-cache` + ETag |
| Public API data (product catalogue) | Short `s-maxage` (seconds to minutes) |
| Personal API responses (`/api/me`) | `private` or `no-store` — **never** in a shared cache |

### Cache invalidation

Hard because copies are everywhere. Options: wait for expiry (TTL), **purge** at the CDN, or — best for assets — **versioned URLs** so nothing needs invalidating. Applications caching data (Redis, Spring `@Cacheable`) must evict or update entries when the data changes.

## Real World

- Spring Boot static resources: `spring.web.resources.cache.cachecontrol.max-age` and content-hash versioning (`spring.web.resources.chain.strategy.content.enabled=true`).
- API responses can return `ETag`s (Spring's `ShallowEtagHeaderFilter`) so clients get cheap 304s.
- A misconfigured CDN caching `/api/account` without `private` once served one user's data to others — classic incident; always set Cache-Control explicitly on APIs.

## Common Traps

- **"CDNs are only for images."** They accelerate TLS, cache APIs where safe, and protect origins.
- **"no-cache means no caching."** It means revalidate before reuse.
- **"Caching personalised responses at the CDN is fine with a short TTL."** Any shared caching of personal data is a data leak; use `private`/`no-store`.
- **"A 304 contains the resource."** It has no body; the client uses its stored copy.

## Interview Follow-up

- *"How does a CDN reduce latency?"* Shorter distance (edge near users), cached responses, TLS termination at the edge, reused connections to the origin.
- *"How do you deploy a new JS file when browsers cache it for a year?"* Versioned file names referenced from short-cached HTML.

## Key Takeaways

- Caches at the browser, CDN, proxy and application avoid round trips and load.
- Cache-Control (max-age, s-maxage, no-cache, no-store, private) and ETag/304 control HTTP caching.
- A CDN serves from edges near users, terminates TLS, absorbs spikes and attacks; misses go to the origin.
- Invalidation: TTLs, purges, or versioned URLs (best for static assets). Never share-cache personal data.
