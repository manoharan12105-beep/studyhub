# The N+1 Problem: Fetch Join and EntityGraph — Practice

### P1. Count the queries

**Difficulty:** Easy · **Type:** MCQ

A page shows 50 orders with their customer names. `Order.customer` is `@ManyToOne(fetch = LAZY)`, the 50 orders belong to 50 different customers, and the code calls `order.getCustomer().getName()` in a loop. How many queries run?

- A) 1
- B) 2
- C) 51
- D) 100

<details>
<summary>Answer</summary>

**Answer:** C) 51

**Explanation:** One for the orders plus one per distinct customer proxy initialised (customers already in the persistence context would not be loaded again).

</details>

### P2. Fix with an entity graph

**Difficulty:** Medium · **Type:** Coding

Add a repository method that returns a page of `PLACED` orders with their customers loaded in the same query.

<details>
<summary>Answer</summary>

```java
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

@Entity
class Shopper {
    @Id
    @GeneratedValue
    Long id;
    String name;
}

@Entity
class ShopOrder {
    @Id
    @GeneratedValue
    Long id;
    String status;
    @ManyToOne(fetch = FetchType.LAZY)
    Shopper shopper;
}

interface ShopOrderRepository extends JpaRepository<ShopOrder, Long> {

    @EntityGraph(attributePaths = "shopper")          // to-one: safe with paging
    Page<ShopOrder> findByStatus(String status, Pageable pageable);
}
```

Fetching a `@ManyToOne` with paging is fine — it does not multiply rows.

</details>

### P3. In-memory paging

**Difficulty:** Hard · **Type:** Debugging

`@Query("select o from Order o join fetch o.items") Page<Order> findAllWithItems(Pageable p)` returns correct pages, but memory spikes and logs show "applying in memory". Propose a two-step fix.

<details>
<summary>Answer</summary>

1. `@Query("select o.id from Order o") Page<Long> findIds(Pageable p)` — paginate ids in SQL (with a count query).
2. `@Query("select distinct o from Order o join fetch o.items where o.id in :ids") List<Order> findWithItems(List<Long> ids)` — fetch the collections for that page only, then restore the page order.

Alternatively drop the fetch join and rely on batch fetching for `items`.

</details>

### P4. Hidden N+1

**Difficulty:** Medium · **Type:** Scenario

A service method is clean and runs one query, yet the endpoint executes 300 queries. The controller returns the entities directly and `spring.jpa.open-in-view` is at its default. Where are the queries coming from?

<details>
<summary>Answer</summary>

From JSON serialisation: Jackson calls getters on every entity, initialising lazy associations one by one; Open Session in View keeps the persistence context open so lazy loading succeeds during rendering. Return DTOs built in the service with an explicit fetch plan, and disable OSIV.

</details>
