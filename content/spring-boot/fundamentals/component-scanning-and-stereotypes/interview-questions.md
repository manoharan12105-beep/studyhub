# Component Scanning and Stereotype Annotations — Interview Questions

## Beginner

### Q1. What is component scanning?

<details>
<summary>Answer</summary>

The container scanning configured packages for classes annotated with `@Component` or an annotation meta-annotated with it (`@Service`, `@Repository`, `@Controller`, `@Configuration`…) and registering each as a bean. It is enabled with `@ComponentScan`, which `@SpringBootApplication` includes.

</details>

### Q2. What is the difference between `@Component`, `@Service`, `@Repository` and `@Controller`?

<details>
<summary>Answer</summary>

All four register a bean via scanning. `@Component` is generic. `@Service` marks business logic and adds no behaviour. `@Repository` marks data access and enables exception translation of persistence exceptions into Spring's `DataAccessException` hierarchy. `@Controller` marks a Spring MVC controller whose handler methods are mapped to requests. Using the specific annotation documents the layer and allows aspects or filters to target it.

</details>

### Q3. What is the difference between `@Controller` and `@RestController`?

<details>
<summary>Answer</summary>

`@RestController` is `@Controller` combined with `@ResponseBody`. With `@Controller`, a returned `String` is a view name resolved by a `ViewResolver` (server-side rendering, e.g. Thymeleaf). With `@RestController`, return values are serialised into the response body by an `HttpMessageConverter` (JSON via Jackson).

</details>

## Intermediate

### Q4. Which packages does Spring Boot scan by default?

<details>
<summary>Answer</summary>

The package of the class annotated with `@SpringBootApplication` and all its sub-packages. Classes in sibling or parent packages are not found unless you set `scanBasePackages`, add another `@ComponentScan`, or register them with `@Bean`/`@Import`. The same base package is also used by default for scanning JPA entities and Spring Data repositories.

</details>

### Q5. What exactly does `@Repository` translate, and how?

<details>
<summary>Answer</summary>

A `PersistenceExceptionTranslationPostProcessor` adds a proxy around `@Repository` beans. When a method throws a native persistence exception (for example a Hibernate `ConstraintViolationException` or a JPA `PersistenceException`), the proxy asks the registered `PersistenceExceptionTranslator`s to convert it into a subclass of `DataAccessException`, such as `DataIntegrityViolationException`. Service code can then handle data errors without depending on JDBC or Hibernate types.

</details>

### Q6. Do Spring Data JPA repository interfaces need `@Repository`?

<details>
<summary>Answer</summary>

No. Spring Data detects interfaces extending `Repository` (and its sub-interfaces) through its own repository scanning, creates proxy implementations, and applies exception translation automatically. Adding `@Repository` is harmless but redundant.

</details>

## Advanced

### Q7. How can you create a custom stereotype annotation, and why would you?

<details>
<summary>Answer</summary>

Declare an annotation with `@Target(TYPE)`, `@Retention(RUNTIME)` and meta-annotate it with `@Component` (or `@Service`). Classes using it are picked up by scanning. Teams use this to express architecture (`@UseCase`, `@Adapter`), to combine several annotations into one, or to target the classes with aspects and architecture tests.

</details>

### Q8. Does component scanning load every class it inspects?

<details>
<summary>Answer</summary>

No. `ClassPathBeanDefinitionScanner` reads class files with ASM-based metadata readers and checks their annotations without loading the classes into the JVM. Only matching classes become bean definitions and are loaded when instantiated. For very large applications, Spring also supports an optional build-time candidate index (`spring-context-indexer`), now deprecated in favour of AOT processing.

</details>

### Q9. A `@Controller` method returns `"order created"` and the client receives an error instead of the text. Why?

<details>
<summary>Answer</summary>

Without `@ResponseBody`, the return value is interpreted as a view name. Spring tries to resolve a view called `order created`; with no view resolver match, the request fails (typically with an error page or 500). Annotate the method or class with `@ResponseBody`, or use `@RestController`.

</details>
