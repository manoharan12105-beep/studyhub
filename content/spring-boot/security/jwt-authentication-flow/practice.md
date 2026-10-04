# JWT Authentication Flow in Spring Security — Practice

### P1. Unauthenticated token

**Difficulty:** Easy · **Type:** MCQ

Which line creates an **authenticated** token in a JWT filter?

- A) `new UsernamePasswordAuthenticationToken(user, null)`
- B) `UsernamePasswordAuthenticationToken.authenticated(user, null, user.getAuthorities())`
- C) `UsernamePasswordAuthenticationToken.unauthenticated(user, null)`
- D) `new AnonymousAuthenticationToken(...)`

<details>
<summary>Answer</summary>

**Answer:** B) `UsernamePasswordAuthenticationToken.authenticated(user, null, user.getAuthorities())`

**Explanation:** The two-argument constructor and `unauthenticated` create tokens with `isAuthenticated() == false`.

</details>

### P2. Always 403

**Difficulty:** Medium · **Type:** Debugging

Users log in, receive tokens, and `/api/orders` (rule `hasRole("USER")`) always returns 403. The filter builds authorities with `new SimpleGrantedAuthority(role)` from the token claim `roles: ["USER"]`. Fix it.

<details>
<summary>Answer</summary>

`hasRole("USER")` checks `ROLE_USER`, but the authority is `USER`. Either store/map roles with the prefix (`"ROLE_" + role`) or use `hasAuthority("USER")`.

</details>

### P3. POST fails, GET works

**Difficulty:** Medium · **Type:** Debugging

With a valid token, `GET /api/orders` works but `POST /api/orders` returns 403. What is the likely cause?

<details>
<summary>Answer</summary>

CSRF protection is still enabled; unsafe methods without a CSRF token are rejected by `CsrfFilter`. For a stateless API using the `Authorization` header, disable CSRF for that chain.

</details>

### P4. Design the error response

**Difficulty:** Hard · **Type:** Design

The front end needs to distinguish "token expired" (refresh) from "token invalid" (log in again). How would you implement this?

<details>
<summary>Answer</summary>

In the JWT filter, catch `ExpiredJwtException` separately from other `JwtException`s and record the reason (e.g. a request attribute). Configure a custom `AuthenticationEntryPoint` that returns 401 with a ProblemDetail body containing a code (`TOKEN_EXPIRED` vs `TOKEN_INVALID`) and a `WWW-Authenticate: Bearer error="invalid_token", error_description="…"` header.

</details>
