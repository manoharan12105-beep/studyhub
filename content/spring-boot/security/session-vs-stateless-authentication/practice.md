# Session-Based vs Stateless Authentication — Practice

### P1. Stateless property

**Difficulty:** Easy · **Type:** MCQ

What makes JWT authentication stateless?

- A) Tokens are encrypted
- B) The server validates a self-contained signed token without storing a session
- C) Tokens never expire
- D) The database is not used at all

<details>
<summary>Answer</summary>

**Answer:** B) The server validates a self-contained signed token without storing a session

</details>

### P2. Lost logins

**Difficulty:** Medium · **Type:** Debugging

A session-based app runs on two instances behind a round-robin load balancer. Users are randomly logged out. Why, and what are two fixes?

<details>
<summary>Answer</summary>

Sessions live in each instance's memory; requests hitting the other instance find no session. Fixes: sticky sessions, or Spring Session with Redis/JDBC so both instances share sessions (or move to stateless tokens).

</details>

### P3. Choose an approach

**Difficulty:** Medium · **Type:** Design

Choose session or JWT for: (a) an Android app calling your API; (b) a Thymeleaf admin panel; (c) internal service-to-service calls.

<details>
<summary>Answer</summary>

(a) Short-lived JWT access token + refresh token (or OAuth2). (b) Session-based form login with CSRF protection. (c) OAuth2 client-credentials tokens (JWT) or mTLS — stateless verification between services.

</details>
