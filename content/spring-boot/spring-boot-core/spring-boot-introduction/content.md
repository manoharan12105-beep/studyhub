# What Is Spring Boot?

**Module:** Spring Boot Core · **Interview priority:** Core

## Definition

**Spring Boot** is a project built on Spring Framework that creates **stand-alone, production-ready Spring applications with minimal configuration**. It adds four things on top of Spring: **auto-configuration** (infrastructure beans created from what is on the classpath), **starters** (curated dependency sets with tested versions), an **embedded web server** (run with `java -jar`), and **production features** (Actuator health, metrics, externalized configuration).

## Why It Matters

- Nearly every Java backend role today uses Spring Boot; interviewers expect you to explain what it does *for* you, not just that it is "easy".
- Understanding what Boot automates tells you where to look when something is configured unexpectedly — and how to override it.

## What Is Spring Boot?

A complete REST service needs a `DispatcherServlet`, Jackson `HttpMessageConverter`, a `DataSource` with a connection pool, an `EntityManagerFactory`, a transaction manager, a servlet container and logging — all compatible versions. In classic Spring you declared each of these. In Spring Boot:

```java
package com.example.shop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ShopApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }
}
```

plus dependencies (`spring-boot-starter-webmvc`, `spring-boot-starter-data-jpa`, a JDBC driver) and a few properties (`spring.datasource.url`, credentials). Boot sees the classes on the classpath and configures the rest.

## Why Spring Boot?

| Pain in classic Spring | Boot's answer |
|------------------------|---------------|
| Hundreds of lines of infrastructure configuration | Auto-configuration with sensible defaults |
| Finding compatible versions of Spring, Hibernate, Jackson, Tomcat | Starters + dependency management (BOM) |
| Building a WAR and deploying to an external Tomcat | Embedded Tomcat/Jetty; executable fat JAR |
| Every environment configured differently | Externalized configuration + profiles |
| Health checks, metrics, info endpoints built by hand | Actuator |
| Slow feedback during development | DevTools automatic restart |

**Opinionated, not locked:** every default can be overridden — define your own bean (Boot's backs off), set a property, or exclude an auto-configuration.

## Spring Boot vs Spring Framework

| Aspect | Spring Framework | Spring Boot |
|--------|------------------|-------------|
| Role | Core container, DI, AOP, MVC, transactions, data access | Opinionated setup and runtime on top of Spring |
| Configuration | Explicit: you declare infrastructure beans | Automatic: conditional auto-configuration |
| Dependency versions | You choose each | Managed by the Boot BOM / parent POM |
| Server | External servlet container (WAR) | Embedded server (JAR), WAR optional |
| Entry point | `web.xml` / `WebApplicationInitializer` / manual context | `SpringApplication.run()` |
| Production features | Build or add yourself | Actuator, structured logging, graceful shutdown |
| Relationship | Foundation | Uses Spring; cannot exist without it |

## Spring Boot Architecture

```text
┌────────────────────────────────────────────────────────────────────┐
│ Your application: controllers, services, repositories, entities     │
├────────────────────────────────────────────────────────────────────┤
│ Spring Boot                                                         │
│  SpringApplication (startup) · Auto-configuration · Starters        │
│  Externalized config (properties, YAML, env vars, profiles)         │
│  Embedded server (Tomcat/Jetty) · Actuator · Logging · DevTools     │
├────────────────────────────────────────────────────────────────────┤
│ Spring Framework                                                     │
│  Core container (IoC/DI) · AOP · Web MVC · Transactions · JDBC/ORM  │
├────────────────────────────────────────────────────────────────────┤
│ Spring projects: Spring Data JPA, Spring Security, …                 │
│ Libraries: Hibernate, Jackson, HikariCP, Logback, Tomcat            │
├────────────────────────────────────────────────────────────────────┤
│ JVM (Java 17+)                                                       │
└────────────────────────────────────────────────────────────────────┘
```

Inside the application, Boot projects conventionally use a **layered architecture**:

```text
HTTP ─► Controller (web: validate input, map DTOs, status codes)
          └─► Service (business rules, @Transactional boundaries)
                └─► Repository (Spring Data JPA: queries)
                      └─► Database
```

The details of each layer are in [Spring MVC and the Layered Architecture](../../spring-mvc/spring-mvc-architecture/content.md).

### What happens at startup (summary)

1. `SpringApplication.run` decides the application type (servlet, reactive, none) from the classpath.
2. It prepares the `Environment` (properties, env vars, command-line args, profiles).
3. It creates the `ApplicationContext`, registers your configuration, and refreshes it: component scan, auto-configuration, bean creation.
4. The embedded web server starts; runners execute; the application is ready.

Details: [@SpringBootApplication, Startup and Embedded Servers](../spring-boot-application-and-startup/content.md).

### Spring Boot 4 notes

Spring Boot 4 (built on Spring Framework 7) splits auto-configuration into smaller modules (for example `spring-boot-webmvc`, `spring-boot-jdbc`), renames a few starters (`spring-boot-starter-web` → `spring-boot-starter-webmvc`, `spring-boot-starter-aop` → `spring-boot-starter-aspectj`), moves to Jackson 3, and drops Undertow. Concepts in this category are the same in Boot 3 and Boot 4; where code differs, the topic says so.

## Real-World Examples

- A REST API for an e-commerce site: `starter-webmvc`, `starter-data-jpa`, `starter-security`, `starter-validation`, PostgreSQL driver — running as one JAR in a Docker container.
- A batch job or Kafka consumer: no web starter; Boot creates a non-web context and still provides configuration, logging and Actuator.

## Advantages

- Fast start: a working service in minutes, consistent across teams.
- Tested dependency combinations; fewer version conflicts.
- Production features built in; easy containerisation.

## Disadvantages

- "Magic": problems can be hard to trace without knowing auto-configuration (the condition report helps).
- Fat JARs and many auto-configurations increase startup time and memory compared with minimal frameworks (mitigated by lazy init, AOT, CDS).
- Defaults may not suit you (open-in-view, generated security password) — you must know them to change them.

## Common Mistakes

- Overriding Boot-managed dependency versions without need, causing incompatibilities.
- Adding starters "just in case" — each one activates auto-configuration (for example adding `starter-data-jpa` without a database configured makes startup fail).
- Treating Boot defaults as production-ready security or performance settings without review.

## Common Interview Traps

- **"Spring Boot is a framework that replaces Spring MVC."** Spring MVC still handles requests; Boot configures it.
- **"Spring Boot means microservices."** Boot is equally suited to monoliths; Spring Cloud adds microservice patterns.
- **"Boot generates code."** It generates no source code; it registers beans at runtime (or ahead-of-time with AOT).

## Key Takeaways

- Boot = Spring + auto-configuration + starters + embedded server + production features.
- Opinionated defaults that back off when you define your own beans or properties.
- Same Spring container underneath: DI, proxies, MVC and transactions work exactly as in Spring Framework.
