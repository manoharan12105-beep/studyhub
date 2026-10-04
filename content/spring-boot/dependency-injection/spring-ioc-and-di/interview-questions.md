# IoC and Dependency Injection in Spring — Interview Questions

## Beginner

### Q1. What is Inversion of Control?

<details>
<summary>Answer</summary>

A principle where control over object creation, wiring and program flow is moved from application code to a framework. In Spring, the container creates and wires beans, and the framework calls your code (controllers, listeners, scheduled methods) rather than your code driving everything from `main`.

</details>

### Q2. What is dependency injection in Spring?

<details>
<summary>Answer</summary>

The container supplies a bean's dependencies instead of the bean creating them. A class declares what it needs — typically as constructor parameters — and Spring finds matching beans by type and passes them in. This decouples classes from concrete implementations and makes them easy to test.

</details>

### Q3. What is the difference between IoC and DI?

<details>
<summary>Answer</summary>

IoC is the general principle of handing control to a framework; DI is a specific pattern that applies IoC to obtaining dependencies. Spring's container is an IoC container that performs DI. Other IoC forms are event listeners, template methods (`JdbcTemplate` calling your `RowMapper`) and lifecycle callbacks.

</details>

## Intermediate

### Q4. How does DI relate to the Dependency Inversion Principle?

<details>
<summary>Answer</summary>

DIP says high-level code should depend on abstractions it owns, not on concrete low-level classes. DI is the mechanism that supplies the concrete implementation at runtime. You can use DI with concrete types (still coupled) or follow DIP without a container (manual wiring); together they give loose coupling and simple wiring.

</details>

### Q5. What are the advantages of DI?

<details>
<summary>Answer</summary>

Loose coupling (classes know interfaces, not implementations), testability (pass fakes through constructors), single place for wiring decisions (configuration), easy switching of implementations per environment or profile, and consistent lifecycle and proxy support (transactions, security) because the container creates the objects.

</details>

### Q6. What happens at startup if a required dependency has no matching bean?

<details>
<summary>Answer</summary>

The context refresh fails with `UnsatisfiedDependencyException` (cause: `NoSuchBeanDefinitionException`), and the application does not start. Spring Boot prints a failure analysis such as "Parameter 0 of constructor in CheckoutService required a bean of type 'PaymentGateway' that could not be found", with a suggested action.

</details>

## Advanced

### Q7. Spring resolves dependencies by type. How are generic types handled?

<details>
<summary>Answer</summary>

Generics are used as qualifiers. If beans `Repository<Order>` and `Repository<User>` exist, an injection point `Repository<Order>` matches only the first, because Spring compares the full resolvable generic type. This enables patterns such as `Validator<CreateOrderRequest>` beans without names or qualifiers.

</details>

### Q8. Besides single beans, what kinds of injection points does Spring understand?

<details>
<summary>Answer</summary>

`Optional<T>` (empty if no bean), `ObjectProvider<T>` (lazy/optional/multiple lookup), `List<T>`/`Set<T>` and arrays (all beans of the type, in `@Order` order for lists), `Map<String, T>` (bean name to bean), and `@Lazy` injection points (a proxy that resolves the bean on first use). These are handled by `resolveDependency` in `DefaultListableBeanFactory`.

</details>
