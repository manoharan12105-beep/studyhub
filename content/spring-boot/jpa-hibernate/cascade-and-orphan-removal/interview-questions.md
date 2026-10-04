# Cascade and orphanRemoval — Interview Questions

## Beginner

### Q1. What does cascading mean in JPA?

<details>
<summary>Answer</summary>

Propagating an `EntityManager` operation (persist, merge, remove, refresh, detach) from an entity to its associated entities. For example, with `@OneToMany(cascade = CascadeType.PERSIST)`, persisting an order also persists its new order lines.

</details>

### Q2. What is `orphanRemoval`?

<details>
<summary>Answer</summary>

An attribute of `@OneToMany` and `@OneToOne` that deletes a child entity when it is removed from the parent's collection or replaced, because the child cannot exist without its parent. The DELETE happens at flush.

</details>

## Intermediate

### Q3. What is the difference between `CascadeType.REMOVE` and `orphanRemoval = true`?

<details>
<summary>Answer</summary>

`CascadeType.REMOVE` deletes children when the parent itself is deleted. `orphanRemoval` additionally deletes a child when it is merely disassociated from the parent (removed from the collection), even though the parent still exists. Compositions usually use both (`cascade = ALL, orphanRemoval = true`).

</details>

### Q4. Why is `CascadeType.ALL` on a `@ManyToOne` dangerous?

<details>
<summary>Answer</summary>

The target of a many-to-one is shared by many entities (a product referenced by many order lines). Cascading REMOVE from a child would delete the shared parent, either destroying data used elsewhere or failing with a foreign-key violation; cascading MERGE/PERSIST can create or overwrite shared reference data unexpectedly.

</details>

### Q5. Which cascade types would you use for `Order → OrderLine`, `OrderLine → Product`, and `Student ↔ Course`?

<details>
<summary>Answer</summary>

`Order → OrderLine`: `CascadeType.ALL` with `orphanRemoval = true` (lines are owned by the order). `OrderLine → Product`: no cascade (products are independent reference data). `Student ↔ Course`: no REMOVE cascade; at most PERSIST/MERGE if courses are created together with students, which is unusual.

</details>

## Advanced

### Q6. "A collection with cascade=all-delete-orphan was no longer referenced by the owning entity instance" — what causes it?

<details>
<summary>Answer</summary>

The code replaced the mapped collection with a new instance (`parent.setChildren(newList)`), typically when mapping a DTO onto an entity. Hibernate tracks the original `PersistentCollection` to compute orphans and refuses the replacement. Modify the existing collection instead: `children.clear(); children.addAll(newChildren);` (or merge items selectively).

</details>

### Q7. How would you delete an order that has 50 000 lines efficiently?

<details>
<summary>Answer</summary>

Avoid cascade REMOVE, which loads every line and deletes them one by one. Use a bulk JPQL/SQL delete for the children (`delete from OrderLine l where l.order.id = :id`) followed by deleting the parent, or rely on `ON DELETE CASCADE` defined in the database schema, and clear the persistence context afterwards since bulk operations bypass it.

</details>
