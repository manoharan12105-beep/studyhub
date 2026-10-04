# JPA, Hibernate and Transactions

Revision points for persistence with JPA/Hibernate and Spring Data, and for Spring transaction management.

## JPA, Hibernate and Spring Data JPA

- **JPA** (Jakarta Persistence 3.2) = specification (annotations, `EntityManager`, JPQL). **Hibernate** (7.x) = the implementation Boot uses. **Spring Data JPA** = repository abstraction on top.
- `JpaRepository<T, ID>` gives CRUD, paging, sorting; implementations generated at startup.
- `save()` calls `persist` for new entities and `merge` for existing ones (decided via id / `@Version` / `Persistable`).
- `spring.jpa.hibernate.ddl-auto`: use `validate`/`none` + Flyway/Liquibase in production; `create-drop` only for tests.
- `spring.jpa.open-in-view` is true by default (with a warning) — set false for APIs.
- Show SQL via `logging.level.org.hibernate.SQL=debug` (+ `org.hibernate.orm.jdbc.bind=trace`).

## Entities and IDs

- `@Entity` + `@Id`; needs a no-arg constructor (protected is fine), non-final class for lazy proxies.
- `@GeneratedValue`: `IDENTITY` (DB auto-increment, INSERT on persist, no JDBC batching), `SEQUENCE` (preallocation, batching; preferred on PostgreSQL), `UUID`.
- `@Column(nullable, unique, length)`, `@Table`, `@Enumerated(EnumType.STRING)` (never ORDINAL), `@Embedded` value objects.
- `equals/hashCode`: business key, or id-based with constant `hashCode` — never all fields, never lazy collections.
- Avoid Lombok `@Data` on entities (equals/hashCode/toString hit lazy relations).

## Entity Lifecycle and Persistence Context

- States: **transient/new** (not tracked), **managed** (in persistence context), **detached** (context closed or cleared), **removed** (scheduled for delete).
- Persistence context = first-level cache: one instance per id per context; repeated `find` → no extra SQL.
- `persist` (new → managed), `merge` (copies detached state onto a **managed copy** and returns it), `remove`, `detach`/`clear`.
- One context per transaction in Spring (transaction-scoped `EntityManager`).
- `getReference` returns a lazy proxy without SQL.

## Dirty Checking and Flush

- At flush, Hibernate compares managed entities with their snapshots and issues UPDATEs for changes — no `save()` needed inside a transaction.
- Flush happens at commit, before JPQL/HQL queries touching affected tables (AUTO), or on `flush()`.
- Native queries: Hibernate flushes conservatively (whole context) unless a query space is declared.
- Read-only transactions set flush mode MANUAL → changes are not written.
- Flush ≠ commit: flushed SQL can still roll back.
- Bulk `@Modifying` queries bypass the context — use `clearAutomatically`/`flushAutomatically`.

## Relationships

- `@ManyToOne` (owning side, FK column; default EAGER → set LAZY), `@OneToMany(mappedBy)` (inverse side, default LAZY), `@OneToOne`, `@ManyToMany` (join table).
- Owning side writes the FK; changes only on the inverse side are ignored.
- Keep both sides in sync with helper methods (`addItem` sets `item.order = this`).
- Prefer unidirectional `@ManyToOne` + queries over large bidirectional collections.
- `@ManyToMany` with extra columns → explicit join entity.
- Use `Set` or `List` deliberately (bag semantics, multiple-bag fetch issue).

## Cascade and Orphan Removal

- Cascade propagates operations (`PERSIST`, `MERGE`, `REMOVE`, `ALL`) from parent to children.
- Use on true parent–child aggregates (Order → OrderLines), never on `@ManyToOne` to shared entities.
- `orphanRemoval=true` deletes children removed from the collection; `CascadeType.REMOVE` only deletes on parent removal.
- Replacing the collection instance breaks orphan tracking — modify the existing collection.
- Database `ON DELETE CASCADE` is separate from JPA cascade.

## Fetching and Lazy Loading

- Defaults: `*ToOne` EAGER, `*ToMany` LAZY. Recommended: everything LAZY, fetch per use case.
- Lazy = proxy/collection wrapper loaded on first access, needs an open session.
- `LazyInitializationException` = access after the persistence context closed; fix with fetch joins, entity graphs, DTO projections or loading inside the transaction — not with OSIV or EAGER.
- `JOIN FETCH`, `@EntityGraph(attributePaths=…)`, batch fetching (`hibernate.default_batch_fetch_size`).
- Collection fetch + pagination → in-memory paging (HHH90003004 warning); fetch ids first, then entities.

## Spring Data JPA Queries

- Derived queries: `findByEmailAndStatus`, `existsBy`, `countBy`, `deleteBy`, `findTop10ByOrderByCreatedAtDesc`.
- `@Query` with JPQL (entity names/fields) or `nativeQuery = true` (SQL).
- Named parameters `:email` with `@Param` (or `-parameters`).
- `@Modifying` + `@Transactional` for UPDATE/DELETE queries; returns affected rows.
- Return types: entity, `Optional`, `List`, `Page`, `Slice`, `Stream` (inside a transaction), projections.
- Wrong property names fail at **startup** — a useful safety net.

## Projections, Pagination and Specifications

- Interface projections (closed = only listed getters → selective SQL), class/record DTO projections (`select new …` or constructor), dynamic projections (`<T> List<T> findBy…(Class<T>)`).
- Projections avoid loading/managing entities — fastest for read APIs.
- `Page` runs a count query; supply `countQuery` for complex queries; `Slice` avoids it.
- `Specification<T>` builds dynamic `where` clauses (`JpaSpecificationExecutor`).
- Query by Example for simple equality filters.

## N+1 Problem

- One query for N parents + one query per parent for a lazy association = N+1 statements.
- Detect: SQL logs, Hibernate statistics, query-count assertions in tests.
- Fixes: `JOIN FETCH` / `@EntityGraph` (one query), batch fetching (1 + N/batch), DTO projections, `@Fetch(SUBSELECT)`.
- EAGER does not fix it — it can still issue N extra queries and loads data always.
- Verified: 10 authors → 11 statements; with batch size 25 → 2.

## Locking

- **Optimistic:** `@Version` column; UPDATE … WHERE version = ?; 0 rows → `OptimisticLockException` → Spring `ObjectOptimisticLockingFailureException` → 409 or retry. Best for low contention.
- **Pessimistic:** `@Lock(PESSIMISTIC_WRITE)` → `SELECT … FOR UPDATE`; blocks others; risk of deadlocks; set lock timeouts.
- Atomic SQL (`update … set stock = stock - 1 where stock > 0`) is often simplest for counters.
- Lost update = two read-modify-write cycles overwrite each other; both locks prevent it.
- Locks need an active transaction.

## Transactions and ACID

- Transaction = unit of work that fully commits or fully rolls back.
- **A**tomicity, **C**onsistency, **I**solation, **D**urability.
- Spring abstracts with `PlatformTransactionManager` (`JpaTransactionManager` in Boot JPA apps).
- Declarative (`@Transactional`) or programmatic (`TransactionTemplate`).
- Keep transactions short; no remote calls inside them.

## @Transactional

- Applied through a proxy: begin before the method, commit after, roll back on **unchecked** exceptions and errors.
- Checked exceptions **commit** unless `rollbackFor`.
- Attributes: `propagation`, `isolation`, `readOnly`, `timeout`, `rollbackFor`, `noRollbackFor`.
- Put it on service methods (use cases), not controllers or repositories by default.
- `org.springframework.transaction.annotation.Transactional` is the full-featured one; `jakarta.transaction.Transactional` is also honoured but has fewer attributes.
- Spring Data repository methods are transactional by default (read-only for reads).

## Propagation

- `REQUIRED` (default): join or create. `REQUIRES_NEW`: suspend outer, start independent. `NESTED`: savepoint (JDBC). `SUPPORTS`, `NOT_SUPPORTED`, `MANDATORY`, `NEVER`.
- Inner REQUIRED failure caught by outer → transaction rollback-only → `UnexpectedRollbackException` at commit.
- `REQUIRES_NEW` for audit logs that must survive outer rollback — uses a second connection.
- Propagation only applies across proxy calls.

## Isolation

- Anomalies: dirty read, non-repeatable read, phantom read (+ lost update, write skew).
- Levels: READ_UNCOMMITTED, READ_COMMITTED (PostgreSQL/Oracle/SQL Server default), REPEATABLE_READ (MySQL InnoDB default), SERIALIZABLE.
- `Isolation.DEFAULT` = database default.
- Higher isolation = fewer anomalies, more locking/aborts; usually keep the default and use locking for hot rows.

## Transaction Pitfalls

- Self-invocation (`this.method()`) bypasses the proxy → no transaction.
- Private/final methods are not proxied; `@Transactional` on them does nothing.
- Catching exceptions inside the method prevents rollback.
- Checked exceptions commit by default.
- Long transactions holding connections during remote calls exhaust the pool.
- `@Transactional` on a bean created with `new` does nothing.
- Lazy loading outside the transaction → `LazyInitializationException`.
