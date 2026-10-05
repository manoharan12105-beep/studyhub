# Keys — Interview Questions

## Beginner

### Q1. What is a primary key?

<details>
<summary>Answer</summary>

The candidate key chosen to uniquely identify each row of a table. Its values must be unique and not null, a table has at most one primary key (which may have several columns), and PostgreSQL enforces it with a unique B-tree index.

</details>

### Q2. What is the difference between a super key and a candidate key?

<details>
<summary>Answer</summary>

A super key is any set of columns that uniquely identifies rows; it may contain unnecessary columns. A candidate key is a minimal super key — removing any column breaks uniqueness. `{student_id, name}` is a super key; `{student_id}` is a candidate key.

</details>

### Q3. What is an alternate key?

<details>
<summary>Answer</summary>

A candidate key that was not chosen as the primary key. If `student_id` is the primary key, `register_no` and `email` are alternate keys and should be enforced with `UNIQUE` (plus `NOT NULL` if mandatory).

</details>

### Q4. What is a foreign key?

<details>
<summary>Answer</summary>

A column or set of columns whose values must match the primary key or a unique key of a referenced table (or be NULL). It enforces referential integrity — for example, every `orders.customer_id` must belong to an existing customer.

</details>

### Q5. What is a composite key?

<details>
<summary>Answer</summary>

A key made of two or more columns where only the combination is unique — for example `PRIMARY KEY (order_id, product_id)` in `order_items`: an order has many products and a product appears in many orders, but each pair appears once.

</details>

## Intermediate

### Q6. Primary key vs unique key?

<details>
<summary>Answer</summary>

One primary key per table, never NULL; any number of unique constraints, which allow NULLs — in PostgreSQL several NULLs by default, because NULLs are not equal to each other (PostgreSQL 15+ offers `UNIQUE NULLS NOT DISTINCT` to allow only one). Both create a unique index and both can be referenced by a foreign key. The primary key is the row's main identity; unique constraints enforce alternate keys.

</details>

### Q7. Can a foreign key be NULL? Can it contain duplicates?

<details>
<summary>Answer</summary>

Yes to both. NULL means "no related row" (e.g. Nisha has no department) and is allowed unless the column is `NOT NULL`. Duplicates are normal — many employees reference the same department. With a composite foreign key, PostgreSQL's default `MATCH SIMPLE` skips the check if any column is NULL.

</details>

### Q8. Natural key or surrogate key — which would you use as the primary key?

<details>
<summary>Answer</summary>

Usually a surrogate (`bigint GENERATED ALWAYS AS IDENTITY` or `uuid`) as the primary key, because it is small, never changes and has no business meaning that might change. But keep the natural key with a `UNIQUE` constraint, otherwise the same real entity can be inserted twice. A natural key can be a fine primary key when it is truly stable and compact (e.g. ISO country codes).

</details>

### Q9. Is every candidate key a super key? Is every super key a candidate key?

<details>
<summary>Answer</summary>

Every candidate key is a super key (it is unique). Not every super key is a candidate key, because super keys need not be minimal.

</details>

### Q10. Can a table have no primary key?

<details>
<summary>Answer</summary>

PostgreSQL allows it, but it is almost always a design mistake: duplicate rows become possible, rows cannot be reliably updated or referenced, ORMs such as JPA require an id, and logical replication needs a replica identity to replicate updates and deletes. Log or staging tables are occasional exceptions.

</details>

## Advanced

### Q11. A relation R(A, B, C, D, E) has candidate keys {A} and {B, C}. How many super keys does it have?

<details>
<summary>Answer</summary>

Supersets of {A}: 2⁴ = 16. Supersets of {B, C}: 2³ = 8. Supersets of both {A, B, C}: 2² = 4. Total = 16 + 8 − 4 = **20**.

</details>

### Q12. Does PostgreSQL index foreign key columns automatically? Why does it matter?

<details>
<summary>Answer</summary>

No. Only the referenced side has an index (from its primary/unique key). Without an index on the referencing column, joins from parent to children need scans, and every `DELETE` or key `UPDATE` on the parent must scan the child table to check for referencing rows — slow on large tables and longer lock holding. Index foreign keys that are used for joins or whose parents are deleted.

</details>

### Q13. Why can a mutable natural primary key hurt?

<details>
<summary>Answer</summary>

Every foreign key stores a copy of it. When it changes (a user changes email), the change must cascade to all referencing rows (`ON UPDATE CASCADE`) or be blocked, touching many rows, indexes and caches, and breaking external systems and URLs that stored the old value. Wide text keys also make every referencing index larger.

</details>
