# Content Delivery Networks (CDN) — Practice

### P1. What to cache

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** CDN content

Which response should NOT be cached publicly at the CDN?

- A) `/static/logo.v3.png`
- B) `/videos/abc/segment-0042.ts`
- C) `/api/me/cart`
- D) `/fonts/inter.woff2`

<details>
<summary>Answer</summary>

**Answer:** C) `/api/me/cart`

It is personalised to the logged-in user.

</details>

### P2. Origin load

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** hit ratio

A site serves 50,000 image requests/s. With a CDN hit ratio of 96 %, how many requests/s reach the origin? What if the hit ratio drops to 80 %?

<details>
<summary>Answer</summary>

96 %: 50,000 × 0.04 = **2,000/s**. 80 %: 50,000 × 0.20 = **10,000/s** — five times as much origin load from a 16-point drop in hit ratio.

</details>

### P3. Header choice

**Difficulty:** Medium · **Type:** Design · **Concepts:** Cache-Control

Give a `Cache-Control` value for: (a) `app.7d1e.js`, (b) a public product page that may change every few minutes, (c) the user's account settings page.

<details>
<summary>Answer</summary>

(a) `public, max-age=31536000, immutable`. (b) `public, max-age=60, s-maxage=300` (or similar short TTLs). (c) `private, no-store`.

</details>

### P4. Hit ratio killer

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** cache keys

After a marketing campaign, CDN hit ratio for product images falls from 95 % to 30 %. The URLs now look like `/img/42.jpg?utm_source=mail&utm_campaign=oct&uid=93811`. Explain and fix.

<details>
<summary>Answer</summary>

The cache key includes the query string, and tracking parameters (unique per user via `uid`) make nearly every URL unique, so each request misses. Configure the CDN to ignore or strip those query parameters from the cache key (or whitelist only parameters that change the image), and stop adding them to asset URLs.

</details>
