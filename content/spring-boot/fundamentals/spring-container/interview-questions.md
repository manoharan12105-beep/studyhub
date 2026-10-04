# Spring Container: BeanFactory and ApplicationContext — Interview Questions

## Beginner

### Q1. What is the Spring IoC container?

<details>
<summary>Answer</summary>

The component that creates and manages beans: it reads bean definitions, instantiates objects, injects their dependencies, runs lifecycle callbacks and applies proxies. In code it is an `ApplicationContext` (which is a `BeanFactory`).

</details>

### Q2. What is the difference between `BeanFactory` and `ApplicationContext`?

<details>
<summary>Answer</summary>

`BeanFactory` is the basic container that creates beans lazily on `getBean` and needs post-processors registered manually. `ApplicationContext` extends it: it pre-instantiates singletons at startup, registers `BeanPostProcessor`s and `BeanFactoryPostProcessor`s automatically (so annotations work), and adds events, i18n (`MessageSource`), resource loading and the `Environment`. Applications use `ApplicationContext`.

</details>

### Q3. Which `ApplicationContext` does a Spring Boot web application use?

<details>
<summary>Answer</summary>

For a servlet (Spring MVC) application, `SpringApplication` creates an `AnnotationConfigServletWebServerApplicationContext`, a context that also creates and starts the embedded web server during refresh. A non-web application gets an `AnnotationConfigApplicationContext`, and a WebFlux application gets a reactive web server context.

</details>

## Intermediate

### Q4. Why does an `ApplicationContext` create singletons eagerly?

<details>
<summary>Answer</summary>

To fail fast. Missing beans, unresolved properties, circular constructor dependencies and invalid configuration are detected during `refresh()`, so the application does not start instead of failing on the first request. It also moves expensive initialisation (connection pools, caches) out of request handling.

</details>

### Q5. What is a `BeanDefinition`?

<details>
<summary>Answer</summary>

The metadata recipe for a bean: its class or factory method, scope, constructor arguments and property values, lazy flag, primary flag, and init/destroy methods. The container collects all bean definitions first, lets `BeanFactoryPostProcessor`s modify them, and only then creates instances.

</details>

### Q6. What is the difference between a `BeanFactoryPostProcessor` and a `BeanPostProcessor`?

<details>
<summary>Answer</summary>

A `BeanFactoryPostProcessor` runs **before any bean is created** and works on **bean definitions** — for example, `ConfigurationClassPostProcessor` parses `@Configuration` classes and component scans, and placeholder configurers resolve `${...}`. A `BeanPostProcessor` runs **for each bean instance** after it is created, before and after its init callbacks — for example, `AutowiredAnnotationBeanPostProcessor` performs field injection and the auto-proxy creator wraps beans in AOP proxies.

</details>

### Q7. Why is calling `applicationContext.getBean()` in business code discouraged?

<details>
<summary>Answer</summary>

It is the service-locator pattern: dependencies are hidden inside method bodies, the class is coupled to Spring, and unit tests need a container. Constructor injection makes the dependency explicit. `getBean` is acceptable only in framework-level code or when choosing a bean dynamically by name at runtime (and even then `Map<String, T>` injection or `ObjectProvider` is usually better).

</details>

## Advanced

### Q8. What happens during `ApplicationContext.refresh()`?

<details>
<summary>Answer</summary>

In order: prepare the bean factory; invoke `BeanFactoryPostProcessor`s (configuration-class parsing, component scanning, auto-configuration imports, placeholder resolution); register `BeanPostProcessor`s; initialise the `MessageSource` and event multicaster; call `onRefresh()` (Spring Boot creates the embedded web server here); register listeners; pre-instantiate all non-lazy singletons; finish refresh (start lifecycle beans, publish `ContextRefreshedEvent`). Spring Boot starts the web server as part of finishing the refresh.

</details>

### Q9. Can there be more than one `ApplicationContext` in an application?

<details>
<summary>Answer</summary>

Yes. Contexts can form a parent–child hierarchy: a child can resolve beans from its parent but not the reverse. Classic Spring MVC used a root context (services, repositories) and a `DispatcherServlet` child context (controllers). Spring Boot uses a single context by default; Actuator can use a child context when management runs on a separate port. Accidentally creating extra contexts duplicates singletons.

</details>

### Q10. A bean is annotated `@Lazy`. When is it created, and what is the risk?

<details>
<summary>Answer</summary>

On first use — when another bean that needs it is created, or when `getBean` is called. If it is injected into an eager singleton, Spring injects a lazy-resolution proxy only when the injection point is also marked `@Lazy`; otherwise the dependency forces creation at startup anyway. The risk is that configuration errors surface at runtime, possibly on a production request, instead of at startup.

</details>
