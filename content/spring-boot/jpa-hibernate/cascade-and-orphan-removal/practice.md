# Cascade and orphanRemoval — Practice

### P1. Which deletes the child?

**Difficulty:** Easy · **Type:** MCQ

`Post` maps `@OneToMany(mappedBy = "post", cascade = CascadeType.PERSIST, orphanRemoval = true) List<Comment> comments`. Inside a transaction you call `post.removeComment(c)` (removes from the list and sets `c.post = null`). What happens at commit?

- A) Nothing
- B) The comment's `post_id` is set to `NULL`
- C) The comment row is deleted
- D) The post is deleted

<details>
<summary>Answer</summary>

**Answer:** C) The comment row is deleted

**Explanation:** `orphanRemoval` deletes children removed from the collection, independently of the cascade types.

</details>

### P2. Shared data deleted

**Difficulty:** Medium · **Type:** Debugging

Deleting an `OrderLine` fails with a foreign-key violation from another table, or — in a test database without constraints — the product disappears from the catalogue. `OrderLine` has `@ManyToOne(cascade = CascadeType.ALL) Product product`. Explain.

<details>
<summary>Answer</summary>

`CascadeType.ALL` includes REMOVE, so removing the line also removes its product, which other lines reference. Remove the cascade from the `@ManyToOne`; products have their own lifecycle.

</details>

### P3. Update the lines

**Difficulty:** Medium · **Type:** Coding

Write a method on `PurchaseOrder` (from the lesson) that replaces all lines with a new list without triggering the "no longer referenced" error.

<details>
<summary>Answer</summary>

```java
void replaceLines(java.util.List<OrderLine> newLines) {
    for (OrderLine line : new java.util.ArrayList<>(lines)) {
        removeLine(line);                    // orphans: deleted at flush
    }
    for (OrderLine line : newLines) {
        addLine(line);                       // cascaded persist
    }
}
```

The mapped collection instance is kept; only its contents change.

</details>
