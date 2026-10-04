# Transactional Pitfalls and Self-Invocation — Interview Questions

## Beginner

### Q1. Why does `@Transactional` sometimes appear not to work?

<details>
<summary>Answer</summary>

Because it is applied by a proxy, and the call did not go through the proxy or the transaction ended differently than expected: the method is called from the same class (self-invocation), is private, belongs to an object created with `new`, runs on another thread, the exception was caught inside the method, the exception is checked (commit by default), the wrong transaction manager is used, or the annotation is the wrong one.

</details>

### Q2. What is the self-invocation problem?

<details>
<summary>Answer</summary>

When a method of a bean calls another method of the same bean via `this`, the call goes directly to the target object and skips the proxy, so annotations handled by the proxy (`@Transactional`, `@Async`, `@Cacheable`, `@PreAuthorize`) on the called method are ignored.

</details>

## Intermediate

### Q3. How do you fix self-invocation?

<details>
<summary>Answer</summary>

Move the transactional method into a separate bean and inject it; or annotate the outer entry method so the whole flow runs in one transaction; or use `TransactionTemplate` for an explicit boundary. Self-injection or `AopContext.currentProxy()` also work but hide the design problem, and AspectJ weaving removes the limitation at the cost of build/runtime weaving.

</details>

### Q4. A method catches an exception and logs it. Does the transaction roll back?

<details>
<summary>Answer</summary>

No. The proxy only sees what escapes the method; a caught exception means a normal return, so the transaction commits whatever work was done. Rethrow (or throw a domain exception), or call `TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()` if you must return normally.

</details>

### Q5. Why might a `@Transactional` method called from `@PostConstruct` not run in a transaction?

<details>
<summary>Answer</summary>

`@PostConstruct` runs on the raw bean during initialisation, before the proxy is created in `postProcessAfterInitialization`, and the call is internal anyway. Do such work in an `ApplicationRunner` or an `ApplicationReadyEvent` listener that calls the proxied bean.

</details>

## Advanced

### Q6. How would you check at runtime whether a method actually runs in a transaction?

<details>
<summary>Answer</summary>

Call `TransactionSynchronizationManager.isActualTransactionActive()` (and `getCurrentTransactionName()`) inside it, enable TRACE logging for `org.springframework.transaction.interceptor` and DEBUG for the transaction manager, and verify that the injected bean is a proxy with `AopUtils.isAopProxy`. In tests, assert behaviour by forcing a failure and checking that data was rolled back.

</details>

### Q7. Two data sources exist and a transactional method writes to the secondary database, but rollback does not undo the writes. Why?

<details>
<summary>Answer</summary>

`@Transactional` without a qualifier uses the primary transaction manager, bound to the primary data source. Writes through the secondary data source run on connections not managed by that transaction (effectively auto-commit). Specify the right manager (`@Transactional("reportingTransactionManager")`); a single atomic transaction across both databases would require XA/JTA or a different design (outbox, saga).

</details>

### Q8. Why does `@Transactional` on an interface method sometimes stop working after enabling class-based proxies?

<details>
<summary>Answer</summary>

Annotation lookup on interfaces works with interface-based (JDK) proxies; with class-based proxies Spring also resolves interface annotations in modern versions, but annotating interfaces has historically been fragile (and AspectJ mode ignores interface annotations). The recommended practice is to annotate the concrete class or its methods.

</details>
