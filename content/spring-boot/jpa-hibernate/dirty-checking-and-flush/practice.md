# Dirty Checking, Flush, save() and saveAndFlush() — Practice

### P1. Is it saved?

**Difficulty:** Easy · **Type:** MCQ

```java
@Transactional
public void rename(Long id, String name) {
    Product p = productRepository.findById(id).orElseThrow();
    p.setName(name);
}
```

What happens?

- A) Nothing is saved because `save()` is not called
- B) The new name is saved at commit through dirty checking
- C) An exception is thrown
- D) The name is saved only if `saveAndFlush()` is called

<details>
<summary>Answer</summary>

**Answer:** B) The new name is saved at commit through dirty checking

**Explanation:** `p` is managed within the transaction; the change is detected at flush.

</details>

### P2. Unexpected update

**Difficulty:** Medium · **Type:** Debugging

A `@Transactional` method loads users and masks their phone numbers (`user.setPhone("******" + last4)`) before mapping them to DTOs. Users' phone numbers in the database become masked. Why? Give two fixes.

<details>
<summary>Answer</summary>

The users are managed; modifying them marks them dirty and the masked values are flushed at commit. Fix: mask while building the DTO without touching the entity, and/or make the method `@Transactional(readOnly = true)` (no flush). Projections that load DTOs directly also avoid the problem.

</details>

### P3. Count the statements

**Difficulty:** Medium · **Type:** Behavior

In one transaction with `SEQUENCE` ids, you call `save(a)`, `save(b)`, then `findByEmail("x")` (a derived JPQL query on the same table), then return. When are the INSERTs executed?

<details>
<summary>Answer</summary>

Before the `findByEmail` query: AUTO flush sends both pending INSERTs because the query reads the same table. Nothing else remains to flush at commit (unless more changes are made).

</details>

### P4. Bulk update staleness

**Difficulty:** Hard · **Type:** Code analysis

```java
@Transactional
public void deactivateAndReport(Long id) {
    User u = userRepository.findById(id).orElseThrow();
    userRepository.deactivateAll();                 // @Modifying @Query("update User u set u.active = false")
    System.out.println(u.isActive());
}
```

What does it print, and why?

<details>
<summary>Answer</summary>

`true`. The bulk JPQL update runs directly in the database and bypasses the persistence context, so the already-managed `u` keeps its old state. Use `@Modifying(clearAutomatically = true)` (and `flushAutomatically = true` if there are pending changes), or `entityManager.refresh(u)`.

</details>
