# What Is Spring Boot? — Interview Questions

## Beginner

### Q1. What is Spring Boot?

<details>
<summary>Answer</summary>

A project on top of Spring Framework for building stand-alone, production-ready applications with minimal configuration. It provides auto-configuration, starter dependencies with managed versions, an embedded web server for `java -jar` deployment, externalized configuration and Actuator production endpoints.

</details>

### Q2. What are the main features of Spring Boot?

<details>
<summary>Answer</summary>

Auto-configuration, starters, dependency management, embedded servers (Tomcat by default), `SpringApplication` bootstrap, externalized configuration with profiles, Actuator (health, metrics, info), DevTools for development, and test support (`@SpringBootTest` and slice tests).

</details>

### Q3. What is the difference between Spring and Spring Boot?

<details>
<summary>Answer</summary>

Spring Framework provides the container and modules (DI, AOP, MVC, transactions). Spring Boot builds on it to remove setup: it auto-configures infrastructure beans from the classpath, manages dependency versions through starters, embeds the server and adds production features. A Boot application is a Spring application with this automation; Spring can be used without Boot, but not the other way round.

</details>

## Intermediate

### Q4. Why does Spring Boot use auto-configuration?

<details>
<summary>Answer</summary>

Because most infrastructure setup is the same in every application and can be inferred: if Hibernate and a `DataSource` URL are present, you need an `EntityManagerFactory` and a `JpaTransactionManager`; if Spring MVC is present, you need a `DispatcherServlet` and JSON converters. Auto-configuration encodes these conventions as conditional `@Bean` definitions, so developers write only what differs. It backs off when you define your own beans, so it never takes control away.

</details>

### Q5. Is Spring Boot only for microservices?

<details>
<summary>Answer</summary>

No. It is equally good for monoliths, batch jobs, CLI tools and message consumers. Its fast setup and embedded server made it popular for microservices; patterns specific to microservices (gateway, discovery, config server) come from Spring Cloud.

</details>

### Q6. What are the disadvantages of Spring Boot?

<details>
<summary>Answer</summary>

Hidden behaviour (auto-configuration can be hard to trace without the condition report), larger memory footprint and startup time than minimal frameworks, fat JARs with many dependencies, and defaults that may not suit production (open-session-in-view enabled, generated default user) unless reviewed. Most are manageable: `--debug` condition reports, exclusions, lazy initialisation, AOT/CDS.

</details>

## Advanced

### Q7. What changed in Spring Boot 4 that a developer should know about?

<details>
<summary>Answer</summary>

It is based on Spring Framework 7 (Jakarta EE 11, Java 17 baseline). Auto-configuration was modularised into focused modules, some starters were renamed (`spring-boot-starter-webmvc`, `spring-boot-starter-aspectj`), Jackson 3 became the default JSON library, Undertow support was removed, and Framework 7 brought built-in API versioning and resilience annotations (`@Retryable`, `@ConcurrencyLimit`). Core concepts — DI, auto-configuration, starters, Actuator — are unchanged.

</details>

### Q8. How would you explain Spring Boot to someone who knows only Spring Framework, in terms of what actually happens at runtime?

<details>
<summary>Answer</summary>

`SpringApplication.run` creates the same kind of `ApplicationContext` you would create manually, but before refresh it prepares an `Environment` from many property sources and registers `@EnableAutoConfiguration`'s import selector. During refresh, after your configuration is processed, Boot imports its auto-configuration classes — ordinary `@Configuration` classes whose `@Bean` methods are guarded by `@Conditional` checks on the classpath, properties and existing beans. For servlet apps the context also creates and starts an embedded Tomcat in `onRefresh`. Nothing is generated; it is conditional bean registration.

</details>
