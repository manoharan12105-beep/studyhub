# Caching and CDNs — Practice

### P1. Revalidation response

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** 304

A browser sends `If-None-Match` and the resource has not changed. What does the server return?

- A) 200 OK with the full body
- B) 304 Not Modified with no body
- C) 204 No Content
- D) 404 Not Found

<details>
<summary>Answer</summary>

**Answer:** B) 304 Not Modified with no body

</details>

### P2. Choose the policy

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** Cache-Control choices

Choose a Cache-Control header for: (a) `/static/logo.9c1e.png`, (b) `/api/products` (public, changes every few minutes), (c) `/api/me/orders`, (d) `/index.html`.

<details>
<summary>Answer</summary>

(a) `public, max-age=31536000, immutable`. (b) `public, s-maxage=60` (or max-age 60). (c) `private, no-store`. (d) `no-cache` with an ETag.

</details>

### P3. Latency gain

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** edge caching

Origin RTT from a user is 220 ms; the nearest CDN edge RTT is 8 ms. A page needs 20 images fetched over 4 sequential rounds (5 in parallel each), all cached at the edge. Estimate image load time from the origin and from the edge (connections already open).

<details>
<summary>Answer</summary>

Origin: 4 × 220 = **880 ms**. Edge: 4 × 8 = **32 ms** (plus transfer time).

</details>

### P4. Stale data

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** invalidation

After a price change, some users still see old prices for up to 10 minutes. Responses carry `Cache-Control: public, max-age=600`. Explain and give two fixes.

<details>
<summary>Answer</summary>

Browsers and the CDN may reuse the cached response for 600 s without asking. Fixes: shorten `max-age`/`s-maxage` for price data (or use `no-cache` + ETag), and purge the CDN cache for affected URLs when prices change (or include a version in the URL).

</details>
