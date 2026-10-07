# HTTP and HTTPS for System Design — Practice

### P1. Safe to retry

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** idempotency

A request times out with no response. Which one can a client retry without risking a duplicate effect?

- A) `POST /payments`
- B) `PUT /users/42/avatar` with the full new avatar
- C) `POST /orders`
- D) `POST /messages`

<details>
<summary>Answer</summary>

**Answer:** B) `PUT /users/42/avatar` with the full new avatar

PUT replaces the resource with the same value each time, so it is idempotent.

</details>

### P2. What TLS protects

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** HTTPS scope

List two things HTTPS protects against and two it does not.

<details>
<summary>Answer</summary>

Protects: eavesdropping on traffic (passwords, tokens) and tampering in transit; also impersonation of the server. Does not protect: a user accessing data they are not authorised to see, SQL injection or other bad input, brute-force login attempts, or a compromised server.

</details>

### P3. Termination choice

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** TLS termination

You need path-based routing (`/api` vs `/static`) and central certificate management, and compliance requires encryption inside the data centre. Where do you terminate TLS?

<details>
<summary>Answer</summary>

Terminate at an L7 load balancer (to read paths and manage certificates centrally), then **re-encrypt** to the backends with internal certificates, so traffic inside the data centre is also encrypted.

</details>
