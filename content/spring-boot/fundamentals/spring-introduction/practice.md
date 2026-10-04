# What Is Spring? — Practice

### P1. Spring vs Spring Boot

**Difficulty:** Easy · **Type:** MCQ

Which statement is correct?

- A) Spring Boot replaces the Spring IoC container with its own
- B) Spring Boot is built on Spring Framework and automates its configuration
- C) Spring Framework cannot run without Spring Boot
- D) Spring Boot is only for microservices

<details>
<summary>Answer</summary>

**Answer:** B) Spring Boot is built on Spring Framework and automates its configuration

**Explanation:** Boot uses the same `ApplicationContext`; it adds auto-configuration, starters, an embedded server and Actuator. Spring runs fine without Boot, and Boot suits monoliths as well.

</details>

### P2. Which problem does DI address?

**Difficulty:** Easy · **Type:** Conceptual

A `ReportService` contains `private final MailClient client = new SmtpMailClient();`. Name two problems this causes and how Spring addresses them.

<details>
<summary>Answer</summary>

1. **Untestable without the real SMTP client** — a test cannot substitute a fake.
2. **Tight coupling** — switching to another mail provider means editing `ReportService`.

Spring addresses both by injecting `MailClient` through the constructor: production wiring passes the SMTP bean, tests pass a fake.

</details>

### P3. Migration bug

**Difficulty:** Medium · **Type:** Debugging

After upgrading from Boot 2.7 to Boot 3.2, an entity annotated with `@javax.persistence.Entity` is reported as "Not a managed type". Why?

<details>
<summary>Answer</summary>

Boot 3 uses Jakarta Persistence (`jakarta.persistence.*`). Hibernate 6 does not recognise `javax.persistence.Entity`, so the class is not an entity. Replace all `javax.persistence`, `javax.validation` and `javax.servlet` imports with their `jakarta` equivalents (and remove old `javax` dependencies).

</details>

### P4. Where does transaction code live?

**Difficulty:** Medium · **Type:** Conceptual

A service method annotated with `@Transactional` contains no `begin()` or `commit()` calls. Explain who starts and commits the transaction.

<details>
<summary>Answer</summary>

A proxy created by the container around the service bean. The proxy's transaction interceptor begins a transaction through the `PlatformTransactionManager` before delegating to the method and commits (or rolls back on a runtime exception) after it returns. See [@Transactional](../../transactions/transactional-annotation/content.md).

</details>
