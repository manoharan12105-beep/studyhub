# Entity Relationships, Owning Side and mappedBy — Interview Questions

## Beginner

### Q1. What relationship annotations does JPA provide?

<details>
<summary>Answer</summary>

`@OneToOne`, `@OneToMany`, `@ManyToOne` and `@ManyToMany`, each usable unidirectionally or bidirectionally, configured with `@JoinColumn` (foreign key) or `@JoinTable` (join table), and attributes such as `fetch`, `cascade`, `orphanRemoval`, `optional` and `mappedBy`.

</details>

### Q2. What is the owning side of a relationship?

<details>
<summary>Answer</summary>

The side that controls the database representation of the association — the foreign key column or join table. Hibernate writes the relationship based only on the owning side's field. It is the side without `mappedBy`; for one-to-many/many-to-one pairs it is always the `@ManyToOne` side.

</details>

### Q3. What does `mappedBy` do?

<details>
<summary>Answer</summary>

It marks the inverse side of a bidirectional relationship and names the field on the owning side that maps it (`@OneToMany(mappedBy = "order")`). JPA uses it for loading but ignores it when writing, and no separate join table or foreign key is created for it.

</details>

## Intermediate

### Q4. You add an item to `order.getItems()` and save the order, but `order_item.order_id` is null. Why?

<details>
<summary>Answer</summary>

`items` is the inverse side (`mappedBy`); the foreign key is written from `OrderItem.order`, which was never set. Set both sides — ideally through an `order.addItem(item)` helper that adds to the collection and sets `item.setOrder(this)`.

</details>

### Q5. What are the default fetch types for each association?

<details>
<summary>Answer</summary>

`@ManyToOne` and `@OneToOne`: EAGER. `@OneToMany` and `@ManyToMany`: LAZY. Best practice is to make all associations LAZY explicitly and fetch what each use case needs with fetch joins, entity graphs or projections.

</details>

### Q6. Why is a unidirectional `@OneToMany` discouraged?

<details>
<summary>Answer</summary>

Without `mappedBy`, Hibernate either creates a join table (an extra table and joins for a plain parent–child relation) or, with `@JoinColumn`, inserts children first and then issues extra UPDATE statements to set their foreign keys. A `@ManyToOne` on the child (optionally with a `mappedBy` collection on the parent) maps the foreign key directly.

</details>

### Q7. When should you replace `@ManyToMany` with a join entity?

<details>
<summary>Answer</summary>

When the association has attributes (enrolment date, role in a project, quantity) or its own lifecycle, or when you need to query or paginate the links. Model it as an entity (`Enrollment`) with two `@ManyToOne` relations and a unique constraint on the pair.

</details>

## Advanced

### Q8. Why should `@ManyToMany` collections be `Set`s rather than `List`s?

<details>
<summary>Answer</summary>

A `List` without `@OrderColumn` is a bag: Hibernate cannot identify individual join rows, so removing one element deletes all join-table rows for the owner and re-inserts the remaining ones. With a `Set`, Hibernate deletes just the affected row. Bags also cause `MultipleBagFetchException` when fetching two of them together.

</details>

### Q9. Why is the inverse side of a `@OneToOne` often loaded eagerly even when marked LAZY?

<details>
<summary>Answer</summary>

To return either `null` or a proxy for the association, Hibernate must know whether a related row exists, and the inverse side has no foreign key column to look at — so it queries anyway. Map one-to-one from the owning (child) side only, use `@MapsId` to share the primary key, or use bytecode enhancement for true laziness.

</details>
