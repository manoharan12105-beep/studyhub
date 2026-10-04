# Spring Security: Authentication and Authorization — Practice

### P1. 401 or 403?

**Difficulty:** Easy · **Type:** MCQ

A logged-in customer calls `DELETE /api/admin/users/9`, which requires `ROLE_ADMIN`. What status is expected?

- A) 400
- B) 401
- C) 403
- D) 404

<details>
<summary>Answer</summary>

**Answer:** C) 403

**Explanation:** The user is authenticated but lacks the required authority.

</details>

### P2. Everything returns 401

**Difficulty:** Easy · **Type:** Debugging

After adding `spring-boot-starter-security`, every endpoint returns 401 and a password appears in the logs. Explain.

<details>
<summary>Answer</summary>

Spring Boot's default security secures all endpoints and creates a user `user` with a generated password. Define a `SecurityFilterChain` with your rules (e.g. `permitAll` for public endpoints) and a real `UserDetailsService`/authentication mechanism.

</details>

### P3. Fix the rules

**Difficulty:** Medium · **Type:** Code analysis

```java
.authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/**").authenticated()
        .requestMatchers("/api/auth/login").permitAll()
        .requestMatchers("/api/admin/**").hasRole("ADMIN")
        .anyRequest().denyAll())
```

Users cannot log in, and plain users can call admin endpoints. Why?

<details>
<summary>Answer</summary>

Rules are matched in order: `/api/**` matches first for both `/api/auth/login` (so login requires authentication) and `/api/admin/**` (so any authenticated user passes). Order specific rules first: `/api/auth/login` permitAll, `/api/admin/**` hasRole ADMIN, then `/api/**` authenticated, then `anyRequest()`.

</details>
