# Derived Queries, JPQL, @Query and Native SQL

**Module:** Spring Data JPA and Hibernate · **Interview priority:** Core

## Definition

Spring Data JPA offers several ways to query:

- **Derived query methods** — the query is derived from the method name: `findByEmailAndActiveTrue(String email)`.
- **JPQL** (Jakarta Persistence Query Language) — object-oriented queries over **entities and their fields**, portable across databases: `select o from Order o where o.customer.id = :customerId`.
- **`@Query`** — attaches an explicit JPQL (or native) query to a repository method.
- **Native SQL** — `@Query(value = "...", nativeQuery = true)`: raw SQL against **tables and columns**, for database-specific features.

## Why It Matters

- Choosing the right query style is a daily task and a common interview topic ("When do you use `@Query` instead of a derived method?", "JPQL vs native").
- Query style affects performance (projections, fetch joins), portability and safety (SQL injection).

## Derived Query Methods

Spring Data parses the method name — **subject** (`find…By`, `exists…By`, `count…By`, `delete…By`) + **predicate** (properties with operators) + optional ordering/limiting — into JPQL at startup.

```java
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

@Entity
@Table(name = "customer_order")
class CustomerOrder {
    enum Status { PLACED, SHIPPED, DELIVERED, CANCELLED }

    @Id
    @GeneratedValue
    Long id;
    Long customerId;
    String customerEmail;
    @Enumerated(EnumType.STRING)
    Status status;
    BigDecimal total;
    Instant createdAt;
}

interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {

    List<CustomerOrder> findByCustomerId(Long customerId);

    Optional<CustomerOrder> findFirstByCustomerIdOrderByCreatedAtDesc(Long customerId);       // latest order

    List<CustomerOrder> findByStatusAndTotalGreaterThanEqual(CustomerOrder.Status status, BigDecimal min);

    List<CustomerOrder> findByStatusIn(Collection<CustomerOrder.Status> statuses);

    List<CustomerOrder> findByCreatedAtBetween(Instant from, Instant to);

    List<CustomerOrder> findByCustomerEmailContainingIgnoreCase(String fragment);           // like %x%

    List<CustomerOrder> findTop5ByOrderByTotalDesc();

    Page<CustomerOrder> findByStatus(CustomerOrder.Status status, Pageable pageable);

    boolean existsByCustomerIdAndStatus(Long customerId, CustomerOrder.Status status);

    long countByStatus(CustomerOrder.Status status);
}
```

Common keywords: `And`, `Or`, `Is/Equals`, `Not`, `Between`, `LessThan(Equal)`, `GreaterThan(Equal)`, `After`, `Before`, `IsNull`, `IsNotNull`, `Like`, `StartingWith`, `EndingWith`, `Containing`, `IgnoreCase`, `In`, `NotIn`, `True`, `False`, `OrderBy…Asc/Desc`, `First`/`Top<n>`, `Distinct`. Nested properties work too: `findByCustomerAddressCity` (traversing `customer.address.city`).

**Strengths:** no query text, validated at startup (a typo in a property name fails fast), readable for simple filters.
**Limits:** long names become unreadable (`findByStatusAndCustomerIdAndCreatedAtAfterAndTotalGreaterThan…`); no joins with fetch control, no aggregates/grouping beyond `count`; `deleteBy…` **loads each entity and deletes it one by one** (runs lifecycle callbacks but is slow for many rows).

## JPQL

JPQL queries entities and fields, not tables and columns; Hibernate translates it to SQL for the configured dialect.

```sql
select o from CustomerOrder o
where o.status = :status and o.total >= :min
order by o.createdAt desc
```

- Navigation and joins follow mapped associations: `select o from Order o join o.customer c where c.city = :city`.
- **Fetch joins** load associations in the same query: `select o from Order o join fetch o.items where o.id = :id`.
- **Constructor expressions** create DTOs: `select new com.example.OrderSummary(o.id, o.total) from Order o`.
- Aggregates and grouping: `select o.status, count(o) from Order o group by o.status`.
- Bulk updates/deletes: `update Product p set p.price = p.price * 1.1 where p.category = :c`.
- Parameters: named (`:status`) or positional (`?1`) — **always parameters**, never string concatenation.

## @Query

```java
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface CustomerOrderQueries extends JpaRepository<CustomerOrder, Long> {

    @Query("select o from CustomerOrder o where o.status = :status and o.total >= :min order by o.createdAt desc")
    List<CustomerOrder> findLargeOrders(@Param("status") CustomerOrder.Status status, @Param("min") BigDecimal min);

    @Query("select o.status, count(o) from CustomerOrder o group by o.status")
    List<Object[]> countPerStatus();

    @Modifying(clearAutomatically = true)                      // bulk write: needs @Modifying + a transaction
    @Query("update CustomerOrder o set o.status = 'CANCELLED' where o.status = 'PLACED' and o.createdAt < :cutoff")
    int cancelStaleOrders(@Param("cutoff") java.time.Instant cutoff);
}
```

- `@Query` strings are parsed and validated **at startup** — a typo in an entity or field name fails application startup.
- `@Param` is optional when compiling with `-parameters` (Spring Boot does), but explicit names are clearer.
- `@Modifying` is required for UPDATE/DELETE queries; the calling method must be `@Transactional`. Bulk statements **bypass the persistence context** (no dirty checking, no cascades, no `@Version` increment unless written in the query, managed entities become stale) — use `clearAutomatically = true` and `flushAutomatically = true` when mixing with entity operations.
- SpEL: `#{#entityName}` refers to the entity name (useful in generic base repositories).

## Native SQL

```java
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface CustomerOrderNativeQueries extends JpaRepository<CustomerOrder, Long> {

    @Query(value = """
            select * from customer_order
            where customer_email ilike concat('%', :domain)
            order by created_at desc
            """, nativeQuery = true)                                         // PostgreSQL-specific ILIKE
    List<CustomerOrder> findByEmailDomain(@Param("domain") String domain);

    @Query(value = "select * from customer_order where status = :status",
            countQuery = "select count(*) from customer_order where status = :status",
            nativeQuery = true)
    Page<CustomerOrder> findPageByStatusNative(@Param("status") String status, Pageable pageable);
}
```

Use native SQL for features JPQL lacks — window functions, CTEs, database-specific functions and operators (JSONB, full-text search, `ILIKE`), query hints, `SELECT … FOR UPDATE SKIP LOCKED` — or for hand-tuned reporting queries. Native queries returning entities must select all mapped columns; for partial results use interface projections or `Object[]`.

## Comparison: JPQL vs Native Query

| Aspect | JPQL | Native SQL |
|--------|------|------------|
| Operates on | Entities and fields | Tables and columns |
| Portability | Database-independent | Tied to one database dialect |
| Validated at startup | Yes (syntax and mappings) | No (errors at runtime) |
| Features | Joins over associations, fetch joins, constructor expressions, aggregates | Everything the database supports |
| Result | Managed entities, DTOs, scalars | Entities (all columns), scalars, interface projections |
| Pagination | Automatic count query derivation | Often needs an explicit `countQuery` |
| Flushing | Auto-flush only for affected tables | Hibernate flushes all pending changes first |
| Use when | Default | Database-specific features or tuned SQL |

### Choosing a query style

```text
Simple filter on a few properties?              → derived method
Joins, fetch joins, aggregates, readable JPQL?  → @Query (JPQL)
Many optional filters combined at runtime?      → Specifications / Criteria (see Projections topic)
Database-specific SQL or heavy reporting?       → @Query(nativeQuery = true) or JdbcTemplate
```

## Internal Behavior

- At startup, Spring Data creates a `RepositoryQuery` per method: `PartTreeJpaQuery` for derived methods (method name → criteria), `SimpleJpaQuery` for JPQL `@Query`, `NativeJpaQuery` for native ones. Invalid derived names or JPQL fail the startup.
- Query lookup order (`QueryLookupStrategy.CREATE_IF_NOT_FOUND`): `@Query` → named query (`@NamedQuery` `Entity.method`) → derive from the method name.
- Parameters are bound as JDBC `PreparedStatement` parameters, which prevents SQL injection — unless you build query strings by concatenation (`entityManager.createQuery("… where name = '" + name + "'")`).

## Common Mistakes

- String-concatenating user input into JPQL/SQL (injection).
- Very long derived method names instead of a readable `@Query`.
- Forgetting `@Modifying` (error: "Query executed via 'getResultList()' or 'getSingleResult()' must be a SELECT") or the transaction (`TransactionRequiredException`).
- Bulk updates leaving stale managed entities.
- `deleteByStatus` on thousands of rows (loads and deletes one by one) — use a `@Modifying` bulk delete.
- Native queries on PostgreSQL-specific syntax while tests run on H2 (use Testcontainers with the real database).

## Common Interview Traps

- **"JPQL is SQL with different keywords."** JPQL uses entity and field names and navigates associations; table and column names are invalid there.
- **"Derived query methods are generated at compile time."** They are parsed when the repository proxy is created at application startup.
- **"Native queries are always faster."** The database executes SQL either way; JPQL generates SQL too. Native helps only when you need SQL features JPQL cannot express.

## Key Takeaways

- Derived methods for simple filters; `@Query` JPQL for anything more; native SQL for database-specific needs.
- JPQL = entities and fields, validated at startup, portable; native = tables and columns, unvalidated, powerful.
- Bulk `@Modifying` queries need a transaction and bypass the persistence context.
- Always bind parameters; never concatenate.
