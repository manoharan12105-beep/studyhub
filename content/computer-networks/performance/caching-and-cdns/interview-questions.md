# Caching and CDNs — Interview Questions

## Beginner

### Q1. What is a CDN and how does it improve performance?

<details>
<summary>Answer</summary>

A Content Delivery Network is a set of edge servers distributed worldwide that cache content close to users and forward cache misses to the origin server. It reduces latency (shorter distance, TLS terminated nearby, warm connections to the origin), reduces origin load and bandwidth, and absorbs traffic spikes and DDoS attacks.

</details>

## Intermediate

### Q2. What happens on a CDN cache miss?

**Style:** What happens internally

<details>
<summary>Answer</summary>

The edge forwards the request to the origin (often over an already-open, optimised connection), receives the response, stores it if its Cache-Control headers allow (for `s-maxage`/`max-age`), and returns it to the user. Later requests at that edge are served from cache until the copy expires or is purged; then the edge revalidates (ETag/If-Modified-Since → 304) or refetches.

</details>

### Q3. How does HTTP revalidation with ETag work?

<details>
<summary>Answer</summary>

The server returns an `ETag` (a version identifier) with the resource. When the cached copy is stale, the client sends `If-None-Match: "<etag>"`. If the resource has not changed, the server replies `304 Not Modified` with no body and the client keeps using its copy; otherwise it sends `200` with the new content and a new ETag.

</details>

### Q4. How do you ensure users get a new version of a JavaScript file that browsers cache for a year?

**Style:** Scenario

<details>
<summary>Answer</summary>

Use content-hashed file names (`app.3f9a1c.js`) with `Cache-Control: public, max-age=31536000, immutable`, and reference them from HTML that is cached briefly or revalidated (`no-cache`). A new build produces a new file name, so the updated HTML points to a URL no cache has seen.

</details>

## Advanced

### Q5. A CDN accidentally served one user's account page to another user. What went wrong and how do you prevent it?

**Style:** Debugging

<details>
<summary>Answer</summary>

A personalised response was stored in a shared cache — the response lacked `Cache-Control: private`/`no-store` (or the CDN was configured to cache everything for a path), and the cache key ignored the user's session. Prevent it by setting explicit `private`/`no-store` on authenticated responses, configuring the CDN to bypass caching when `Authorization`/session cookies are present, and caching only explicitly public routes.

</details>
