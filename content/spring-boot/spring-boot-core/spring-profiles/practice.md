# Profiles — Practice

### P1. Which beans?

**Difficulty:** Easy · **Type:** MCQ

Beans: `A` with `@Profile("dev")`, `B` with `@Profile("!dev")`, `C` without `@Profile`. Active profile: `prod`. Which beans exist?

- A) A and C
- B) B and C
- C) Only C
- D) A, B and C

<details>
<summary>Answer</summary>

**Answer:** B) B and C

**Explanation:** `!dev` matches when `dev` is not active; beans without `@Profile` are always registered.

</details>

### P2. Value resolution

**Difficulty:** Medium · **Type:** Behavior

`application.yml`: `app.page-size: 20`, `app.cache-ttl: 60s`. `application-prod.yml`: `app.page-size: 50`. With `prod` active, what are the two values?

<details>
<summary>Answer</summary>

`app.page-size = 50` (overridden by the profile file) and `app.cache-ttl = 60s` (inherited from the shared file).

</details>

### P3. Profile not active

**Difficulty:** Medium · **Type:** Debugging

A Kubernetes deployment sets `SPRING_PROFILE_ACTIVE=prod`, but the app logs `No active profile set, falling back to 1 default profile: "default"`. Why?

<details>
<summary>Answer</summary>

The variable name is wrong: it must be `SPRING_PROFILES_ACTIVE` (plural PROFILES), the relaxed form of `spring.profiles.active`.

</details>

### P4. Test profile

**Difficulty:** Medium · **Type:** Design

Integration tests must use an in-memory payment gateway and a separate database, without changing production code paths. How would you use profiles?

<details>
<summary>Answer</summary>

Annotate the tests with `@ActiveProfiles("test")`. Provide `application-test.yml` with the test database settings, and register the in-memory gateway as a `@Bean @Profile("test")` in test configuration (or `@Profile("!prod")` if dev should use it too). Production uses `prod`, where the real gateway bean is registered.

</details>
