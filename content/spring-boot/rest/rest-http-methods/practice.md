# HTTP Methods and Idempotency — Practice

### P1. Not idempotent

**Difficulty:** Easy · **Type:** MCQ

Which request is **not** idempotent?

- A) `PUT /users/7` with a full user body
- B) `DELETE /carts/3/items/9`
- C) `POST /payments` with an amount
- D) `GET /orders?status=PLACED`

<details>
<summary>Answer</summary>

**Answer:** C) `POST /payments` with an amount

**Explanation:** Each POST may create a new payment; the other three leave the same state when repeated.

</details>

### P2. PUT with missing field

**Difficulty:** Medium · **Type:** Behavior

A user has `{name: "Asha", email: "a@x.com", phone: "999"}`. A client sends `PUT /users/7` with `{"name": "Asha K", "email": "a@x.com"}`. What should `phone` be afterwards, by PUT semantics? What if it were PATCH?

<details>
<summary>Answer</summary>

PUT replaces the whole representation, so `phone` becomes null/cleared (or the request is rejected as incomplete by validation). With PATCH, only `name` changes and `phone` stays `"999"`.

</details>

### P3. Dangerous GET

**Difficulty:** Easy · **Type:** Scenario

An admin dashboard deletes coupons through links `GET /admin/coupons/15/delete`. Coupons start disappearing randomly. Suggest a cause.

<details>
<summary>Answer</summary>

Something issued the GET requests automatically — a browser prefetcher, a link-preview bot or a crawler — because GET is assumed safe. Use `DELETE /admin/coupons/15` (with authentication and CSRF protection where cookies are used).

</details>

### P4. Retry policy

**Difficulty:** Medium · **Type:** Design

Your API gateway can retry failed upstream calls automatically. Which methods would you allow it to retry by default?

<details>
<summary>Answer</summary>

GET, HEAD, OPTIONS, PUT and DELETE (idempotent). Not POST or PATCH, unless the endpoint supports idempotency keys and the gateway forwards the same key on retry.

</details>
