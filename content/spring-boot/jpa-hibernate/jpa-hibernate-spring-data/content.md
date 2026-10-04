# JPA vs Hibernate vs Spring Data JPA

**Module:** Spring Data JPA and Hibernate · **Interview priority:** Core

## Definition

- **JPA (Jakarta Persistence API)** is a **specification**: a set of interfaces, annotations and rules for object-relational mapping in Java (`@Entity`, `EntityManager`, JPQL, entity lifecycle). It contains no working implementation.
- **Hibernate (Hibernate ORM)** is an **implementation** of JPA — a library that does the actual work: maps entities to tables, generates SQL, manages the persistence context, caches, lazy loading. It also has features beyond JPA (its own `Session` API, HQL extensions, `@BatchSize`, filters, statistics).
- **Spring Data JPA** is a **Spring abstraction on top of JPA**: you declare repository interfaces (`interface OrderRepository extends JpaRepository<Order, Long>`) and Spring generates their implementations — CRUD, paging, derived queries — which call the `EntityManager`, which Hibernate implements.

## Why It Matters

- "What is the difference between JPA, Hibernate and Spring Data JPA?" is asked in almost every Spring Boot interview, and many candidates blur them.
- Knowing the layers tells you where a problem lives: a slow query (Hibernate SQL), a missing transaction (Spring), a wrong derived method name (Spring Data).

## What Is JPA?

JPA defines:

| Part | Examples |
|------|----------|
| Mapping annotations | `@Entity`, `@Table`, `@Id`, `@GeneratedValue`, `@Column`, `@OneToMany`, `@ManyToOne`, `@Version` |
| Runtime API | `EntityManager` (`persist`, `find`, `merge`, `remove`, `createQuery`), `EntityManagerFactory`, `EntityTransaction` |
| Query languages | **JPQL** (object-oriented SQL over entities), Criteria API |
| Semantics | Entity states, persistence context, flush modes, cascading, fetch types, locking |

It was `javax.persistence` (Java EE, JPA 2.x) and is now `jakarta.persistence` (Jakarta Persistence 3.x). Spring Boot 3 uses 3.1; Boot 4 uses 3.2.

## What Is Hibernate?

The most widely used JPA provider and Spring Boot's default. Hibernate:

- Builds SQL for your database **dialect** (PostgreSQL, MySQL, Oracle…).
- Implements the **persistence context** (first-level cache), **dirty checking**, **lazy loading through proxies**, flushing and batching.
- Adds non-standard features: `@BatchSize`, `@Fetch(FetchMode.SUBSELECT)`, `@NaturalId`, filters, statistics, second-level cache integration, `StatementInspector`.

Other JPA providers exist — EclipseLink is the reference implementation — but are rare in Spring Boot projects.

## JPA vs Hibernate

| Aspect | JPA | Hibernate |
|--------|-----|-----------|
| Kind | Specification (API + rules) | Implementation (library) |
| Can run on its own | No — needs a provider | Yes |
| Package | `jakarta.persistence.*` | `org.hibernate.*` |
| Main API | `EntityManager` | `Session` (which *extends* `EntityManager`) |
| Query language | JPQL | HQL (a superset of JPQL) |
| Portability | Code using only JPA can switch providers | Hibernate-specific features lock you in |
| Extras | — | Batch fetching, filters, natural ids, statistics, many custom annotations |

Analogy: JPA is like JDBC's `java.sql` interfaces; Hibernate is like the PostgreSQL JDBC driver that implements them — except Hibernate is far more than a driver.

## Spring Data JPA

```java
import java.util.List;
import java.util.Optional;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

@Entity
class Customer {
    @Id
    @GeneratedValue
    Long id;
    String email;
    String city;
}

interface CustomerRepository extends JpaRepository<Customer, Long> {   // no implementation class

    Optional<Customer> findByEmail(String email);                       // derived query

    List<Customer> findByCityOrderByEmailAsc(String city);

    @Query("select c from Customer c where c.email like %:domain")       // JPQL
    List<Customer> findByEmailDomain(String domain);
}
```

At startup Spring Data creates a proxy for `CustomerRepository` backed by `SimpleJpaRepository`, which uses the `EntityManager`. Method names are parsed into JPQL; `@Query` strings are validated at startup.

What Spring Data JPA adds over plain JPA:

- Generated CRUD (`save`, `findById`, `findAll`, `deleteById`, `count`), paging and sorting.
- Derived queries from method names, `@Query`, projections, specifications, `@EntityGraph`, auditing (`@CreatedDate`).
- Default transactions on repository methods (`SimpleJpaRepository` is `@Transactional(readOnly = true)`, write methods `@Transactional`).
- Exception translation to `DataAccessException`.

Spring Data JPA **does not replace** JPA or Hibernate: it generates code that calls them.

## The Three Together

```text
Your service
   │  orderRepository.findByStatus(SHIPPED)
   ▼
Spring Data JPA      repository proxy → SimpleJpaRepository / query derivation → JPQL
   │  entityManager.createQuery("select o from Order o where o.status = :status")
   ▼
JPA (API)            jakarta.persistence.EntityManager  (interface)
   │  implemented by
   ▼
Hibernate ORM        Session: persistence context, SQL generation, dirty checking, lazy proxies
   │  select o1_0.id, ... from orders o1_0 where o1_0.status=?
   ▼
JDBC + HikariCP      connection pool, PreparedStatement
   ▼
Database (PostgreSQL)
```

And Spring Framework's `JpaTransactionManager` binds an `EntityManager` to each transaction so all repositories in one `@Transactional` method share one persistence context.

## Comparison: JPA vs Hibernate vs Spring Data JPA

| | JPA | Hibernate | Spring Data JPA |
|--|-----|-----------|-----------------|
| What | Specification | ORM implementation of JPA | Repository abstraction over JPA |
| Provides | Annotations, `EntityManager` API, JPQL, rules | SQL generation, persistence context, caching, proxies | Repository interfaces, derived queries, paging, auditing |
| Owner | Jakarta EE (Eclipse Foundation) | Red Hat / Hibernate team | Spring team |
| Works without the others | No (needs a provider) | Yes (native or as JPA provider) | No (needs JPA + a provider) |
| You write | Entities, JPQL, `EntityManager` calls | Same, optionally Hibernate-specific APIs | Repository interfaces |
| Typical question it answers | "How do I map and query objects?" | "What SQL runs and when?" | "How do I avoid writing DAO boilerplate?" |
| Starter | — | Pulled in by `spring-boot-starter-data-jpa` | `spring-boot-starter-data-jpa` |

## Common Mistakes

- Saying "we used Hibernate" when the project only used Spring Data repositories — be precise: Spring Data JPA with Hibernate as the provider.
- Importing `org.hibernate.annotations.*` when a JPA annotation exists, losing portability without need.
- Assuming Spring Data generates SQL itself — Hibernate generates the SQL.
- Mixing legacy `javax.persistence` with `jakarta.persistence`.

## Common Interview Traps

- **"JPA is a framework."** It is a specification; Hibernate is the framework implementing it.
- **"Hibernate and Spring Data JPA are alternatives."** Spring Data JPA uses JPA, and Hibernate is the JPA provider underneath.
- **"Spring Data JPA works with any database without SQL knowledge."** It still produces SQL through Hibernate; performance problems (N+1, missing indexes) are SQL problems.

## Key Takeaways

- JPA = specification (`jakarta.persistence`); Hibernate = implementation; Spring Data JPA = repositories on top of JPA.
- Call chain: repository proxy → `EntityManager` (JPA API) → Hibernate `Session` → JDBC → database.
- Each layer adds something different: rules, SQL/persistence-context engine, boilerplate removal.
