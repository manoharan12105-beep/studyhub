# What Is Spring?

**Module:** Spring Framework Fundamentals · **Interview priority:** Core

## Definition

**Spring Framework** is an open-source Java framework whose core is an **IoC container**: it creates your application's objects (called **beans**), connects them to their dependencies, manages their lifecycle, and adds cross-cutting behaviour such as transactions and security around them. Everything else in the Spring ecosystem — web, data access, security, Spring Boot — is built on top of that container.

## Why It Matters

- Every Spring Boot application is a Spring application. Boot automates configuration; it does not replace the container, dependency injection, proxies or the MVC request pipeline.
- Most "tricky" Spring Boot interview questions (`@Transactional` not working, `@Autowired` null, two beans of one type) are really questions about the core container.
- Knowing which problems Spring solves lets you explain *why* an annotation exists instead of reciting it.

## What Is Spring?

Spring is three things that are easy to confuse:

| Name | What it is | Example |
|------|------------|---------|
| **Spring Framework** | The core libraries: container, DI, AOP, transactions, JDBC support, Spring MVC | `spring-context`, `spring-webmvc`, `spring-tx` |
| **Spring projects** | Separate libraries built on the framework, each with its own version | Spring Boot, Spring Data, Spring Security, Spring Cloud |
| **Spring ecosystem** | All of the above plus the conventions around them | "a Spring application" |

The container is the centre. You describe *what* objects exist and *what* they need; Spring decides *when* to create them and *how* to connect them.

```text
Your classes  ──(annotations / @Bean methods)──►  Spring container (ApplicationContext)
                                                       │ creates beans
                                                       │ injects dependencies
                                                       │ wraps beans in proxies (transactions, security, AOP)
                                                       ▼
                                             Ready-to-use object graph
```

## Problems Spring Solves

Before Spring (early 2000s), enterprise Java meant EJB 2: heavyweight components, XML deployment descriptors, and code that could only run inside an application server. Spring's answer was **plain Java objects (POJOs) plus a lightweight container**.

| Problem without Spring | What Spring provides |
|------------------------|----------------------|
| Classes `new` their own dependencies → tight coupling, hard to test | **Dependency injection** — dependencies are passed in; tests pass fakes |
| Every service repeats transaction, logging and security code | **AOP and proxies** — declare `@Transactional` once; the proxy does the begin/commit/rollback |
| JDBC boilerplate: open connection, statement, result set, close, translate `SQLException` | **Templates and repositories** (`JdbcTemplate`, Spring Data) and a consistent unchecked `DataAccessException` hierarchy |
| Each library configured differently | **One configuration model** (`Environment`, properties, profiles) |
| Code locked to an application server | Runs anywhere: plain `main`, tests, embedded server, cloud |

### Example: the same service without and with Spring

```java
import java.util.Objects;

public class WithoutAndWithSpring {

    interface OrderRepository {
        void save(String order);
    }

    static class JdbcOrderRepository implements OrderRepository {
        public void save(String order) {
            System.out.println("INSERT " + order);
        }
    }

    // Without DI: the service decides AND creates its dependency.
    static class TightOrderService {
        private final OrderRepository repository = new JdbcOrderRepository();

        void place(String order) {
            repository.save(order);
        }
    }

    // With DI: the service only declares what it needs.
    // In a Spring application this class would be annotated with @Service,
    // and Spring would call this constructor with the repository bean.
    static class OrderService {
        private final OrderRepository repository;

        OrderService(OrderRepository repository) {
            this.repository = Objects.requireNonNull(repository);
        }

        void place(String order) {
            repository.save(order);
        }
    }

    public static void main(String[] args) {
        new TightOrderService().place("order-1");

        // A unit test can pass a fake without any framework.
        OrderService service = new OrderService(order -> System.out.println("FAKE SAVE " + order));
        service.place("order-2");
    }
}
```

**Output:**

```text
INSERT order-1
FAKE SAVE order-2
```

Spring's job is to perform the `new OrderService(repository)` wiring for hundreds of classes, in the right order, and to add behaviour (transactions, security) around them.

## Spring Framework Ecosystem

| Project | Purpose | Covered in |
|---------|---------|-----------|
| Spring Framework (Core, Beans, Context, AOP) | Container, DI, events, proxies | [Spring Container](../spring-container/content.md) |
| Spring Framework (Web MVC) | Servlet-based web and REST | [Spring MVC](../../spring-mvc/spring-mvc-architecture/content.md) |
| Spring Framework (TX, JDBC, ORM) | Transactions, JDBC, JPA integration | [Transactions](../../transactions/transactions-and-acid/content.md) |
| Spring WebFlux | Reactive, non-blocking web stack | Awareness only |
| Spring Boot | Auto-configuration, starters, embedded server, production features | [What Is Spring Boot?](../../spring-boot-core/spring-boot-introduction/content.md) |
| Spring Data (JPA, MongoDB, Redis, …) | Repository abstraction over data stores | [JPA vs Hibernate vs Spring Data JPA](../../jpa-hibernate/jpa-hibernate-spring-data/content.md) |
| Spring Security | Authentication, authorization, attack protection | [Spring Security](../../security/spring-security-introduction/content.md) |
| Spring Cloud | Distributed-system patterns (gateway, config, discovery) | [Microservices Awareness](../../advanced/microservices-awareness/content.md) |

### Versions worth knowing

| Generation | Java baseline | Namespace | Notes |
|------------|---------------|-----------|-------|
| Spring Framework 5 / Boot 2 | Java 8 | `javax.*` | End of life; still common in legacy code |
| Spring Framework 6 / Boot 3 | Java 17 | `jakarta.*` | Jakarta EE 9+ rename, AOT/native images |
| Spring Framework 7 / Boot 4 | Java 17 (21+ recommended) | `jakarta.*` | Modular auto-configuration, built-in API versioning and retry, Jackson 3 |

> [!IMPORTANT]
> Moving from Boot 2 to Boot 3 changed `javax.persistence`, `javax.validation` and `javax.servlet` imports to `jakarta.*`. A `javax.persistence.Entity` annotation on a Boot 3/4 project is silently ignored or fails to compile — a classic migration bug.

Examples in this category target **Java 21 and Spring Boot 4.x** (Spring Framework 7, Spring Security 7, Hibernate 7). Unless a section says otherwise, they also apply to Boot 3.x.

## Spring vs Spring Boot

Spring Boot is **not** a different framework. It is a layer on top of Spring Framework that removes setup work:

| Aspect | Spring Framework | Spring Boot |
|--------|------------------|-------------|
| What it is | The container and core modules | Opinionated setup on top of Spring |
| Configuration | You declare every infrastructure bean (DataSource, `DispatcherServlet`, transaction manager) | **Auto-configuration** creates them from the classpath and properties |
| Dependencies | You pick compatible versions of each library | **Starters** + a managed BOM pick tested versions |
| Server | Deploy a WAR to an external Tomcat | **Embedded** Tomcat/Jetty; run with `java -jar` |
| Production features | Build yourself | **Actuator**: health, metrics, info |
| Can you use one without the other? | Yes — Spring without Boot | No — Boot always uses Spring |

The full comparison, including what Boot adds internally, is in [What Is Spring Boot?](../../spring-boot-core/spring-boot-introduction/content.md).

## Common Mistakes

- Treating Spring Boot annotations as magic instead of asking which bean or proxy they create.
- Mixing `javax.*` and `jakarta.*` imports after a Boot 3 upgrade.
- Calling `new` on a class that Spring is supposed to manage — the object then has no injected dependencies and no proxies.

## Common Interview Traps

- **"Spring and Spring Boot are the same."** Spring is the framework; Boot is configuration automation and packaging on top of it.
- **"Spring is a web framework."** Spring MVC is one module. The core is a general-purpose IoC container; batch jobs and CLI tools use Spring without any web layer.
- **"Spring replaces Hibernate."** Spring integrates with Hibernate (transaction management, exception translation); Hibernate still does the ORM work.

## Key Takeaways

- Spring = IoC container + modules built around it; Boot = automation on top of Spring.
- Spring's value: loose coupling through DI, cross-cutting concerns through proxies, consistent infrastructure (transactions, data access, configuration).
- Know the generations: Boot 2 (`javax`, Java 8), Boot 3 (`jakarta`, Java 17), Boot 4 (Framework 7, modular).
