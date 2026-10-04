# Auto-Configuration — Interview Questions

## Beginner

### Q1. What is auto-configuration in Spring Boot?

<details>
<summary>Answer</summary>

Automatic registration of infrastructure beans based on the classpath, configured properties and existing beans. For example, with Spring MVC on the classpath Boot registers a `DispatcherServlet` and JSON converters; with a JDBC driver and `spring.datasource.url` it creates a pooled `DataSource`. It is enabled by `@EnableAutoConfiguration` (part of `@SpringBootApplication`).

</details>

### Q2. How do you disable a specific auto-configuration?

<details>
<summary>Answer</summary>

Use `@SpringBootApplication(exclude = SomeAutoConfiguration.class)` (or `excludeName` with the class name) or the property `spring.autoconfigure.exclude=fully.qualified.ClassName`. Often a property (for example `spring.jpa.open-in-view=false`) or defining your own bean is a better alternative to excluding a whole auto-configuration.

</details>

## Intermediate

### Q3. How does Spring Boot decide which auto-configurations to apply?

<details>
<summary>Answer</summary>

`AutoConfigurationImportSelector` reads candidate class names from `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` in all JARs, removes exclusions, filters quickly on class presence, then evaluates each class's and each `@Bean` method's `@Conditional` annotations: `@ConditionalOnClass`, `@ConditionalOnProperty`, `@ConditionalOnMissingBean`, `@ConditionalOnWebApplication` and others. Only matching definitions are registered.

</details>

### Q4. Why do your beans take precedence over auto-configured ones?

<details>
<summary>Answer</summary>

Auto-configuration is imported by a `DeferredImportSelector`, which runs after all user `@Configuration` classes and component scanning are processed. Auto-configured beans typically carry `@ConditionalOnMissingBean`, so when the condition is evaluated your bean definition already exists and the auto-configured one is skipped.

</details>

### Q5. How do you find out why a bean was or was not auto-configured?

<details>
<summary>Answer</summary>

Start the application with `--debug` (or `debug=true`) to print the condition evaluation report, which lists positive matches, negative matches with the failed condition, exclusions and unconditional classes. In a running application, Actuator's `/actuator/conditions` endpoint exposes the same information.

</details>

### Q6. You define your own `ObjectMapper` bean and suddenly `spring.jackson.*` properties stop working. Why?

<details>
<summary>Answer</summary>

Boot's Jackson auto-configuration builds its mapper from a builder that applies `spring.jackson.*` properties, registered modules and customizers. Defining your own mapper makes the auto-configured one back off, so none of that is applied. Prefer a customizer bean (`Jackson2ObjectMapperBuilderCustomizer` in Boot 3, `JsonMapperBuilderCustomizer` in Boot 4) to adjust the auto-configured mapper.

</details>

## Advanced

### Q7. How would you write your own auto-configuration?

<details>
<summary>Answer</summary>

Create a class annotated `@AutoConfiguration` (optionally with `before`/`after` ordering) containing `@Bean` methods guarded by conditions — usually `@ConditionalOnClass` for the library and `@ConditionalOnMissingBean` so users can override. Bind settings with `@ConfigurationProperties` + `@EnableConfigurationProperties`. List the class in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`. Keep it outside component-scanned packages, and test it with `ApplicationContextRunner`. Package it as `x-spring-boot-autoconfigure` plus a `x-spring-boot-starter` POM.

</details>

### Q8. What replaced `spring.factories` for auto-configuration, and why does it matter during upgrades?

<details>
<summary>Answer</summary>

Since Boot 2.7, auto-configurations are listed in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`; Boot 3.0 removed support for the `EnableAutoConfiguration` key in `spring.factories`. An old in-house starter that only uses `spring.factories` is silently ignored after upgrading to Boot 3, so its beans disappear and injection fails.

</details>

### Q9. Are conditions evaluated on bean instances?

<details>
<summary>Answer</summary>

No — on bean definitions, while configuration classes are processed and before beans are created. `@ConditionalOnBean`/`@ConditionalOnMissingBean` therefore only see definitions registered so far, which is why their use is recommended only in auto-configuration classes (which are processed last) and why ordering between auto-configurations matters.

</details>
