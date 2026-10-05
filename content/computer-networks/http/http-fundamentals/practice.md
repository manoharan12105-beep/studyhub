# HTTP Fundamentals — Practice

### P1. Request line

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** request line

Which is a valid HTTP/1.1 request line?

- A) `HTTP/1.1 GET /index.html`
- B) `GET /index.html HTTP/1.1`
- C) `/index.html GET HTTP/1.1`
- D) `200 OK /index.html`

<details>
<summary>Answer</summary>

**Answer:** B) `GET /index.html HTTP/1.1`

**Explanation:** Method, request target, version. D looks like part of a status line.

</details>

### P2. Split the URL

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** URL anatomy

Split `https://shop.example.com:8443/cart/items?sort=price#top` into scheme, host, port, path, query and fragment. Which part is not sent to the server?

<details>
<summary>Answer</summary>

Scheme `https`, host `shop.example.com`, port `8443`, path `/cart/items`, query `sort=price`, fragment `top`. The fragment is not sent.

</details>

### P3. Read the response

**Difficulty:** Medium · **Type:** Output · **Concepts:** status line, headers

```http
HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/users/42
```

What happened, and where is the new resource?

<details>
<summary>Answer</summary>

The request (typically a POST) created a resource; it is at `/api/users/42`. The body (if any) is JSON.

</details>

### P4. Different servers

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** statelessness

A user's three consecutive requests are sent by a load balancer to three different Spring Boot instances. Why can this work, and what breaks it?

<details>
<summary>Answer</summary>

HTTP is stateless and each request carries the user's identity (cookie or token), so any instance can serve it — as long as state lives outside the instance (a stateless JWT, or sessions in a shared store like Redis/Spring Session). It breaks if sessions are kept in each instance's memory; then you need sticky sessions or a shared session store.

</details>
