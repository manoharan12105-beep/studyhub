# CORS, Same-Origin Policy and Preflight — Practice

### P1. Same origin?

**Difficulty:** Easy · **Type:** MCQ

Which pair is the **same** origin?

- A) `http://localhost:3000` and `http://localhost:8080`
- B) `https://app.shop.com` and `https://api.shop.com`
- C) `https://shop.com/products` and `https://shop.com/cart`
- D) `http://shop.com` and `https://shop.com`

<details>
<summary>Answer</summary>

**Answer:** C) `https://shop.com/products` and `https://shop.com/cart`

**Explanation:** Paths do not affect the origin; scheme, host and port must match.

</details>

### P2. Will it preflight?

**Difficulty:** Medium · **Type:** Behavior

From `https://app.shop.com`, the front end calls `fetch("https://api.shop.com/orders", {method: "POST", headers: {"Content-Type": "application/json", "Authorization": "Bearer …"}})`. Is there a preflight? What must the server answer?

<details>
<summary>Answer</summary>

Yes — JSON content type and the `Authorization` header make it non-simple. The `OPTIONS` response must include `Access-Control-Allow-Origin: https://app.shop.com`, `Access-Control-Allow-Methods` including POST, and `Access-Control-Allow-Headers` including `Content-Type, Authorization`, and must not require authentication.

</details>

### P3. Production CORS

**Difficulty:** Medium · **Type:** Design

How would you configure CORS differently for local development and production?

<details>
<summary>Answer</summary>

Bind allowed origins from configuration (`app.cors.allowed-origins`) — `http://localhost:3000` in the `dev` profile, the real front-end origin(s) in `prod` — into the `CorsConfigurationSource`. Never use wildcards with credentials, restrict methods and headers, set a sensible `maxAge`, and expose only needed headers.

</details>
