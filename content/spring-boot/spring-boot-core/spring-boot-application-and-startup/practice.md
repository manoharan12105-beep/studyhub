# @SpringBootApplication, Startup and Embedded Servers — Practice

### P1. The three parts

**Difficulty:** Easy · **Type:** MCQ

Which annotation is **not** part of `@SpringBootApplication`?

- A) `@EnableAutoConfiguration`
- B) `@ComponentScan`
- C) `@SpringBootConfiguration`
- D) `@EnableWebMvc`

<details>
<summary>Answer</summary>

**Answer:** D) `@EnableWebMvc`

**Explanation:** `@EnableWebMvc` takes full manual control of MVC configuration and actually switches off Boot's MVC auto-configuration; it is not part of `@SpringBootApplication`.

</details>

### P2. Order of startup hooks

**Difficulty:** Medium · **Type:** Behavior

A bean has a `@PostConstruct` method, an `ApplicationRunner`, and an `@EventListener(ApplicationReadyEvent.class)` method, each printing a line. In what order do the lines appear?

<details>
<summary>Answer</summary>

`@PostConstruct` (during bean creation in refresh) → `ApplicationRunner` (after refresh) → `ApplicationReadyEvent` listener (after all runners).

</details>

### P3. Port conflict

**Difficulty:** Easy · **Type:** Debugging

Startup fails with "Web server failed to start. Port 8080 was already in use." Give two fixes.

<details>
<summary>Answer</summary>

Stop the process using port 8080 (often a previous run of the same app), or start on another port: `server.port=8081` in properties, `--server.port=8081` on the command line, or `SERVER_PORT=8081` as an environment variable.

</details>

### P4. Scanning trap

**Difficulty:** Medium · **Type:** Scenario

A project has `com.acme.shop.ShopApplication`, entities in `com.acme.domain`, and repositories in `com.acme.shop.repo`. Repositories fail with "Not a managed type: class com.acme.domain.Product". Explain and fix.

<details>
<summary>Answer</summary>

Entity scanning defaults to the auto-configuration package `com.acme.shop`; `com.acme.domain` is outside it, so `Product` is not an entity. Move the main class to `com.acme` (cleanest), or add `@EntityScan("com.acme.domain")`.

</details>
