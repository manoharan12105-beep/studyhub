# Fetch Types, Lazy Loading and Proxies — Practice

### P1. Defaults

**Difficulty:** Easy · **Type:** MCQ

Which associations are EAGER by default?

- A) `@OneToMany` and `@ManyToMany`
- B) `@ManyToOne` and `@OneToOne`
- C) All associations
- D) None

<details>
<summary>Answer</summary>

**Answer:** B) `@ManyToOne` and `@OneToOne`

**Explanation:** "To-one" associations default to EAGER; "to-many" collections default to LAZY.

</details>

### P2. Where does it fail?

**Difficulty:** Medium · **Type:** Debugging

```java
@GetMapping("/api/orders/{id}")
OrderResponse get(@PathVariable long id) {
    Order order = orderService.find(id);              // @Transactional(readOnly = true) in the service
    return new OrderResponse(order.getId(), order.getItems().size());
}
```

With `spring.jpa.open-in-view=false`, this throws `LazyInitializationException`. Fix it properly.

<details>
<summary>Answer</summary>

`items` is a lazy collection accessed in the controller after the service transaction ended. Move the mapping into the service (inside the transaction) and load the items explicitly — e.g. a repository method with `@EntityGraph(attributePaths = "items")` or `JOIN FETCH`, or a projection query that returns the count directly (`select new …OrderResponse(o.id, size(o.items)) …`).

</details>

### P3. EAGER N+1

**Difficulty:** Hard · **Type:** Behavior

`OrderLine` has `@ManyToOne Product product` (no fetch type specified). A JPQL query `select l from OrderLine l where l.order.id = :id` returns 20 lines referencing 20 different products. Roughly how many SQL queries run, and why?

<details>
<summary>Answer</summary>

About 21: one for the lines and one per distinct product, because the `@ManyToOne` defaults to EAGER and Hibernate satisfies EAGER associations of JPQL results with separate SELECTs (JPQL does not join them automatically). Make it LAZY and add `join fetch l.product` when products are needed.

</details>

### P4. Proxy equality

**Difficulty:** Medium · **Type:** Code analysis

An entity's `equals` begins with `if (o == null || getClass() != o.getClass()) return false;`. Comparisons sometimes return `false` for the same row. Why?

<details>
<summary>Answer</summary>

One side may be a Hibernate proxy, whose class is a generated subclass, so `getClass()` differs. Use `if (!(o instanceof Product other)) return false;` (or compare `Hibernate.getClass(this)` with `Hibernate.getClass(o)`) and compare ids through getters.

</details>
