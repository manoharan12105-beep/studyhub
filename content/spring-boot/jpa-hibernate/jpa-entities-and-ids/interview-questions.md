# Entities and ID Generation — Interview Questions

## Beginner

### Q1. What are the requirements for a JPA entity class?

<details>
<summary>Answer</summary>

It must be annotated `@Entity`, have a primary key (`@Id`, or `@EmbeddedId`/`@IdClass`), have a public or protected no-argument constructor, and must not be final (nor its persistent methods), so the provider can instantiate it reflectively and create lazy-loading proxies. It must be a top-level or static nested class.

</details>

### Q2. What are the ID generation strategies in JPA?

<details>
<summary>Answer</summary>

`IDENTITY` (database auto-increment column), `SEQUENCE` (database sequence, values fetched in blocks), `TABLE` (a table emulating a sequence), `UUID` (application-generated UUIDs, JPA 3.1) and `AUTO` (provider decides — Hibernate 6+ uses a sequence for numeric ids).

</details>

### Q3. Why should enums be mapped with `EnumType.STRING`?

<details>
<summary>Answer</summary>

The default `ORDINAL` stores the position (0, 1, 2…). Adding or reordering constants changes the meaning of existing rows silently. `STRING` stores the name, which is readable and stable under reordering (renaming a constant still requires a migration).

</details>

## Intermediate

### Q4. Why does `GenerationType.IDENTITY` disable JDBC batch inserts in Hibernate?

<details>
<summary>Answer</summary>

The id is assigned by the database during the INSERT, but Hibernate must know the id as soon as `persist()` is called to put the entity in the persistence context. It therefore executes each INSERT immediately and reads the generated key, so inserts cannot be queued into a batch. With `SEQUENCE`, ids are obtained beforehand (in pooled blocks), and inserts can be batched at flush.

</details>

### Q5. What is `allocationSize` in `@SequenceGenerator`?

<details>
<summary>Answer</summary>

How many ids Hibernate reserves per sequence call (default 50). Hibernate's pooled optimizer calls `nextval` once and hands out the next 50 ids from memory, reducing round trips. The database sequence's `INCREMENT BY` must match, or ids collide or schema validation fails.

</details>

### Q6. Why use `Long` instead of `long` for the id?

<details>
<summary>Answer</summary>

`null` clearly means "not persisted yet". Spring Data's `save()` treats an entity with a null id (or null version) as new and calls `persist`; with a primitive, the default `0` is ambiguous and can lead to merge attempts and extra SELECTs.

</details>

## Advanced

### Q7. How do you implement `equals` and `hashCode` for an entity?

<details>
<summary>Answer</summary>

Either on an immutable natural key (e.g. `sku`, `email` if it never changes), or on the identifier with care: `equals` compares ids only when both are non-null (and handles Hibernate proxies via `Hibernate.getClass` or `instanceof`), and `hashCode` returns a constant per class so it does not change when the generated id is assigned after the entity was put in a `HashSet`. Never use all fields or lazy associations, and avoid Lombok `@Data`/`@EqualsAndHashCode` on entities.

</details>

### Q8. What are the trade-offs of UUID primary keys?

<details>
<summary>Answer</summary>

Pros: generated in the application without a database round trip, globally unique across services and databases, not guessable, safe to expose. Cons: 16 bytes (larger indexes and foreign keys), and random UUIDv4 values insert into random positions of B-tree indexes, causing page splits and poor cache locality. Time-ordered UUIDs (UUIDv7) mitigate fragmentation. A common compromise is a numeric internal key plus a UUID public identifier.

</details>

### Q9. Why should `spring.jpa.hibernate.ddl-auto=update` not be used in production?

<details>
<summary>Answer</summary>

It only adds missing tables and columns; it never drops, renames or migrates data, cannot handle type changes safely, is not versioned or reviewable, and different instances may race. Production schemas should be managed by Flyway or Liquibase migrations, with `ddl-auto=validate` (or `none`) to check that mappings match.

</details>
