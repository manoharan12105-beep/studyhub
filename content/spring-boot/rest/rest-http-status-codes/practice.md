# HTTP Status Codes — Practice

### P1. Expired token

**Difficulty:** Easy · **Type:** MCQ

A request carries a JWT that expired five minutes ago. Which status is correct?

- A) 400
- B) 401
- C) 403
- D) 440

<details>
<summary>Answer</summary>

**Answer:** B) 401

**Explanation:** The caller is not authenticated anymore; refreshing the token and retrying can succeed.

</details>

### P2. Map the scenarios

**Difficulty:** Medium · **Type:** Conceptual

Give the status for each: (a) `GET /products/77` — no such product; (b) a USER calls an ADMIN endpoint; (c) `POST /orders` creates order 501; (d) `quantity` is `-3`; (e) an image upload of 20 MB when the limit is 5 MB; (f) the client exceeded 100 requests/minute.

<details>
<summary>Answer</summary>

(a) 404, (b) 403, (c) 201 with `Location: /orders/501`, (d) 400 (or 422 by convention), (e) 413, (f) 429 with `Retry-After`.

</details>

### P3. Wrong code in production

**Difficulty:** Medium · **Type:** Debugging

Every "order not found" response is a 500 with a stack trace. The service throws `OrderNotFoundException extends RuntimeException`. Fix it in two different ways.

<details>
<summary>Answer</summary>

1. Annotate the exception class with `@ResponseStatus(HttpStatus.NOT_FOUND)`.
2. (Preferred) Handle it in a `@RestControllerAdvice` with `@ExceptionHandler(OrderNotFoundException.class)` returning a `ProblemDetail` with 404.

Also disable stack traces in error responses (Boot's default `server.error.include-stacktrace=never` should not be overridden).

</details>

### P4. Asynchronous report

**Difficulty:** Medium · **Type:** Design

`POST /reports` starts a report that takes two minutes. What do you return immediately, and how does the client get the result?

<details>
<summary>Answer</summary>

202 Accepted with a `Location` header pointing to a status resource (`/reports/jobs/91`). The client polls `GET /reports/jobs/91` (200 with status `RUNNING`/`DONE` and a link to the result) — or the server notifies via webhook/WebSocket.

</details>
