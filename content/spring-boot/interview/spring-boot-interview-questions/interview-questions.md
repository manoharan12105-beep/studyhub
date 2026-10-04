# Spring Boot Interview Questions — Interview Questions

## Beginner

### Q1. What problems did Spring Boot solve for teams already using Spring?

**Style:** Why

<details>
<summary>Answer</summary>

Large amounts of repetitive infrastructure configuration (data sources, MVC, JSON, transactions), version conflicts between libraries, WAR deployment to externally managed servers, and missing production features. Boot replaced them with auto-configuration, curated starters and versions, embedded servers with executable JARs, and Actuator.

</details>

### Q2. What does the main class of a Spring Boot application do?

**Style:** Direct

<details>
<summary>Answer</summary>

It carries `@SpringBootApplication` (configuration + auto-configuration + component scan rooted at its package) and its `main` method calls `SpringApplication.run`, which builds the environment, creates and refreshes the application context, starts the embedded server and runs startup runners.

</details>

### Q3. How do you change the server port?

**Style:** How

<details>
<summary>Answer</summary>

Set `server.port` in `application.properties`/`yml`, as `--server.port=9090` on the command line, or as the environment variable `SERVER_PORT=9090`; `server.port=0` picks a random free port.

</details>

### Q4. What is a starter? Name four you have used.

**Style:** Direct

<details>
<summary>Answer</summary>

A dependency bundle for one capability with managed versions. Examples: `spring-boot-starter-webmvc` (or `-web` in Boot 3), `spring-boot-starter-data-jpa`, `spring-boot-starter-security`, `spring-boot-starter-validation`, `spring-boot-starter-actuator`, `spring-boot-starter-test`.

</details>

### Q5. What is the difference between `application.properties` and `application-prod.properties`?

**Style:** Comparison

<details>
<summary>Answer</summary>

The first is always loaded; the second only when the `prod` profile is active, and its values override the shared ones for the same keys.

</details>

## Intermediate

### Q6. What would you have to write yourself if Spring Boot had no auto-configuration?

**Style:** Why

<details>
<summary>Answer</summary>

Every infrastructure bean: the `DataSource` and connection pool, `EntityManagerFactory` and `JpaTransactionManager`, the `DispatcherServlet` and Jackson message converters, the embedded server, the security filter chain defaults, Actuator endpoints. Auto-configuration infers these from the classpath, properties and existing beans, and backs off wherever you define your own — convention over configuration without lock-in.

</details>

### Q7. How does Spring Boot decide whether to create a `DataSource`?

**Style:** How

<details>
<summary>Answer</summary>

The `DataSource` auto-configuration is conditional on JDBC classes being on the classpath (`@ConditionalOnClass`) and on no user-defined `DataSource` bean (`@ConditionalOnMissingBean`). It binds `spring.datasource.*` properties; with a URL it creates a Hikari pool, and without one it can create an embedded database if H2/HSQL/Derby is present — otherwise startup fails asking for a URL.

</details>

### Q8. How do you override an auto-configured bean?

**Style:** How

<details>
<summary>Answer</summary>

Declare your own bean of the same type; the auto-configured one is guarded by `@ConditionalOnMissingBean` and backs off. For small adjustments prefer properties (`spring.jackson.*`, `spring.datasource.hikari.*`) or customizer beans so you keep the rest of Boot's defaults.

</details>

### Q9. What is the precedence order of configuration sources?

**Style:** Direct

<details>
<summary>Answer</summary>

From highest: test properties, command-line arguments, `SPRING_APPLICATION_JSON`, servlet/JNDI parameters, Java system properties, OS environment variables, `random.*`, external profile-specific files, external files, packaged profile-specific files, packaged files, `@PropertySource`, default properties.

</details>

### Q10. What is the difference between `CommandLineRunner`, `ApplicationRunner` and `@EventListener(ApplicationReadyEvent.class)`?

**Style:** Comparison

<details>
<summary>Answer</summary>

Both runners execute once after the context is refreshed (the web server is already started), receiving raw or parsed arguments respectively; an exception stops startup. The `ApplicationReadyEvent` listener runs after all runners, when the app is ready to serve traffic.

</details>

### Q11. How does Spring Boot create an executable JAR, and what does `java -jar` actually run first?

**Style:** How

<details>
<summary>Answer</summary>

`spring-boot-maven-plugin` repackages the build into a JAR with classes in `BOOT-INF/classes`, dependencies in `BOOT-INF/lib` and Boot's loader at the root. The manifest's `Main-Class` is `JarLauncher`, which creates a class loader able to read nested JARs and then calls the `Start-Class` (your main class).

</details>

### Q12. What does Actuator give you in production, and what must you be careful about?

**Style:** Why

<details>
<summary>Answer</summary>

Health checks (including liveness/readiness for Kubernetes), metrics via Micrometer (HTTP, JVM, pools), runtime log-level changes, environment and bean introspection. Only `health` is exposed by default; sensitive endpoints (`env`, `heapdump`, `loggers` writes) must be secured or kept on an internal port.

</details>

### Q13. Why is DevTools excluded from production?

**Style:** Why

<details>
<summary>Answer</summary>

It is a development aid — automatic restarts, LiveReload, disabled caching — that adds overhead and a separate class loader with its own pitfalls. Boot disables it when running from a packaged JAR, and it should be declared `optional`/`developmentOnly` so it is not shipped.

</details>

## Advanced

### Q14. Why are auto-configurations processed after your configuration, and what breaks if they were not?

**Style:** Why

<details>
<summary>Answer</summary>

`@ConditionalOnMissingBean` can only see bean definitions registered before it is evaluated. Importing auto-configurations through a deferred import selector after all user configuration guarantees that your beans are known, so Boot's defaults back off correctly. If processed first, Boot would register its beans and yours would duplicate or conflict with them.

</details>

### Q15. You upgrade an internal starter to Spring Boot 3 and its beans disappear. What is the likely cause?

**Style:** Debugging

<details>
<summary>Answer</summary>

The starter registers its auto-configuration only in `META-INF/spring.factories` under `EnableAutoConfiguration`, which Boot 3 no longer reads. It must list the class in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` (and preferably annotate it with `@AutoConfiguration`). Also check for `javax.*` imports.

</details>

### Q16. How would you reduce Spring Boot startup time and memory?

**Style:** How

<details>
<summary>Answer</summary>

Remove unused starters (fewer auto-configurations), consider lazy initialisation where appropriate, avoid heavy work in `@PostConstruct`, use Class Data Sharing / AOT cache, enable virtual threads instead of large thread pools, tune the JVM for containers, and for extreme cases build a GraalVM native image with Spring AOT. Measure with the startup actuator endpoint (`BufferingApplicationStartup`).

</details>

### Q17. Two `@ConfigurationProperties` classes are not bound (all fields null). What do you check?

**Style:** Debugging

<details>
<summary>Answer</summary>

That they are registered (`@EnableConfigurationProperties`, `@ConfigurationPropertiesScan`, or `@Component` for setter-based classes); that the prefix matches the property keys in canonical kebab-case; that setter-based classes have setters (or records/constructor binding are used); and that the properties actually exist in the active profile's sources (check `/actuator/configprops`).

</details>

### Q18. What changed for developers in Spring Boot 4?

**Style:** Direct

<details>
<summary>Answer</summary>

It is built on Spring Framework 7: modularised auto-configuration (new package names), renamed starters (`spring-boot-starter-webmvc`, `spring-boot-starter-aspectj`, `security-oauth2-*`), Jackson 3 by default, Undertow removed, Spring Security 7, Hibernate 7, Jakarta EE 11, and Framework features such as built-in API versioning and `@Retryable`/`@ConcurrencyLimit`.

</details>

### Q19. How do you test that your application context starts with production-like configuration?

**Style:** How

<details>
<summary>Answer</summary>

A `@SpringBootTest` with `@ActiveProfiles("prod")` (or the relevant profiles) and Testcontainers for PostgreSQL/Redis via `@ServiceConnection`, asserting that the context loads and a smoke endpoint works. It catches missing properties, conditions and migrations before deployment.

</details>
