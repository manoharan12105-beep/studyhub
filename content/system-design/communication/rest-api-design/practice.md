# REST API Design — Practice

### P1. Endpoint style

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** REST naming

Which endpoint follows REST conventions for creating an order?

- A) `GET /createOrder`
- B) `POST /orders`
- C) `POST /order/create/new`
- D) `PUT /orders/create`

<details>
<summary>Answer</summary>

**Answer:** B) `POST /orders`

Plural noun for the collection; the method is the verb.

</details>

### P2. PUT or PATCH result

**Difficulty:** Easy · **Type:** Output · **Concepts:** PUT vs PATCH

Resource: `{"id":5,"name":"Ravi","city":"Pune"}`. The client sends `{"city":"Delhi"}`. What is the resource after (a) PATCH, (b) PUT (assuming the server clears omitted fields)?

<details>
<summary>Answer</summary>

(a) `{"id":5,"name":"Ravi","city":"Delhi"}`. (b) `{"id":5,"name":null,"city":"Delhi"}`.

</details>

### P3. Pick the status code

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** status codes

Choose a status code: (a) a valid token, but the user is not an admin, calls `DELETE /users/9`; (b) no token is sent; (c) `POST /users` creates user 77; (d) the service is overloaded and sheds load.

<details>
<summary>Answer</summary>

(a) 403, (b) 401, (c) 201 (with the new id, ideally a `Location: /users/77` header), (d) 503 (optionally with `Retry-After`).

</details>

### P4. Where does it go?

**Difficulty:** Medium · **Type:** Design · **Concepts:** path, query, body

Design the request for: search products named "lamp", priced under 50, sorted by rating, second page of 20.

<details>
<summary>Answer</summary>

`GET /products?q=lamp&maxPrice=50&sort=-rating&limit=20&cursor=<cursor from page 1>` (or `page=2&limit=20` with offset pagination). All are query parameters because they filter, sort and paginate a collection.

</details>

### P5. Evolve without breaking

**Difficulty:** Hard · **Type:** Design · **Concepts:** compatible changes

Your `GET /users` currently returns a bare array. You need to add pagination. How do you do it without breaking existing mobile apps?

<details>
<summary>Answer</summary>

Changing the top-level array to an object would break them. Options: introduce `GET /v2/users` returning `{"users": [...], "nextCursor": ...}` while v1 keeps the array; or keep the body unchanged in v1 and expose the cursor in a response header (`Link`). Going forward, always return objects so fields can be added.

</details>
