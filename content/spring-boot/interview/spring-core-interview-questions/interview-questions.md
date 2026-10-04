# Spring Core Interview Questions — Interview Questions

## Beginner

### Q1. In one sentence each, what are a bean, the container and dependency injection?

**Style:** Direct

<details>
<summary>Answer</summary>

A bean is an object created and managed by Spring; the container (`ApplicationContext`) reads bean definitions, creates beans and wires them; dependency injection is the container supplying each bean's collaborators instead of the bean creating them.

</details>

### Q2. What is the purpose of the `ApplicationContext` in a running Spring Boot application?

**Style:** Direct

<details>
<summary>Answer</summary>

It is the central registry and factory for all beans: it holds the singletons, resolves dependencies, applies post-processors (proxies), publishes events, exposes the `Environment` (properties, profiles) and manages lifecycle (startup and shutdown callbacks).

</details>

### Q3. Which annotations make a class a Spring bean?

**Style:** Direct

<details>
<summary>Answer</summary>

`@Component` and its stereotypes `@Service`, `@Repository`, `@Controller`, `@RestController` and `@Configuration` (found by component scanning), or a `@Bean` method returning an instance. Spring Data repository interfaces become beans through repository scanning.

</details>

### Q4. What is the default scope of a Spring bean, and what does it mean in practice?

**Style:** Direct

<details>
<summary>Answer</summary>

Singleton: one shared instance per container per bean definition, created at startup. In practice every request thread uses the same object, so it must not keep per-request mutable state.

</details>

### Q5. What is the difference between `@Bean` and `@Component`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`@Component` goes on your class and is discovered by scanning; `@Bean` goes on a factory method inside a configuration class and registers whatever that method returns. `@Bean` is used for third-party classes, conditional or multiple configured instances, and construction logic.

</details>

### Q6. Name three ways to inject a dependency.

**Style:** Direct

<details>
<summary>Answer</summary>

Constructor parameters (preferred), setter methods annotated `@Autowired`, and fields annotated `@Autowired`. `@Bean` method parameters are a fourth, configuration-side form.

</details>

## Intermediate

### Q7. Why is constructor injection preferred?

**Style:** Why

<details>
<summary>Answer</summary>

Dependencies become explicit and `final`, the object is fully initialised and immutable after construction, it can be unit-tested with `new` and fakes, missing dependencies fail at startup, circular dependencies are detected, and a long constructor signals a class doing too much.

</details>

### Q8. What happens when two beans implement the same interface and you inject the interface?

**Style:** Scenario

<details>
<summary>Answer</summary>

Spring finds two candidates by type and tries to narrow them: a `@Qualifier` on the injection point, then a single `@Primary` bean, then `@Priority`, then a bean whose name matches the parameter or field name. If none applies, startup fails with `NoUniqueBeanDefinitionException`. If you inject `List<Interface>` or `Map<String, Interface>`, you get both.

</details>

### Q9. Why does Spring create singletons at startup instead of on first use?

**Style:** Why

<details>
<summary>Answer</summary>

To fail fast and keep request latency predictable: wiring errors, missing properties and circular dependencies stop the application at startup, and expensive initialisation (pools, caches, clients) happens before traffic arrives. `@Lazy` or `spring.main.lazy-initialization` changes this when startup time matters more.

</details>

### Q10. When would you use prototype scope, and what is the catch?

**Style:** Why

<details>
<summary>Answer</summary>

For stateful, short-lived objects that must not be shared (builders, non-thread-safe helpers). The catch: injecting a prototype into a singleton gives that singleton one instance forever; use `ObjectProvider<T>.getObject()` per use. Spring also never calls destroy callbacks on prototypes.

</details>

### Q11. What is the role of `BeanPostProcessor` in Spring's design?

**Style:** Why

<details>
<summary>Answer</summary>

It is the extension point that lets the framework add behaviour to beans without changing them: annotation processing (`@Autowired`, `@PostConstruct`), validation and, most importantly, proxy creation for transactions, security, caching, async and aspects. Much of "Spring magic" is a `BeanPostProcessor` returning a proxy.

</details>

### Q12. How does `@Configuration` differ from `@Component` when both contain `@Bean` methods?

**Style:** Comparison

<details>
<summary>Answer</summary>

In a full `@Configuration` class Spring generates a CGLIB subclass, so one `@Bean` method calling another returns the existing singleton. In a `@Component` (or `proxyBeanMethods = false`) the call is a plain Java call that creates a new object. Using method parameters for dependencies avoids the difference.

</details>

### Q13. Is a Spring singleton bean thread-safe?

**Style:** Why

<details>
<summary>Answer</summary>

Only if you make it so. Spring shares one instance across all threads without any synchronisation. Stateless beans (only final references to other stateless beans) are safe; mutable instance fields shared between requests are race conditions.

</details>

### Q14. What is the difference between `@Autowired` and `@Inject`/`@Resource`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`@Autowired` (Spring) and `@Inject` (Jakarta/JSR-330) both inject by type with qualifiers; `@Autowired` has `required = false`. `@Resource` (Jakarta) injects by **name** first (the field/property name or `name` attribute) and falls back to type. Constructor injection without annotations avoids the question for most code.

</details>

## Advanced

### Q15. Walk through what happens when the container creates a `@Service` that has a `@Transactional` method.

**Style:** How

<details>
<summary>Answer</summary>

The scanner registers a bean definition. During refresh, the container resolves constructor dependencies (creating them first), instantiates the class, injects fields/setters, runs Aware callbacks and `postProcessBeforeInitialization` (including `@PostConstruct`), runs init methods, then `postProcessAfterInitialization`, where the auto-proxy creator sees the transactional annotation and returns a CGLIB proxy with a `TransactionInterceptor`. The proxy is stored as the singleton and injected everywhere.

</details>

### Q16. What happens if a `@PostConstruct` method throws an exception?

**Style:** Behavior

<details>
<summary>Answer</summary>

Bean creation fails with `BeanCreationException`, the context refresh aborts, already-created singletons are destroyed, and the application fails to start. That is why remote calls or optional warm-up should not live in `@PostConstruct`.

</details>

### Q17. How would you create a bean only when a property is set?

**Style:** How

<details>
<summary>Answer</summary>

Annotate the `@Bean` method or class with `@ConditionalOnProperty(name = "feature.sms.enabled", havingValue = "true")` (Spring Boot), or implement a custom `Condition` with `@Conditional` in plain Spring. `@Profile` is the alternative when the switch is an environment.

</details>

### Q18. How does Spring resolve `${...}` placeholders in `@Value`, and when does it fail?

**Style:** How

<details>
<summary>Answer</summary>

An embedded value resolver backed by the `Environment` (all property sources) replaces placeholders while the bean is being created. If a property is missing and no default (`${key:default}`) is given, bean creation fails at startup with "Could not resolve placeholder".

</details>

### Q19. Can a singleton bean depend on a request-scoped bean? How?

**Style:** Scenario

<details>
<summary>Answer</summary>

Yes, through a scoped proxy (`@RequestScope` uses one by default, or `proxyMode = ScopedProxyMode.TARGET_CLASS`). The singleton gets the proxy at startup; each method call resolves the instance bound to the current request. Using it outside a request thread throws `IllegalStateException`.

</details>

### Q20. How do events, `@Lazy` and `ObjectProvider` each help with circular dependencies?

**Style:** Comparison

<details>
<summary>Answer</summary>

Events remove the back-reference entirely: one side publishes, the other listens — the cleanest fix. `@Lazy` injects a proxy that resolves the real bean on first use, so construction no longer needs it. `ObjectProvider` lets the bean look up the dependency on demand. The latter two keep the coupling; they only defer resolution.

</details>

### Q21. What is `SmartInitializingSingleton` or `ApplicationReadyEvent` used for, compared with `@PostConstruct`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`@PostConstruct` runs per bean during creation, when other beans may not exist and proxies are not applied to `this`. `SmartInitializingSingleton.afterSingletonsInstantiated()` runs once after all singletons are created. `ApplicationReadyEvent` (Boot) fires after the context is refreshed, runners have executed and the app is ready — the safest point to start consumers or warm caches through proxied beans.

</details>

### Q22. Why does the order of `@Order` matter for `List<Interface>` injection, and what decides it?

**Style:** How

<details>
<summary>Answer</summary>

Lists are sorted by `@Order`/`Ordered`/`@Priority` (lower value first), falling back to registration order. It matters for chains such as validation steps, filters or pricing rules applied in sequence; without explicit order the sequence can change when classes are added or renamed.

</details>

### Q23. How would you inspect which beans and conditions exist in a running application?

**Style:** Debugging

<details>
<summary>Answer</summary>

Actuator endpoints `/actuator/beans` (beans, types, dependencies), `/actuator/conditions` (auto-configuration report) and `/actuator/configprops`; at startup, `--debug` prints the condition report; in tests, `ApplicationContext#getBeanNamesForType`.

</details>
