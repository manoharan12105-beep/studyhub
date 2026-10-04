# JPA vs Hibernate vs Spring Data JPA — Interview Questions

## Beginner

### Q1. What is the difference between JPA, Hibernate and Spring Data JPA?

<details>
<summary>Answer</summary>

JPA is the Jakarta Persistence specification — annotations, the `EntityManager` API, JPQL and lifecycle rules — with no implementation. Hibernate is an ORM library that implements JPA: it generates SQL, manages the persistence context, dirty checking and lazy loading. Spring Data JPA is a Spring abstraction that generates repository implementations from interfaces; those implementations call the JPA `EntityManager`, which Hibernate implements.

</details>

### Q2. Can you use JPA without Hibernate?

<details>
<summary>Answer</summary>

You need some JPA provider; Hibernate is one, EclipseLink is another. Code written only against `jakarta.persistence` APIs can switch providers. You cannot run JPA alone because it is only a specification.

</details>

### Q3. What does `JpaRepository` provide?

<details>
<summary>Answer</summary>

CRUD methods (`save`, `saveAll`, `findById`, `findAll`, `deleteById`, `count`, `existsById`), paging and sorting (`findAll(Pageable)`, `findAll(Sort)`), batch operations (`deleteAllInBatch`, `saveAllAndFlush`), `flush`, `saveAndFlush` and `getReferenceById`, plus support for derived queries, `@Query`, projections and specifications (with `JpaSpecificationExecutor`).

</details>

## Intermediate

### Q4. What is the relationship between `EntityManager` and Hibernate's `Session`?

<details>
<summary>Answer</summary>

`Session` extends `EntityManager`; Hibernate's session implementation is the object behind the JPA interface. You can obtain it with `entityManager.unwrap(Session.class)` to use Hibernate-specific features, at the cost of portability.

</details>

### Q5. What is the difference between JPQL and HQL?

<details>
<summary>Answer</summary>

Both are object-oriented query languages over entities and their fields rather than tables and columns. JPQL is defined by the JPA specification; HQL is Hibernate's language and is a superset of JPQL with extra functions and syntax. JPQL queries run unchanged on Hibernate.

</details>

### Q6. If Spring Data JPA generates repositories, does it generate SQL?

<details>
<summary>Answer</summary>

No. Spring Data derives JPQL (or Criteria queries) from method names and `@Query` annotations and executes them through the `EntityManager`. Hibernate translates JPQL into SQL for the configured dialect. Native queries are passed through as SQL.

</details>

## Advanced

### Q7. Why does a project need both `spring-data-jpa` and `hibernate-core` on the classpath?

<details>
<summary>Answer</summary>

Spring Data JPA contains repository infrastructure only and depends on the JPA API; it needs a provider at runtime. `spring-boot-starter-data-jpa` brings Spring Data JPA, Hibernate as the provider, and Spring's ORM/transaction support (`JpaTransactionManager`), and Boot auto-configures the `EntityManagerFactory` with Hibernate.

</details>

### Q8. When would you use Hibernate-specific features despite losing portability?

<details>
<summary>Answer</summary>

When they solve real problems that JPA cannot: `@BatchSize`/`default_batch_fetch_size` to fix N+1 loading, `StatementInspector` or statistics for diagnostics, `@NaturalId` lookups, filters for soft deletes or multi-tenancy, and JDBC batching settings. Switching JPA providers is rare in practice, so pragmatic use is acceptable; isolate it in configuration or repository code.

</details>
