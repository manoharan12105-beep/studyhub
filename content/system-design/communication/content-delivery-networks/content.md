# Content Delivery Networks (CDN)

**Module:** Communication and APIs · **Interview priority:** Core

## What Is It?

A **content delivery network** is a large set of caching servers — **edge servers** in **points of presence (PoPs)** around the world — that serve content to users from a location near them. Your own servers become the **origin**; the CDN fetches content from the origin once and serves it many times from the edge.

```text
User in Chennai ──20 ms──► CDN edge (Chennai) ──hit──► response
                                      │ miss (first request only)
                                      └──────180 ms──► Origin (Virginia): S3 bucket or app servers
```

## Why It Exists

Distance costs latency on every round trip, and serving heavy content (images, video, scripts) from your origin costs bandwidth and server capacity. A CDN fixes both:

- **Lower latency:** edge round trips of tens of milliseconds instead of hundreds.
- **Origin offload:** with a 95 % hit ratio the origin serves only 1 in 20 requests.
- **Absorbs spikes and attacks:** a huge, distributed edge soaks up traffic bursts and many denial-of-service attacks.
- **Faster TLS:** connections terminate near the user.

## How It Works

### Pull vs push

| | Pull CDN | Push CDN |
|---|----------|----------|
| How content gets to the edge | Edge fetches from the origin on the first miss, then caches | You upload content to the CDN ahead of time |
| Good for | Most websites and APIs; content requested unpredictably | Large files known in advance (software releases, video libraries) |
| Downside | First request per edge is slow | You manage uploads and storage |

### Controlling what is cached

The origin's HTTP headers tell the CDN (and browsers) what to do:

```http
Cache-Control: public, max-age=31536000, immutable      (versioned static assets: app.3f9a1c.js)
Cache-Control: public, max-age=60, s-maxage=300          (pages: browser 60 s, CDN 5 min)
Cache-Control: private, no-store                         (personal data: never cache at the CDN)
ETag: "a1b2c3"                                           (lets caches revalidate cheaply → 304)
```

- **Versioned file names** (`app.3f9a1c.js`, `logo.v7.png`) make updates instant: a new version is a new URL, so the old cached copy is simply never requested again. This beats purging.
- **Purging/invalidation** removes cached copies by URL or tag, for content that changed at the same URL (a news article correction). Propagation across all edges takes seconds to minutes.
- The **cache key** is usually the URL plus selected headers or cookies; including unnecessary query strings or cookies destroys the hit ratio.

### What a CDN can and cannot cache

| Can cache | Cannot (or should not) cache |
|-----------|-----------------------------|
| Images, video segments, CSS, JavaScript, fonts | Personalised responses (my cart, my feed) — unless keyed per user, which defeats the purpose |
| Public pages and public API responses with short TTLs | Writes (POST, PUT) |
| Downloads and software packages | Anything with authorisation decisions baked in, unless the CDN enforces signed URLs |

Private media (paid video, private photos) can still use a CDN with **signed URLs or cookies**: the origin issues a URL that expires and the edge verifies the signature.

### CDN vs application cache

| | CDN | Application cache (Redis) |
|---|-----|---------------------------|
| Location | Edge, near users, outside your data centre | Inside your data centre, near app servers |
| Saves | Network distance and origin bandwidth | Database queries and computation |
| Content | Whole HTTP responses, mostly static/public | Any data: objects, query results, sessions |
| Control | HTTP headers, purge API | Application code |

They complement each other: a request missing the CDN can still hit Redis behind the origin.

**Think about it:** you release a new version of `app.js` and some users get the old file for hours. What went wrong, and what is the fix?

<details>
<summary>Answer</summary>

The file was served at the same URL with a long `max-age`, so the CDN and browsers kept the old copy until it expired. Fix: put a content hash or version in the file name (`app.9c2e1f.js`) and reference the new name from the (short-cached) HTML, so each release is a new URL; purge only as an emergency measure.

</details>

## What Can Fail

- **CDN outage or misconfiguration** — a large provider failure takes many sites down; critical services may use multiple CDNs with DNS switching.
- **Caching private data** — a missing `private` header can serve one user's page to another. Default to not caching responses with cookies or authorisation.
- **Origin overload on mass misses** — after a purge or for a new viral file, many edges miss at once; an **origin shield** (a middle cache tier) collapses those misses into one origin request.

## Common Traps

> [!WARNING]
> **Common trap:** "Put everything behind the CDN with a long TTL." Personal and frequently changing responses must not be cached publicly; static assets should use versioned URLs rather than long TTLs on fixed names.

## Interview Follow-up

- *"How would you serve images for a photo app?"* Store originals and resized versions in object storage, serve them through a CDN with long TTLs on immutable, versioned URLs, and use signed URLs for private photos.

## Key Takeaways

- A CDN caches content on edge servers near users: lower latency, less origin load, protection from spikes.
- Pull CDNs fetch on first miss; push CDNs are pre-loaded.
- Control caching with `Cache-Control`, `ETag` and versioned URLs; purge only when the URL cannot change.
- CDNs serve public, static or semi-static content; application caches serve data inside your data centre.
