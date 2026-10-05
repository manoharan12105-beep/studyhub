# HTTP Methods, Safety, Idempotency and REST — Practice

### P1. Not idempotent

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** idempotency

Which method is **not** idempotent?

- A) GET
- B) PUT
- C) DELETE
- D) POST

<details>
<summary>Answer</summary>

**Answer:** D) POST

</details>

### P2. Choose the method

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** REST mapping

Choose the method and URL: (a) list all products, (b) create a product, (c) change only a product's price, (d) replace product 5 completely, (e) remove product 5, (f) check whether a large file has changed without downloading it.

<details>
<summary>Answer</summary>

(a) `GET /products`, (b) `POST /products`, (c) `PATCH /products/{id}`, (d) `PUT /products/5`, (e) `DELETE /products/5`, (f) `HEAD /files/{name}`.

</details>

### P3. Repeat the request

**Difficulty:** Medium · **Type:** Output · **Concepts:** idempotent effect

`DELETE /api/orders/7` is sent three times and order 7 existed. Typical status codes? Is it idempotent?

<details>
<summary>Answer</summary>

204 (or 200), then 404, then 404. Yes — the server state after each call is the same: order 7 does not exist.

</details>

### P4. Safe retry?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** retries

An HTTP client times out on each of: `GET /balance`, `PUT /users/3 {full data}`, `POST /transfers {…}`, `PATCH /counters/9 {"increment":1}`. Which may it retry automatically?

<details>
<summary>Answer</summary>

GET and PUT — idempotent. Not the POST (could duplicate the transfer) or this PATCH (an increment is not idempotent), unless they carry an idempotency key the server honours.

</details>

### P5. Spot the design bug

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** safe methods

An admin page has links like `GET /admin/users/12/delete`. One morning many users are gone after a link-preview bot scanned the page. Explain and fix.

<details>
<summary>Answer</summary>

GET must be safe; crawlers, link previews and browser prefetchers follow GET links freely, and here each one deleted a user. Use `DELETE /admin/users/12` (or a POST form) behind authentication and CSRF protection.

</details>
