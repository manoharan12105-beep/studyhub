# @Transactional: Boundaries, Rollback Rules and Proxies — Interview Questions

## Beginner

### Q1. How does `@Transactional` work internally?

<details>
<summary>Answer</summary>

Spring creates a proxy around the bean. When a transactional method is called through the proxy, a `TransactionInterceptor` reads the annotation's attributes, asks the `PlatformTransactionManager` to start or join a transaction (binding the connection/EntityManager to the current thread), invokes the real method, and then commits — or rolls back if a matching exception is thrown.

</details>

### Q2. On which exceptions does Spring roll back by default?

<details>
<summary>Answer</summary>

On unchecked exceptions — `RuntimeException` and its subclasses — and `Error`. Checked exceptions cause a commit unless configured with `rollbackFor`. Exceptions caught inside the method never reach the proxy and therefore cause a commit.

</details>

### Q3. What does `readOnly = true` do?

<details>
<summary>Answer</summary>

It marks the transaction as read-only: with JPA, Hibernate switches to manual flush and read-only sessions (no dirty checking or snapshots), the JDBC connection is set read-only (drivers/databases may optimise or route to replicas), and accidental writes through the persistence context are not flushed. It is an optimisation and intent marker, not a security control.

</details>

## Intermediate

### Q4. A `@Transactional` method throws a checked exception after inserting a row. Is the row committed? How do you change it?

<details>
<summary>Answer</summary>

Yes, by default it is committed. Use `@Transactional(rollbackFor = MyCheckedException.class)` (or `Exception.class`), convert the exception to an unchecked one, call `setRollbackOnly()`, or in Spring 6.2+ set `@EnableTransactionManagement(rollbackOn = RollbackOn.ALL_EXCEPTIONS)` globally.

</details>

### Q5. Which transaction manager does Spring Boot use?

<details>
<summary>Answer</summary>

It auto-configures one based on the classpath: `JpaTransactionManager` when Spring Data JPA/Hibernate is used, `JdbcTransactionManager`/`DataSourceTransactionManager` for plain JDBC, and reactive or JTA managers in those setups. With several data sources you define a manager per data source and select it with `@Transactional("ordersTransactionManager")`.

</details>

### Q6. When would you use `TransactionTemplate` instead of `@Transactional`?

<details>
<summary>Answer</summary>

When the boundary must be smaller or dynamic — committing per chunk in a batch loop, deciding propagation at runtime, or wrapping code inside a single method (avoiding self-invocation issues). It also makes the boundary explicit in code where proxies cannot be used.

</details>

## Advanced

### Q7. Can `@Transactional` be used on private methods?

<details>
<summary>Answer</summary>

No. Proxies cannot intercept private methods (and calls to them are internal anyway). Since Spring Framework 6.0, class-based (CGLIB) proxies intercept protected and package-private methods too, but public methods remain the convention. AspectJ weaving mode (`@EnableTransactionManagement(mode = AdviceMode.ASPECTJ)`) can handle any method, including self-invocation, at the cost of a weaving setup.

</details>

### Q8. Why does a transaction not cover work done in an `@Async` method or a parallel stream inside it?

<details>
<summary>Answer</summary>

Transaction resources (the JDBC connection, the EntityManager) are bound to the current thread through `TransactionSynchronizationManager`'s `ThreadLocal`s. Code running on another thread finds no bound transaction and gets its own connection — or none — so its work is not part of the caller's transaction and is not rolled back with it.

</details>

### Q9. What happens when the commit itself fails?

<details>
<summary>Answer</summary>

The exception surfaces from the proxy after the method body finished — for JPA often at flush during commit (constraint violation, optimistic lock failure), translated into a `DataAccessException` or `TransactionSystemException`. The caller must handle it; code inside the method could not, because the failure happened after it returned.

</details>
