# Block 2: Communication

Block 2 of 6, about ten minutes.

## 1. The Request Path (3 min)

- Client → DNS (cached; TTL) → LB → app → cache → DB → back; images from CDN. Latency adds, availability multiplies.
- Latency = round trip; bandwidth = pipe width. Slowness is mostly round trips: reuse connections, HTTP/2, fewer calls, CDN.
- DNS: resolver → root → TLD → authoritative. Short TTL for failover. DNS balancing is coarse.
- Connections cost handshakes and memory; every layer has limits; pool and reuse.

## 2. HTTP and REST (3 min)

- GET/PUT/DELETE idempotent; POST needs idempotency keys. TLS terminated at the edge.
- Nouns + methods; PUT replaces, PATCH modifies; path = identity, query = filter/sort/page, body = data/secrets.
- 201 created · 204 no content · **401 not authenticated · 403 not allowed** · 409 conflict · 429 rate limited · 503 overloaded.
- Return objects, not bare arrays. Add fields freely; version breaking changes. Cursor pagination for big or changing lists.

## 3. Protecting and Shaping APIs (2 min)

- Rate limiting: token bucket (bursts + average) default; fixed window allows 2× at boundaries; sliding window fixes it. Shared atomic counters across gateways; fail-open vs fail-closed.
- Styles: REST public · gRPC internal · GraphQL flexible clients (watch caching, N+1) · SOAP legacy.
- Proxies: forward = for clients; reverse = for servers; LB = reverse proxy; gateway = auth, limits, routing, aggregation (thin, redundant).

## 4. Real Time and the Edge (2 min)

- Polling (waste) · long polling · **SSE** (server → client) · **WebSockets** (both ways; stateful gateways, registry, least connections, jittered reconnects).
- CDN: edges near users; pull vs push; `Cache-Control`, `ETag`, versioned URLs; never cache personalised data publicly; origin shield for mass misses.
- Service discovery: registry + health; Kubernetes Services do it for you.
