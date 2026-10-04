# Data and Transaction Essentials

One line per topic for JPA, Hibernate, Spring Data and transactions.

## JPA and Hibernate

- **JPA / Hibernate / Spring Data** — spec / implementation / repository abstraction.
- **Entities and ids** — `@Entity`, `@Id`, no-arg constructor, non-final; SEQUENCE batches, IDENTITY inserts immediately; `EnumType.STRING`.
- **Lifecycle** — new → managed (`persist`) → detached (context closed) → removed; `merge` returns a managed copy; first-level cache = one instance per id.
- **Dirty checking** — managed changes become UPDATEs at flush; flush ≠ commit; read-only = no flush.
- **Relationships** — FK side (`@ManyToOne`) owns; `mappedBy` = inverse; sync both sides; join entity for links with data.
- **Cascade / orphanRemoval** — cascade REMOVE on parent delete; orphanRemoval on removal from the collection; only for owned children.
- **Fetching** — everything LAZY; fetch per use case (`JOIN FETCH`, `@EntityGraph`, batch size); `LazyInitializationException` = access outside the transaction.
- **Queries** — derived names, `@Query` JPQL (entities) or native (tables), `@Modifying` for updates; validated at startup.
- **Projections / paging / specs** — interface/record projections for reads; `Page` costs a count; `Specification` for dynamic filters.
- **N+1** — 1 query + 1 per parent; detect via SQL log; fix with fetch join/entity graph/batch fetching/projections.
- **Locking** — optimistic `@Version` (detect, 409/retry) vs pessimistic `FOR UPDATE` (block); atomic SQL for counters.

## Transactions

- **ACID** — atomic, consistent, isolated, durable; `PlatformTransactionManager` (`JpaTransactionManager`).
- **`@Transactional`** — proxy-based; rollback on unchecked + errors; checked commit unless `rollbackFor`; put on services.
- **Propagation** — REQUIRED joins (inner failure → rollback-only), REQUIRES_NEW independent, NESTED savepoint.
- **Isolation** — dirty / non-repeatable / phantom reads; READ COMMITTED common default; MySQL REPEATABLE READ.
- **Pitfalls** — self-invocation, private/final methods, `new` objects, swallowed exceptions, long transactions with remote calls.
