# Spring Proxies: JDK Dynamic Proxies and CGLIB — Interview Questions

## Beginner

### Q1. What is a proxy in Spring?

<details>
<summary>Answer</summary>

An object Spring injects in place of a bean that intercepts method calls, runs additional behaviour (transactions, security, caching, async execution, aspects) and delegates to the real object. It is created by a `BeanPostProcessor` when the bean needs such behaviour.

</details>

### Q2. What is the difference between JDK dynamic proxies and CGLIB proxies?

<details>
<summary>Answer</summary>

A JDK dynamic proxy implements the target's interfaces and can only be used through those interfaces. A CGLIB proxy is a generated subclass of the target class, so it can be injected as the concrete class, but cannot intercept final or private methods or proxy final classes. Spring Boot uses CGLIB by default.

</details>

## Intermediate

### Q3. Why does Spring Boot default to CGLIB proxies?

<details>
<summary>Answer</summary>

To avoid surprises where a bean that implements an interface is proxied with a JDK proxy and then cannot be injected or cast as its concrete class (`BeanNotOfRequiredTypeException`). `spring.aop.proxy-target-class=true` makes proxies subclasses, which work for both interface and class injection points.

</details>

### Q4. Which Spring features rely on proxies, and what limitation do they share?

<details>
<summary>Answer</summary>

`@Transactional`, `@Async`, `@Cacheable`/`@CacheEvict`, `@PreAuthorize`, `@Validated` method validation, `@Retryable`, custom `@Aspect`s, scoped proxies and `@Lazy` injection. They share the limitation that only calls entering through the proxy are intercepted: self-invocation, private methods, final methods (CGLIB) and objects not created by Spring are not.

</details>

## Advanced

### Q5. A test reads `orderService.counter` directly and always gets `null`, although methods increment it. Why?

<details>
<summary>Answer</summary>

The injected `orderService` is a CGLIB proxy — a separate subclass instance whose fields are never initialised; method calls are forwarded to the real target, whose field holds the value. Access state through methods (or use `AopTestUtils.getTargetObject`).

</details>

### Q6. How does Spring avoid calling a bean's constructor twice when creating a CGLIB proxy?

<details>
<summary>Answer</summary>

It instantiates the generated subclass using Objenesis, which creates an instance without invoking constructors. This is why proxies have uninitialised fields and why constructor side effects are not repeated.

</details>

### Q7. What would you do if you needed advice on self-invocations or private methods?

<details>
<summary>Answer</summary>

Prefer redesign (move the method to another bean). Otherwise use AspectJ weaving (compile-time or load-time), which modifies the bytecode of the class itself, so internal calls and private methods can be advised; Spring supports AspectJ mode for transactions and caching (`mode = AdviceMode.ASPECTJ`).

</details>
