# @SpringBootApplication, Startup and Embedded Servers — Interview Questions

## Beginner

### Q1. What does `@SpringBootApplication` do?

<details>
<summary>Answer</summary>

It combines `@SpringBootConfiguration` (a `@Configuration`, so the main class can declare beans), `@EnableAutoConfiguration` (import Boot's conditional auto-configurations) and `@ComponentScan` (scan the main class's package and sub-packages for components).

</details>

### Q2. What is an embedded server and why does Spring Boot use one?

<details>
<summary>Answer</summary>

A servlet container such as Tomcat running inside the application's JVM, started by the application itself. The application is a self-contained executable JAR: no external server installation, no WAR deployment, identical runtime in every environment, and a natural fit for containers. Tomcat is the default; Jetty is an alternative.

</details>

### Q3. What is the difference between `CommandLineRunner` and `ApplicationRunner`?

<details>
<summary>Answer</summary>

Both run once after the context has been refreshed and before `ApplicationReadyEvent`. `CommandLineRunner.run(String... args)` receives the raw arguments; `ApplicationRunner.run(ApplicationArguments args)` receives parsed arguments (option names/values and non-option arguments). Order multiple runners with `@Order`.

</details>

## Intermediate

### Q4. Explain what `@EnableAutoConfiguration` actually does.

<details>
<summary>Answer</summary>

It imports `AutoConfigurationImportSelector`, a deferred import selector that, after user configuration is processed, loads candidate auto-configuration class names from `AutoConfiguration.imports` files, removes exclusions, and registers those whose conditions match. It also registers the annotated class's package as the auto-configuration package, used as the default base for JPA entity and repository scanning.

</details>

### Q5. What happens when you call `SpringApplication.run()`?

<details>
<summary>Answer</summary>

It determines the application type from the classpath, loads initializers and listeners, prepares the `Environment` (property sources and profiles), prints the banner, creates the matching `ApplicationContext`, applies initializers, refreshes the context (configuration parsing, component scan, auto-configuration, post-processors, embedded server creation, singleton instantiation, server start), publishes `ApplicationStartedEvent`, calls runners and publishes `ApplicationReadyEvent`. Failures are reported through failure analyzers.

</details>

### Q6. Why should the main class be in the root package?

<details>
<summary>Answer</summary>

Component scanning, entity scanning and repository scanning all default to the main class's package and its sub-packages. A main class in a sub-package misses beans elsewhere; in the default package, scanning would cover every JAR on the classpath.

</details>

### Q7. How does DevTools restart so quickly?

<details>
<summary>Answer</summary>

It uses two class loaders: classes from JARs (which rarely change) are loaded once by a base class loader, while the project's own classes are loaded by a restart class loader. On a change, only the restart loader is discarded and a new context is created, avoiding reloading thousands of library classes. DevTools disables itself when running from a packaged JAR.

</details>

## Advanced

### Q8. At which point during startup is the embedded Tomcat created and when does it start accepting requests?

<details>
<summary>Answer</summary>

The server is created in the context's `onRefresh()` step, before singletons are instantiated, so that servlet-related beans can be registered with it. It starts listening on its port when the refresh finishes (after all singletons are created), and Boot publishes `ApplicationReadyEvent` after the runners. Readiness probes should use the readiness state (`/actuator/health/readiness`), which turns `ACCEPTING_TRAFFIC` after the application is ready.

</details>

### Q9. How would you run a Spring Boot application with virtual threads, and what changes?

<details>
<summary>Answer</summary>

On Java 21+, set `spring.threads.virtual.enabled=true`. Tomcat then handles requests on virtual threads, and Boot configures task executors (`@Async`, scheduling) to use virtual threads. Blocking calls (JDBC, HTTP) no longer pin a platform thread, so thousands of concurrent blocking requests are cheap. Limits move elsewhere: the database connection pool still caps concurrent database work, and `synchronized` blocks around blocking I/O can pin carrier threads on older JDKs.

</details>

### Q10. An exception is thrown from a `CommandLineRunner`. What happens?

<details>
<summary>Answer</summary>

`SpringApplication` treats it as a startup failure: it reports the error, publishes `ApplicationFailedEvent`, closes the context (running destroy callbacks) and `run` rethrows, so the process exits with a non-zero code. Catch and handle exceptions inside the runner if the task is optional.

</details>
