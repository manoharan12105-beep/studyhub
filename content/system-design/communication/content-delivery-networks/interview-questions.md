# Content Delivery Networks (CDN) — Interview Questions

## Beginner

### Q1. What is a CDN and what problems does it solve?

**Style:** Direct

<details>
<summary>Answer</summary>

A globally distributed network of edge caching servers that serve content from locations near users. It reduces latency (shorter round trips), offloads bandwidth and requests from the origin, absorbs traffic spikes and many DDoS attacks, and terminates TLS close to users.

</details>

### Q2. What kind of content should be served through a CDN?

**Style:** Direct

<details>
<summary>Answer</summary>

Static and public content: images, video segments, JavaScript, CSS, fonts, downloads, and public pages or API responses that tolerate short caching. Personalised or frequently changing private data generally should not be cached at the edge.

</details>

## Intermediate

### Q3. What is the difference between a pull CDN and a push CDN?

**Style:** Comparison

<details>
<summary>Answer</summary>

A pull CDN fetches content from the origin when an edge first receives a request for it, then caches it according to headers — little setup, but the first request per edge is slow. A push CDN requires uploading content to the CDN in advance — useful for large, known files, but you manage the uploads and storage.

</details>

### Q4. How do you update a cached static file immediately everywhere?

**Style:** How

<details>
<summary>Answer</summary>

Use versioned or content-hashed file names (`app.3f9a1c.js`) with long, immutable cache lifetimes, and reference the new name from HTML or a manifest that has a short TTL. A new version is a new URL, so nothing needs purging. Purge APIs exist for content that must keep the same URL, but they take time to propagate.

</details>

### Q5. CDN vs Redis cache — what is the difference?

**Style:** Comparison

<details>
<summary>Answer</summary>

A CDN caches whole HTTP responses at edge locations close to users, saving network distance and origin bandwidth, controlled by HTTP headers. Redis caches arbitrary application data inside your data centre, saving database queries and computation, controlled by application code. They work together at different layers.

</details>

### Q6. How can a CDN serve private content such as paid videos?

**Style:** How

<details>
<summary>Answer</summary>

With signed URLs or signed cookies: the application, after checking the user's rights, issues a URL containing an expiry time and a cryptographic signature; the edge verifies the signature before serving cached content. The content is cached once and shared, but only holders of valid signatures can fetch it.

</details>

## Advanced

### Q7. A viral new video causes thousands of CDN edges to miss simultaneously and overload the origin. How do you prevent it?

**Style:** What happens if

<details>
<summary>Answer</summary>

Add an origin shield (a regional mid-tier cache that all edges fetch through, so the origin sees one request per object), enable request collapsing at edges so concurrent misses for the same object become one fetch, pre-warm or push popular content, and serve from object storage built for high read throughput rather than application servers.

</details>

### Q8. Users report seeing another user's account page. The site uses a CDN. What likely happened?

**Style:** Debugging

<details>
<summary>Answer</summary>

A personalised response was cached publicly: the origin sent cacheable headers (or none, with a CDN default that caches) for a page that depends on the user's cookie, and the cache key did not include the user. Fix: mark personalised responses `Cache-Control: private, no-store`, configure the CDN to bypass caching when authentication cookies are present, purge the affected URLs, and audit cache rules.

</details>
