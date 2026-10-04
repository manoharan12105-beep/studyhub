# What Is Spring? — Interview Questions

## Beginner

### Q1. What is the Spring Framework?

<details>
<summary>Answer</summary>

An open-source Java framework built around an IoC container. The container creates application objects (beans), injects their dependencies, manages their lifecycle and wraps them with cross-cutting behaviour such as transactions and security. Modules for web (Spring MVC), data access and testing are built on that container.

</details>

### Q2. What problems does Spring solve?

<details>
<summary>Answer</summary>

- **Tight coupling** — classes creating their own dependencies; Spring injects them instead.
- **Repeated cross-cutting code** — transactions, security, logging; Spring applies them through proxies (`@Transactional`, `@PreAuthorize`).
- **Infrastructure boilerplate** — JDBC resource handling and `SQLException` translation (`JdbcTemplate`, `DataAccessException`).
- **Heavyweight, server-bound components** (EJB 2) — Spring works with plain Java objects that run anywhere, including unit tests.

</details>

### Q3. Is Spring Boot a replacement for Spring?

<details>
<summary>Answer</summary>

No. Spring Boot is built on Spring Framework. It adds auto-configuration, starter dependencies, an embedded server and production features (Actuator). The container, DI, AOP, transactions and Spring MVC are still Spring Framework.

</details>

## Intermediate

### Q4. Why did Spring become popular over EJB 2?

<details>
<summary>Answer</summary>

EJB 2 components had to implement container interfaces, needed XML deployment descriptors and could only run inside an application server, which made testing slow and code coupled to the platform. Spring let developers write plain Java objects, wire them with DI and apply transactions declaratively, so the same classes ran in unit tests, a `main` method or a server. (Later EJB 3 and Jakarta EE adopted many of these ideas.)

</details>

### Q5. What changed for application code between Spring Boot 2 and Spring Boot 3?

<details>
<summary>Answer</summary>

The Java baseline moved to 17 and Jakarta EE replaced Java EE, so `javax.persistence`, `javax.validation`, `javax.servlet` and similar imports became `jakarta.*`. Spring Security 6 removed `WebSecurityConfigurerAdapter` in favour of `SecurityFilterChain` beans. Spring Boot 3 also added AOT processing for GraalVM native images.

</details>

### Q6. Name the main Spring projects you have used and what each does.

<details>
<summary>Answer</summary>

A typical backend answer: **Spring Boot** (auto-configuration, embedded Tomcat, Actuator), **Spring MVC** (REST controllers), **Spring Data JPA** (repositories over Hibernate), **Spring Security** (authentication with JWT, authorization rules), and Spring's **transaction management** (`@Transactional`). Mention what you used each for in your project rather than listing names only.

</details>

## Advanced

### Q7. If Spring is "just" a container, how does `@Transactional` on a plain method start a database transaction?

<details>
<summary>Answer</summary>

When the container creates the bean, a `BeanPostProcessor` sees the annotation and returns a **proxy** instead of the raw object. Callers receive the proxy. When a transactional method is called through it, the proxy's interceptor asks the `PlatformTransactionManager` to begin a transaction, calls the real method, then commits or rolls back. The method itself contains no transaction code — which is also why calling it from inside the same class (bypassing the proxy) skips the transaction.

</details>

### Q8. Can you use Spring without Spring Boot? When would you?

<details>
<summary>Answer</summary>

Yes. Create an `AnnotationConfigApplicationContext` with your `@Configuration` classes and declare infrastructure beans yourself. It is useful for libraries that must not impose Boot, for learning what Boot automates, or in legacy WAR deployments. For new services, Boot is the default because it removes that configuration and version management work.

</details>
