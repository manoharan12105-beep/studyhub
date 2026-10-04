# REST Principles and Resource Design — Practice

### P1. Most RESTful URI

**Difficulty:** Easy · **Type:** MCQ

Which endpoint best retrieves the reviews of product 15?

- A) `POST /getProductReviews` with body `{"productId": 15}`
- B) `GET /products/15/reviews`
- C) `GET /reviews/getByProduct/15`
- D) `GET /ProductReviews?productID=15&action=list`

<details>
<summary>Answer</summary>

**Answer:** B) `GET /products/15/reviews`

**Explanation:** A noun-based, hierarchical resource with the read action expressed by `GET`.

</details>

### P2. Redesign the API

**Difficulty:** Medium · **Type:** Design

Redesign: `POST /addUser`, `GET /getUser?id=5`, `POST /updateUserEmail`, `GET /removeUser?id=5`, `POST /listUsersByCity`.

<details>
<summary>Answer</summary>

`POST /users`, `GET /users/5`, `PATCH /users/5` (body `{"email": "…"}`), `DELETE /users/5`, `GET /users?city=Chennai`. Removing via `GET` was also dangerous: crawlers, prefetchers and caches assume `GET` is safe.

</details>

### P3. Stateless or not?

**Difficulty:** Medium · **Type:** Conceptual

An API stores the user's shopping cart in the HTTP session (server memory). The service runs on three instances behind a round-robin load balancer. What breaks, and how would a RESTful design avoid it?

<details>
<summary>Answer</summary>

Requests from the same user may hit different instances that do not have the session, so the cart appears empty (unless sticky sessions or session replication are added). A RESTful design stores the cart as a resource (`/carts/{id}` or `/users/me/cart`) in a database or Redis, and each request carries authentication, so any instance can serve it.

</details>

### P4. Maturity level

**Difficulty:** Easy · **Type:** Conceptual

An API uses separate URIs for resources and correct HTTP methods and status codes, but no links. Which Richardson level is it?

<details>
<summary>Answer</summary>

Level 2.

</details>
