# Constructor, Setter and Field Injection — Interview Questions

## Beginner

### Q1. What are the types of dependency injection in Spring?

<details>
<summary>Answer</summary>

Constructor injection (dependencies passed as constructor arguments), setter injection (`@Autowired` setter called after construction) and field injection (`@Autowired` field set by reflection). Constructor injection is recommended for required dependencies.

</details>

### Q2. Is `@Autowired` required on a constructor?

<details>
<summary>Answer</summary>

Not if the class has exactly one constructor (since Spring 4.3). With multiple constructors, annotate the one Spring should use; otherwise Spring uses the no-argument constructor if present, or fails.

</details>

### Q3. What does `@Autowired(required = false)` do?

<details>
<summary>Answer</summary>

It makes the injection optional: if no matching bean exists, Spring skips that injection point instead of failing. On a field or setter, the existing value (possibly a default) is kept. Modern alternatives are `Optional<T>` or `ObjectProvider<T>` parameters.

</details>

## Intermediate

### Q4. Why is constructor injection preferred over field injection?

<details>
<summary>Answer</summary>

It allows `final` fields (immutability, safe sharing between threads), guarantees the object is fully initialised after construction, makes dependencies explicit in the constructor signature (a long parameter list exposes too many responsibilities), lets unit tests create the class with `new` and fakes without a Spring context or reflection, and makes circular dependencies fail fast at startup.

</details>

### Q5. When is setter injection the right choice?

<details>
<summary>Answer</summary>

For optional dependencies that have a sensible default (a formatter, a metrics recorder), or dependencies that must be changeable after construction. The class must work without the setter being called.

</details>

### Q6. Can you inject a dependency into a static field with `@Autowired`?

<details>
<summary>Answer</summary>

No. `AutowiredAnnotationBeanPostProcessor` ignores static fields and methods (it logs that autowired annotations are not supported on static members). Static state also defeats DI and testing; inject into an instance field of a bean instead.

</details>

## Advanced

### Q7. Why can field-injected circular dependencies sometimes be resolved but constructor-injected ones cannot?

<details>
<summary>Answer</summary>

With field/setter injection, Spring can instantiate bean A with its no-arg constructor, expose an early reference to it (through the singleton factory cache), create bean B, inject the early A into B, then finish A. With constructor injection, A cannot be instantiated until B exists and B cannot be instantiated until A exists, so there is no object to expose early: `BeanCurrentlyInCreationException`. Spring Boot disallows even the resolvable case by default.

</details>

### Q8. A class uses Lombok `@RequiredArgsConstructor` with `final` fields. Which injection type is that, and what is a pitfall?

<details>
<summary>Answer</summary>

Constructor injection: Lombok generates a constructor for all `final` (and `@NonNull`) fields, and Spring uses it as the single constructor. Pitfalls: annotations such as `@Qualifier` or `@Value` on the fields are not copied to constructor parameters unless configured in `lombok.config` (`lombok.copyableAnnotations`), so qualifiers can be silently lost; and adding a non-final field leaves it uninjected.

</details>
