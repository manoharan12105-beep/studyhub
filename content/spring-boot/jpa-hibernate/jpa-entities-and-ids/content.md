# Entities and ID Generation

**Module:** Spring Data JPA and Hibernate · **Interview priority:** Core

## Definition

An **entity** is a Java class annotated with **`@Entity`** whose instances represent rows of a database table and are managed by JPA. Every entity has a primary key marked with **`@Id`**, whose value can be assigned by the application or generated with **`@GeneratedValue`** using a strategy: `IDENTITY`, `SEQUENCE`, `TABLE`, `UUID` or `AUTO`.

## Why It Matters

- Entity mapping mistakes (missing no-arg constructor, wrong ID strategy, `equals` on mutable ids) cause subtle bugs.
- The ID strategy affects **performance**: `IDENTITY` disables Hibernate's JDBC insert batching.
- "Which ID generation strategy do you use and why?" is a common follow-up in project discussions.

## Entity

Requirements of a JPA entity class:

- Annotated with `@Entity` (from `jakarta.persistence`).
- Has an `@Id` field (or `@EmbeddedId`/`@IdClass` for composite keys).
- Has a **public or protected no-argument constructor** (Hibernate instantiates entities by reflection).
- Is a **top-level class** (or a static nested class); not `final`, and persistent methods not `final` — Hibernate creates subclass proxies for lazy loading.
- Records **cannot** be entities (they are final and immutable); records are ideal for DTOs and projections.

## @Entity

```java
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.Instant;

@Entity                                                     // entity name "Product" (used in JPQL)
@Table(name = "products",
        uniqueConstraints = @UniqueConstraint(name = "uk_products_sku", columnNames = "sku"),
        indexes = @Index(name = "ix_products_category", columnList = "category"))
public class Product {

    public enum Status { ACTIVE, DISCONTINUED }

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "product_seq")
    @SequenceGenerator(name = "product_seq", sequenceName = "product_seq", allocationSize = 50)
    private Long id;

    @Column(nullable = false, length = 40)
    private String sku;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, precision = 12, scale = 2)    // money: BigDecimal with explicit precision
    private BigDecimal price;

    private String category;

    @Enumerated(EnumType.STRING)                            // store "ACTIVE", not 0 — safe if enum order changes
    @Column(nullable = false, length = 20)
    private Status status = Status.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Transient                                              // not persisted
    private boolean selected;

    protected Product() {                                   // for JPA
    }

    public Product(String sku, String name, BigDecimal price, String category) {
        this.sku = sku;
        this.name = name;
        this.price = price;
        this.category = category;
    }

    public Long getId() {
        return id;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void changePrice(BigDecimal newPrice) {         // behaviour instead of a public setter
        if (newPrice.signum() <= 0) {
            throw new IllegalArgumentException("price must be positive");
        }
        this.price = newPrice;
    }
}
```

| Annotation | Purpose |
|------------|---------|
| `@Table` | Table name, schema, unique constraints, indexes (used when Hibernate generates DDL) |
| `@Column` | Column name, `nullable`, `length`, `precision`/`scale`, `unique`, `insertable`/`updatable` |
| `@Enumerated(EnumType.STRING)` | Store enum names; the default `ORDINAL` breaks when constants are reordered |
| `@Transient` | Exclude a field from persistence |
| `@Lob` | Large text/binary |
| `@Embedded` / `@Embeddable` | Value objects (e.g. `Address`) stored in the owner's table |
| `@Version` | Optimistic locking column (see [Locking](../jpa-locking/content.md)) |

**Naming:** Spring Boot's default physical naming strategy converts `createdAt` to `created_at` and `OrderItem` to `order_item`.

**Schema management:** `spring.jpa.hibernate.ddl-auto` = `none` | `validate` | `update` | `create` | `create-drop`. Use `validate` or `none` in production and manage schema changes with **Flyway** or **Liquibase**; `update` never drops or migrates data safely.

## @Id

- Use wrapper types (`Long`, `UUID`) so "no id yet" is `null` — Spring Data's `save()` uses this to decide between insert and update.
- Ids should be immutable once assigned.
- Composite keys: `@EmbeddedId` with an `@Embeddable` key class implementing `equals`/`hashCode`, or `@IdClass`.

## ID Generation

| Strategy | How the id is produced | Batching inserts | Databases | Notes |
|----------|-----------------------|------------------|-----------|-------|
| `IDENTITY` | Auto-increment / identity column; DB assigns on INSERT | **Disabled** — Hibernate must execute each INSERT immediately to learn the id | MySQL, PostgreSQL, SQL Server, H2 | Simple; common with MySQL |
| `SEQUENCE` | Database sequence; Hibernate fetches values in blocks (`allocationSize`, default 50) | **Possible** — ids known before INSERT | PostgreSQL, Oracle, H2, SQL Server 2012+ | Best performance on databases with sequences |
| `TABLE` | A table simulating a sequence, with row locking | Possible but slow | Any | Avoid |
| `UUID` (JPA 3.1) | Generated in the application (`UUID` type) | Possible | Any | No DB round trip; globally unique; larger index, random inserts fragment B-tree indexes (time-ordered UUIDv7 helps) |
| `AUTO` (default) | Provider chooses — Hibernate 6+ picks `SEQUENCE` for numeric ids (a sequence named after the entity, `<entity>_seq`) | Depends | — | Be explicit to avoid surprises on databases without sequences |

> [!IMPORTANT]
> With `SEQUENCE` and `allocationSize = 50`, the database sequence must have **`INCREMENT BY 50`** too (Hibernate's pooled optimizer assumes it). A mismatch between a Flyway-created sequence (`INCREMENT BY 1`) and the entity's allocation size causes duplicate-key errors or validation failures.

### Choosing

- **PostgreSQL / Oracle:** `SEQUENCE` with a sensible `allocationSize` (e.g. 50) for insert-heavy tables; `IDENTITY` is fine for low volume.
- **MySQL:** `IDENTITY` (no sequences).
- **Distributed systems / public ids:** `UUID` (or a separate public identifier) — sequential numeric ids leak volume and are guessable.

## Equals and hashCode for Entities

Entities live in `Set`s and are compared across persistence contexts, while generated ids are `null` before persisting. Safe options:

- Use a **natural business key** that never changes (e.g. `sku`) in `equals`/`hashCode`, or
- Use the id in `equals` (`id != null && id.equals(other.id)`) with a **constant** `hashCode` (e.g. `getClass().hashCode()`), so the hash does not change when the id is assigned.

Never include lazy associations in `equals`, `hashCode` or `toString` (Lombok `@Data` on entities is a common source of lazy-loading and recursion bugs).

## Common Mistakes

- `EnumType.ORDINAL` (the default) — inserting a new constant in the middle silently corrupts data meaning.
- `double`/`float` for money.
- `ddl-auto=update` in production.
- Public setters for everything (anemic entities) — prefer methods that enforce invariants.
- Lombok `@Data`/`@EqualsAndHashCode` on entities with relationships.
- Primitive `long id` — `0` is ambiguous between "new" and "id 0".

## Common Interview Traps

- **"`GenerationType.AUTO` means auto-increment."** In Hibernate 6+ it means a sequence for numeric ids.
- **"IDENTITY is fastest."** It prevents JDBC insert batching; SEQUENCE with pooling is faster for bulk inserts.
- **"An entity is just a POJO, so a record works."** Entities must be non-final, mutable and have a no-arg constructor.

## Key Takeaways

- Entity = `@Entity` + `@Id` + no-arg constructor + non-final; map columns, enums (`STRING`) and constraints explicitly.
- ID strategies: IDENTITY (simple, no batching), SEQUENCE (batch-friendly, match `allocationSize`), UUID (app-generated), avoid TABLE, be explicit instead of AUTO.
- Production schemas via Flyway/Liquibase with `ddl-auto=validate`.
