# Cookies, Sessions and Cookie Security — Practice

### P1. Protect against XSS theft

**Difficulty:** Easy · **Type:** MCQ

Which attribute prevents JavaScript injected into a page from reading the session cookie?

- A) `Secure`
- B) `HttpOnly`
- C) `SameSite=Lax`
- D) `Path=/`

<details>
<summary>Answer</summary>

**Answer:** B) `HttpOnly`

</details>

### P2. Write the cookie

**Difficulty:** Medium · **Type:** Coding

Write the `Set-Cookie` header for a session cookie named `SID` that is HTTPS-only, invisible to JavaScript, not sent on cross-site POSTs, and limited to `/app`.

<details>
<summary>Answer</summary>

```http
Set-Cookie: SID=7f3a9c…; Path=/app; Secure; HttpOnly; SameSite=Lax
```

`Lax` still allows top-level GET navigations from other sites; use `Strict` if even those should arrive without the cookie.

</details>

### P3. Review

**Difficulty:** Medium · **Type:** Code analysis

A login endpoint returns `Set-Cookie: auth_token=eyJ…; Domain=.shop.com; Max-Age=31536000`. List the problems.

<details>
<summary>Answer</summary>

No `Secure` (can leak over HTTP), no `HttpOnly` (XSS can steal it), no `SameSite` (relies on browser defaults; CSRF exposure since it is a cookie), a one-year lifetime for a bearer credential, and `Domain=.shop.com` sends it to every subdomain. Use a short-lived access token, a separate refresh cookie with tight attributes, and CSRF protection.

</details>
