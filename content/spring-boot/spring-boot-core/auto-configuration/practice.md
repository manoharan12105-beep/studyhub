# Auto-Configuration — Practice

### P1. Back-off condition

**Difficulty:** Easy · **Type:** MCQ

Which condition lets an auto-configured bean step aside when the application defines its own bean of the same type?

- A) `@ConditionalOnClass`
- B) `@ConditionalOnMissingBean`
- C) `@ConditionalOnProperty`
- D) `@ConditionalOnWebApplication`

<details>
<summary>Answer</summary>

**Answer:** B) `@ConditionalOnMissingBean`

**Explanation:** It registers the bean only if no bean of that type (or name) is already defined.

</details>

### P2. Predict the beans

**Difficulty:** Medium · **Type:** Behavior

Using `GreetingAutoConfiguration` from the lesson, what happens with `greeting.enabled=false` **and** a user `@Bean GreetingService customGreeting()`?

<details>
<summary>Answer</summary>

Only `customGreeting` exists. The auto-configured bean is skipped for two independent reasons: the property condition fails and a `GreetingService` bean already exists. Injection of `GreetingService` receives the user bean.

</details>

### P3. Why is there a DataSource?

**Difficulty:** Medium · **Type:** Debugging

Tests start an H2 in-memory database although nobody configured one. How do you find out why, and why does it happen?

<details>
<summary>Answer</summary>

Run with `--debug` and read the positive match for `DataSourceAutoConfiguration` (embedded database configuration). It happens because a JDBC starter is present, no `spring.datasource.url` is set, and an embedded database (H2) is on the classpath — Boot then configures an embedded `DataSource` automatically.

</details>

### P4. Library integration

**Difficulty:** Hard · **Type:** Design

Your team maintains an internal `audit-client` library used by twenty services. Each service copies the same `@Bean AuditClient` configuration. Propose an auto-configuration design.

<details>
<summary>Answer</summary>

Create `audit-spring-boot-autoconfigure` with `@AutoConfiguration` class `AuditAutoConfiguration`: `@ConditionalOnClass(AuditClient.class)`, an `@ConfigurationProperties(prefix = "audit")` class for URL/timeouts, and `@Bean @ConditionalOnMissingBean AuditClient auditClient(AuditProperties p)`. Optionally `@ConditionalOnProperty(name = "audit.enabled", matchIfMissing = true)`. Register it in `AutoConfiguration.imports`, provide `audit-spring-boot-starter` that depends on it and the client, and test with `ApplicationContextRunner`. Services then add one dependency and properties.

</details>
