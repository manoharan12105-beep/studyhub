# HTTP Headers, Cookies and Sessions — Practice

### P1. Which header?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** headers

Which header tells the server the body is JSON?

- A) Accept
- B) Content-Type
- C) Authorization
- D) Cache-Control

<details>
<summary>Answer</summary>

**Answer:** B) Content-Type

**Explanation:** `Accept` says what the client wants back.

</details>

### P2. Name the header

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** header purposes

Name the header: (a) send a JWT, (b) server stores a session ID in the browser, (c) browser returns it, (d) URL of a newly created resource, (e) when to retry after 429.

<details>
<summary>Answer</summary>

(a) `Authorization: Bearer …`, (b) `Set-Cookie`, (c) `Cookie`, (d) `Location`, (e) `Retry-After`.

</details>

### P3. Secure the cookie

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** cookie attributes

Write a `Set-Cookie` header for a session ID that JavaScript cannot read, is only sent over HTTPS, is not sent on cross-site POSTs and expires after 30 minutes.

<details>
<summary>Answer</summary>

```http
Set-Cookie: SESSION=8f3a9c2e; Path=/; Max-Age=1800; HttpOnly; Secure; SameSite=Lax
```

</details>

### P4. Cache policy

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** Cache-Control

Choose Cache-Control for: (a) `GET /api/me/account` (personal banking data), (b) `/assets/app.3f9a1c.js` (versioned file name), (c) a product list that may be cached by the browser but must be checked for changes each time.

<details>
<summary>Answer</summary>

(a) `no-store`. (b) `public, max-age=31536000, immutable`. (c) `no-cache` (plus an `ETag` so revalidation can return 304).

</details>

### P5. Decode it

**Difficulty:** Medium · **Type:** Output · **Concepts:** Basic auth

A request has `Authorization: Basic YWRtaW46c2VjcmV0`. What does it reveal, and what does that imply?

<details>
<summary>Answer</summary>

Base64-decoding gives `admin:secret` — the username and password. Basic auth is only encoding, so it must be used over HTTPS (and preferably replaced by token or session authentication).

</details>
