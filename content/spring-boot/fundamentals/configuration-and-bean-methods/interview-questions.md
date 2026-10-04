# @Configuration and @Bean — Interview Questions

## Beginner

### Q1. What do `@Configuration` and `@Bean` do?

<details>
<summary>Answer</summary>

`@Configuration` marks a class that declares beans. `@Bean` on a method registers the method's return value as a bean: the method name becomes the bean name, the return type its type, and the method's parameters are resolved from the container as dependencies.

</details>

### Q2. When do you use `@Bean` instead of a stereotype annotation?

<details>
<summary>Answer</summary>

For classes you do not own and cannot annotate (`BCryptPasswordEncoder`, `RestClient`, `Clock`), when creation needs logic or external configuration, when you need several configured instances of one class, or when the bean should be conditional on a profile or property. Your own components normally use stereotypes.

</details>

## Intermediate

### Q3. Why is a `@Configuration` class proxied with CGLIB?

<details>
<summary>Answer</summary>

To preserve singleton semantics for inter-bean method calls. If `repository()` calls `pool()`, the CGLIB subclass intercepts the call and returns the `pool` bean already in the container instead of executing the method again. Without the proxy, each call would create a new object.

</details>

### Q4. What does `@Configuration(proxyBeanMethods = false)` mean, and why does Spring Boot use it?

<details>
<summary>Answer</summary>

It turns off the CGLIB proxy (lite mode): `@Bean` methods are plain factory methods and calling one from another creates a new instance. Boot's auto-configuration classes use it because it is faster to start, uses less memory, and works with AOT/native images; they express dependencies through method parameters, so interception is not needed.

</details>

### Q5. What is the difference between `@Bean` methods in a `@Configuration` class and in a `@Component` class?

<details>
<summary>Answer</summary>

Both register beans. In a (full-mode) `@Configuration` class, inter-bean method calls are intercepted and return singletons. In a `@Component` class the methods run in lite mode: a direct call creates a new object, and the bean definitions are processed the same as `proxyBeanMethods = false`.

</details>

### Q6. How do you register two beans of the same type with `@Bean`?

<details>
<summary>Answer</summary>

Write two `@Bean` methods with different names (for example `primaryDataSource()` and `reportingDataSource()`). Mark one `@Primary` so default injection works, and inject the other with `@Qualifier("reportingDataSource")` or by a parameter named `reportingDataSource`.

</details>

## Advanced

### Q7. A `@Configuration` class is declared `final`. What happens?

<details>
<summary>Answer</summary>

In full mode, startup fails because CGLIB cannot subclass a final class (likewise, `@Bean` methods must not be `final` or `private`). With `proxyBeanMethods = false` the class can be final because no subclass is generated.

</details>

### Q8. How is Spring Boot auto-configuration related to `@Configuration`?

<details>
<summary>Answer</summary>

Each auto-configuration is a class annotated with `@AutoConfiguration` (itself a `@Configuration(proxyBeanMethods = false)`) containing `@Bean` methods guarded by conditions such as `@ConditionalOnClass` and `@ConditionalOnMissingBean`. They are listed in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` and processed after your own configuration, so your beans take precedence.

</details>
