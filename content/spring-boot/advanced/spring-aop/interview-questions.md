# Aspect-Oriented Programming — Interview Questions

## Beginner

### Q1. What is AOP?

<details>
<summary>Answer</summary>

Aspect-Oriented Programming separates cross-cutting concerns — logging, security, transactions, metrics — from business logic into aspects that are applied to many methods declaratively, instead of repeating that code in every method.

</details>

### Q2. Define aspect, join point, pointcut and advice.

<details>
<summary>Answer</summary>

An aspect is a module containing cross-cutting logic. A join point is a point in execution where it can apply — in Spring AOP, a method execution. A pointcut is an expression selecting join points. Advice is the action taken at selected join points (before, after returning, after throwing, after/finally, around).

</details>

### Q3. What types of advice exist?

<details>
<summary>Answer</summary>

`@Before`, `@AfterReturning` (normal return, can read the result), `@AfterThrowing` (exception, can read it), `@After` (always, like `finally`) and `@Around` (wraps the call, decides whether and how to call `proceed()`, can change arguments and the result).

</details>

## Intermediate

### Q4. How does Spring implement AOP?

<details>
<summary>Answer</summary>

With runtime proxies. A `BeanPostProcessor` (the AspectJ auto-proxy creator) checks every bean against the pointcuts of registered aspects (and Spring's own advisors) and wraps matching beans in a JDK dynamic proxy or a CGLIB subclass proxy. Calls through the proxy pass through a chain of method interceptors before reaching the target.

</details>

### Q5. What is the difference between Spring AOP and AspectJ?

<details>
<summary>Answer</summary>

Spring AOP works with proxies at runtime, supports only method-execution join points on Spring beans, and cannot intercept self-invocation or private/final methods. AspectJ weaves bytecode at compile or load time, supports many join points (field access, constructors, static methods, self-calls) and works on any object, but needs a weaving setup. Spring AOP borrows AspectJ's annotations and pointcut language.

</details>

### Q6. Give real uses of AOP in a Spring Boot application.

<details>
<summary>Answer</summary>

Spring's own `@Transactional`, `@Async`, `@Cacheable`, `@PreAuthorize`, `@Retryable` and `@Validated` method validation; plus custom aspects for execution timing, audit logging of sensitive operations, adding MDC context, rate limiting per method, feature toggles, or translating exceptions in an infrastructure layer.

</details>

## Advanced

### Q7. Why does an aspect not apply when a method is called from another method in the same class?

<details>
<summary>Answer</summary>

The proxy wraps the bean from outside; once inside the target object, `this.otherMethod()` is a plain Java call that never passes through the proxy's interceptor chain. Move the method to another bean or restructure so the advised method is called from outside.

</details>

### Q8. How do you control the order of multiple aspects?

<details>
<summary>Answer</summary>

Annotate aspect classes with `@Order` (or implement `Ordered`): lower values have higher precedence, run first "on the way in" and last "on the way out". For example, a security or retry aspect may need to wrap the transaction interceptor (retry outside the transaction) — set orders so the retry advice has higher precedence than `@Transactional`.

</details>
