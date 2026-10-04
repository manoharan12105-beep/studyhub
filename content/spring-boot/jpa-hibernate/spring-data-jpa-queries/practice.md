# Derived Queries, JPQL, @Query and Native SQL — Practice

### P1. Valid derived method

**Difficulty:** Easy · **Type:** MCQ

For an entity with fields `email`, `active` and `createdAt`, which derived method is valid?

- A) `findByMailAndActive(String mail, boolean active)`
- B) `findByEmailIgnoreCaseAndActiveTrue(String email)`
- C) `getAllWhereEmail(String email)`
- D) `findByEmail_Active(String email)`

<details>
<summary>Answer</summary>

**Answer:** B) `findByEmailIgnoreCaseAndActiveTrue(String email)`

**Explanation:** `mail` is not a property (startup fails), C has no valid subject/predicate structure, and D tries to traverse `email` as if it were an association.

</details>

### P2. Write the query

**Difficulty:** Medium · **Type:** Coding

Write a repository method that returns the total order value per customer for orders placed after a given instant, highest first, using JPQL and an interface projection.

<details>
<summary>Answer</summary>

```java
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface CustomerTotal {
    Long getCustomerId();

    BigDecimal getTotal();
}

interface CustomerTotalRepository extends JpaRepository<CustomerOrder, Long> {

    @Query("""
            select o.customerId as customerId, sum(o.total) as total
            from CustomerOrder o
            where o.createdAt > :since
            group by o.customerId
            order by sum(o.total) desc
            """)
    List<CustomerTotal> totalsSince(@Param("since") Instant since);
}
```

Aliases (`as customerId`) map to the projection's getters.

</details>

### P3. Stale entity

**Difficulty:** Medium · **Type:** Debugging

A transactional method loads an order, calls `@Modifying @Query("update CustomerOrder o set o.status = 'CANCELLED' where o.id = :id")`, then returns `order.getStatus()` — which still says `PLACED`. Why? Fix it.

<details>
<summary>Answer</summary>

The bulk update ran in the database without touching the managed entity in the persistence context. Add `@Modifying(clearAutomatically = true)` and reload the order, or — for a single entity — just set the status on the managed entity and let dirty checking update it.

</details>

### P4. Injection risk

**Difficulty:** Medium · **Type:** Code analysis

```java
public List<Product> search(String name) {
    return em.createQuery("select p from Product p where p.name like '%" + name + "%'", Product.class)
             .getResultList();
}
```

What is the risk, and how do you fix it?

<details>
<summary>Answer</summary>

JPQL injection: crafted input can change the query (for example `' or '1'='1`). Bind a parameter: `createQuery("select p from Product p where p.name like :pattern", Product.class).setParameter("pattern", "%" + name + "%")`, or use a derived method `findByNameContaining(String name)`.

</details>
