# @Transactional: Boundaries, Rollback Rules and Proxies — Practice

### P1. Commit or rollback?

**Difficulty:** Easy · **Type:** MCQ

A `@Transactional` method saves an order and then throws `java.io.IOException`. What happens to the order?

- A) Rolled back
- B) Committed
- C) Depends on the database
- D) Spring throws `UnexpectedRollbackException`

<details>
<summary>Answer</summary>

**Answer:** B) Committed

**Explanation:** `IOException` is checked; by default checked exceptions do not trigger rollback.

</details>

### P2. Swallowed exception

**Difficulty:** Medium · **Type:** Code analysis

```java
@Transactional
public void transfer(long from, long to, BigDecimal amount) {
    try {
        accountRepository.debit(from, amount);
        accountRepository.credit(to, amount);      // throws
    } catch (Exception e) {
        log.error("transfer failed", e);
    }
}
```

What happens to the debit?

<details>
<summary>Answer</summary>

It is committed, because the exception is caught and the method returns normally — money disappears. Either rethrow (preferably a domain exception), or call `TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()` before returning an error result.

</details>

### P3. Batch commits

**Difficulty:** Medium · **Type:** Coding

Import 100 000 rows so that each block of 1 000 rows is committed separately and one bad block does not undo the others.

<details>
<summary>Answer</summary>

Inject `TransactionTemplate` and loop over chunks: `for (List<Row> chunk : chunks) { try { tx.executeWithoutResult(s -> chunk.forEach(repo::save)); } catch (RuntimeException e) { log and record the failed chunk } }`. With JPA, also flush/clear (or rely on the per-chunk transaction ending) to keep the persistence context small, and enable JDBC batching.

</details>
