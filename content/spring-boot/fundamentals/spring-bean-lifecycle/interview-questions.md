# Bean Lifecycle — Interview Questions

## Beginner

### Q1. Explain the Spring bean lifecycle.

<details>
<summary>Answer</summary>

The container instantiates the bean (calling the constructor with its dependencies), populates field and setter dependencies, calls Aware interfaces (`BeanNameAware`, `ApplicationContextAware`…), runs `BeanPostProcessor` before-initialisation hooks, then the initialisation callbacks (`@PostConstruct`, `afterPropertiesSet`, custom init method), then the after-initialisation hooks, which may return a proxy. The bean is then used. When the context closes, singletons get `@PreDestroy`, `DisposableBean.destroy()` and the custom destroy method.

</details>

### Q2. What are `@PostConstruct` and `@PreDestroy` used for?

<details>
<summary>Answer</summary>

`@PostConstruct` marks a method that runs once after all dependencies are injected — for validation or building internal state. `@PreDestroy` marks a method that runs before a singleton is removed at context shutdown — for releasing resources. Both come from `jakarta.annotation` (Spring Boot 3+), not `javax.annotation`.

</details>

### Q3. Why is an `@Autowired` field `null` inside the constructor?

<details>
<summary>Answer</summary>

Field injection happens after the object is constructed — the container cannot set fields of an object that does not exist yet. Only constructor parameters are available in the constructor. Use constructor injection, or move the logic to `@PostConstruct`.

</details>

## Intermediate

### Q4. What is a `BeanPostProcessor`? Give real examples.

<details>
<summary>Answer</summary>

An extension point called for every bean, before and after its initialisation callbacks; it can modify the bean or return a different object. Examples: `AutowiredAnnotationBeanPostProcessor` (processes `@Autowired`/`@Value`), `CommonAnnotationBeanPostProcessor` (`@PostConstruct`/`@PreDestroy`), the AOP auto-proxy creator (wraps beans for `@Transactional`, `@Async`, aspects), and `MethodValidationPostProcessor` (`@Validated`).

</details>

### Q5. Why are destroy callbacks not called for prototype beans?

<details>
<summary>Answer</summary>

The container creates a prototype, initialises it and hands it to the caller without keeping a reference. Since it does not track the instance, it cannot destroy it. The code that obtained the prototype owns its cleanup.

</details>

### Q6. Where should you put logic that must run once the application is fully started?

<details>
<summary>Answer</summary>

In an `ApplicationRunner`/`CommandLineRunner` bean or an `@EventListener(ApplicationReadyEvent.class)` method. `@PostConstruct` runs while the context is still being built, before every bean exists and before the web server is ready; failures there abort startup.

</details>

## Advanced

### Q7. A `@Transactional` method is called from `@PostConstruct` of the same bean. Does it run in a transaction?

<details>
<summary>Answer</summary>

No. `@PostConstruct` runs on the raw target object before `postProcessAfterInitialization` creates the proxy, and in any case `this.method()` bypasses proxies. Run such logic in an `ApplicationRunner` that calls the bean through its injected (proxied) reference, or use `TransactionTemplate` explicitly.

</details>

### Q8. Why should `@Bean` methods that return a `BeanPostProcessor` be `static`?

<details>
<summary>Answer</summary>

Post-processors must be instantiated very early, before ordinary beans, so that they can process them. A non-static `@Bean` method requires its configuration class to be instantiated first, which drags that class (and its own dependencies) into early creation, where they miss post-processing — Spring logs "is not eligible for getting processed by all BeanPostProcessors". A static method can be invoked without instantiating the configuration class.

</details>

### Q9. In what order do the three initialisation callbacks run, and why does that order exist?

<details>
<summary>Answer</summary>

`@PostConstruct` → `InitializingBean.afterPropertiesSet()` → custom `initMethod`. `@PostConstruct` is handled by a `BeanPostProcessor` during the before-initialisation phase, while `afterPropertiesSet` and the init method are invoked by the bean factory's own `invokeInitMethods` step that follows it. Destruction mirrors this: `@PreDestroy` → `destroy()` → custom destroy method.

</details>

### Q10. Does `@PreDestroy` run when the application is stopped?

<details>
<summary>Answer</summary>

On a graceful stop, yes: Spring Boot registers a JVM shutdown hook that closes the context on normal exit or `SIGTERM` (for example `docker stop` or a Kubernetes pod termination), which runs singleton destroy callbacks. It does not run on `SIGKILL` (`kill -9`), an out-of-memory crash or a power loss, so never rely on it for data that must not be lost.

</details>
