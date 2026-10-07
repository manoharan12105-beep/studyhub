# Stateless vs Stateful Services — Practice

### P1. Stateful or stateless?

**Difficulty:** Easy · **Type:** Comparison · **Concepts:** state

Is the server stateless (S) or stateful (F)? (a) An API that validates a JWT and reads orders from PostgreSQL, (b) a server keeping shopping carts in a `HashMap`, (c) a WebSocket gateway holding open connections, (d) an image API that writes uploads to S3.

<details>
<summary>Answer</summary>

(a) S, (b) F, (c) F, (d) S.

</details>

### P2. The right fix

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** sessions

Users are logged out randomly after adding servers. What is the best long-term fix?

- A) Enable sticky sessions
- B) Store sessions in a shared Redis cluster or use signed tokens
- C) Go back to one server
- D) Increase the session timeout

<details>
<summary>Answer</summary>

**Answer:** B) Store sessions in a shared Redis cluster or use signed tokens

Sticky sessions keep the state problem and add uneven load.

</details>

### P3. What happens on failure

**Difficulty:** Medium · **Type:** Failure · **Concepts:** sticky sessions

With sticky sessions, server 3 crashes while 2,000 users are pinned to it. What do those users experience, and what would they experience with a shared session store?

<details>
<summary>Answer</summary>

With sticky sessions their sessions are lost: they are logged out and lose carts or drafts held in memory. With a shared store, the load balancer sends their next requests to other servers, which find their sessions in Redis; they notice at most one failed in-flight request.

</details>

### P4. Disposable servers

**Difficulty:** Hard · **Type:** Design · **Concepts:** stateless design

A server runs a nightly cron job that emails reports, stores temporary CSV exports on local disk for users to download later, and caches product data in memory. What must change for servers to be fully disposable?

<details>
<summary>Answer</summary>

Move the cron job to a single scheduler (or protect it with a distributed lock) so it runs once, not once per server. Write CSV exports to object storage and give users a download link. The in-memory product cache can stay if it is only an optimisation with a TTL; it is lost on restart without harming correctness.

</details>
