# HTTP Status Codes — Practice

### P1. Created

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** 2xx codes

A POST successfully creates a new user. Which status is most appropriate?

- A) 200 OK
- B) 201 Created
- C) 204 No Content
- D) 202 Accepted

<details>
<summary>Answer</summary>

**Answer:** B) 201 Created

**Explanation:** Include a `Location` header with the new user's URL.

</details>

### P2. Pick the code

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** common codes

Give the status: (a) invalid JSON body, (b) expired JWT, (c) valid user without the ADMIN role, (d) `/api/users/999` does not exist, (e) `DELETE` on an endpoint that only supports GET, (f) username already taken.

<details>
<summary>Answer</summary>

(a) 400, (b) 401, (c) 403, (d) 404, (e) 405, (f) 409.

</details>

### P3. Whose fault?

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** 4xx vs 5xx

Your monitoring shows a spike of 429 errors from a partner API and a spike of 500 errors from your own service. What should each team do?

<details>
<summary>Answer</summary>

429: you are exceeding the partner's rate limit — slow down, honour `Retry-After`, add back-off, cache or batch. 500: a bug or unhandled failure in your service — check logs and exceptions; retrying blindly will not help.

</details>

### P4. Proxy errors

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** 502 vs 504

Nginx returns (a) 502 when the Spring Boot app is restarting, (b) 504 when a report endpoint takes 90 s. Explain each.

<details>
<summary>Answer</summary>

(a) During restart nothing listens on the backend port, so Nginx's connection is refused/reset — no valid response → 502. (b) The backend is alive but slower than Nginx's `proxy_read_timeout` (60 s by default) → 504. Make the report asynchronous (202 + status endpoint) or raise the timeout deliberately.

</details>

### P5. Redirect preserving method

**Difficulty:** Hard · **Type:** Conceptual · **Concepts:** 307/308

An API moved from `/v1/orders` to `/v2/orders` permanently. Clients POST to it. Which redirect code should the old endpoint return so POSTs keep working, and why not 301?

<details>
<summary>Answer</summary>

**308 Permanent Redirect** — it requires the client to repeat the same method and body. With 301, many clients change the POST into a GET, losing the body.

</details>
