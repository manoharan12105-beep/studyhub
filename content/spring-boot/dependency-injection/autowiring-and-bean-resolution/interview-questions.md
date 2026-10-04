# @Autowired, @Qualifier and @Primary — Interview Questions

## Beginner

### Q1. What does `@Autowired` do?

<details>
<summary>Answer</summary>

It marks an injection point — a constructor, method/setter or field — that Spring should satisfy with a bean from the container. Spring resolves the dependency by type and injects it while creating the bean. It is not needed on a class's only constructor.

</details>

### Q2. What is `@Qualifier` used for?

<details>
<summary>Answer</summary>

To choose a specific bean when several beans of the same type exist. Placed on the injection point (`@Qualifier("stripeGateway") PaymentGateway gateway`), it restricts candidates to the bean with that name or qualifier value.

</details>

### Q3. What is `@Primary` used for?

<details>
<summary>Answer</summary>

It marks one bean as the default candidate for its type. When an injection point matches several beans and has no qualifier, the primary bean is injected.

</details>

## Intermediate

### Q4. What is the difference between `@Primary` and `@Qualifier`?

<details>
<summary>Answer</summary>

`@Primary` is declared on the bean and sets a global default for its type. `@Qualifier` is declared at the injection point and selects one bean for that place only. If both apply, `@Qualifier` wins. Use `@Primary` for the normal case and `@Qualifier` for the exceptions.

</details>

### Q5. Does Spring autowire by type or by name?

<details>
<summary>Answer</summary>

By type. Names are used only as a tie-breaker (after `@Qualifier`, `@Primary` and `@Priority`), by comparing the parameter or field name with bean names. Explicit `@Qualifier` is preferable to relying on names, because renaming a variable should not change behaviour.

</details>

### Q6. How do you inject all implementations of an interface?

<details>
<summary>Answer</summary>

Inject `List<T>` (or `Set<T>`, an array) to get every bean of type `T`, ordered by `@Order`/`Ordered` for lists, or `Map<String, T>` to get bean names as keys. This is the usual way to implement strategy or chain-of-responsibility patterns: new implementations are picked up automatically.

</details>

### Q7. How do you inject an optional dependency?

<details>
<summary>Answer</summary>

`Optional<T>` (empty if missing), `ObjectProvider<T>` with `getIfAvailable()`/`ifAvailable(...)` (also lazy), `@Autowired(required = false)` on a setter or field, or a `@Nullable` parameter. `ObjectProvider` is the most flexible because it also handles multiple candidates (`getIfUnique`) and on-demand creation.

</details>

## Advanced

### Q8. What happens when Spring finds two beans implementing the same interface?

<details>
<summary>Answer</summary>

For a single-valued injection point, Spring narrows the candidates: a `@Qualifier` on the injection point filters them; otherwise a single `@Primary` bean is chosen; otherwise the highest `@Priority`; otherwise a bean whose name matches the parameter or field name. If none applies, startup fails with `NoUniqueBeanDefinitionException: expected single matching bean but found 2`. Collection injection points (`List`, `Map`) simply receive both.

</details>

### Q9. Two beans are `@Primary` for the same type. What happens?

<details>
<summary>Answer</summary>

Injection points without a qualifier fail with `NoUniqueBeanDefinitionException` ("more than one 'primary' bean found among candidates"). Qualified injection points still work. Keep exactly one primary per type, or use Spring 6.2's `@Fallback` on the less preferred bean instead.

</details>

### Q10. A bean has `@Primary`, but a constructor parameter is named after another bean of the same type. Which one is injected?

<details>
<summary>Answer</summary>

The `@Primary` bean. Primary is evaluated before the name fallback, so the parameter name does not help. To get the other bean, annotate the parameter with `@Qualifier("otherBean")`.

</details>

### Q11. Why might name-based autowiring work in your IDE but not in a manually compiled build?

<details>
<summary>Answer</summary>

Matching constructor parameters by name needs parameter names in the bytecode, which requires compiling with `-parameters`. Spring Boot's build plugins and most IDE setups enable it; a plain `javac` build does not. Since Spring Framework 6.1, Spring no longer falls back to reading debug information, so the name fallback (and `@PathVariable`/`@RequestParam` without explicit names) silently stops working.

</details>
