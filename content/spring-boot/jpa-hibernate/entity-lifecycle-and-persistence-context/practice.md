# Entity Lifecycle and the Persistence Context — Practice

### P1. Which state?

**Difficulty:** Easy · **Type:** MCQ

A `@Transactional` service method returns a `Product` loaded with `findById`. In the controller, what is the product's state?

- A) Transient
- B) Managed
- C) Detached
- D) Removed

<details>
<summary>Answer</summary>

**Answer:** C) Detached

**Explanation:** The transaction (and persistence context) ended when the service method returned (assuming Open Session in View is disabled).

</details>

### P2. How many SELECTs?

**Difficulty:** Medium · **Type:** Behavior

Inside one transaction: `em.find(Product.class, 1L)`, `em.find(Product.class, 1L)`, `em.find(Product.class, 2L)`, then a JPQL query `select p from Product p where p.id = 1`. How many SQL SELECTs run?

<details>
<summary>Answer</summary>

Three: one for id 1, one for id 2, and one for the JPQL query (queries always hit the database). The second `find(1L)` is served from the persistence context, and the query's result row for id 1 resolves to the already-managed instance.

</details>

### P3. Merge mistake

**Difficulty:** Medium · **Type:** Code analysis

```java
@Transactional
public void rename(Product detached, String name) {
    em.merge(detached);
    detached.setName(name);
}
```

Is the new name saved? Fix it.

<details>
<summary>Answer</summary>

No. `merge` returns a managed copy; the change is applied to the detached argument after merging, which is not tracked. Use the return value: `Product managed = em.merge(detached); managed.setName(name);` — or better, load by id in this transaction and modify the managed entity.

</details>

### P4. Setting a foreign key cheaply

**Difficulty:** Medium · **Type:** Scenario

Creating an `Order` requires a `Customer` reference, and the request contains only `customerId`. How do you set the association without loading the customer?

<details>
<summary>Answer</summary>

`order.setCustomer(customerRepository.getReferenceById(customerId));` — it returns a proxy with only the id, so no SELECT is needed to write the foreign key. If the customer might not exist, either validate first (`existsById`) or rely on the foreign key constraint and map the resulting `DataIntegrityViolationException` to an error.

</details>
