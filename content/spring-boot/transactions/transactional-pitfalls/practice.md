# Transactional Pitfalls and Self-Invocation — Practice

### P1. Is there a transaction?

**Difficulty:** Easy · **Type:** MCQ

`OrderController` calls `orderService.checkout()`, which is **not** annotated; `checkout()` calls `this.saveOrder()`, which is `@Transactional`. Does `saveOrder` run in a transaction?

- A) Yes, always
- B) No, the call via `this` bypasses the proxy
- C) Only if `saveOrder` is public
- D) Only with `REQUIRES_NEW`

<details>
<summary>Answer</summary>

**Answer:** B) No, the call via `this` bypasses the proxy

**Explanation:** Being public does not help; only calls through the proxy are intercepted.

</details>

### P2. Fix the design

**Difficulty:** Medium · **Type:** Coding

Refactor so that each imported row is saved in its own transaction and a failing row does not undo the others:

```java
@Service
class ImportService {
    public void importAll(List<Row> rows) {
        for (Row row : rows) {
            try {
                importOne(row);
            } catch (RuntimeException e) {
                log.warn("skipping row {}", row.id(), e);
            }
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void importOne(Row row) {
        // several inserts
    }
}
```

<details>
<summary>Answer</summary>

Move `importOne` to a separate bean (`RowImporter`) and inject it into `ImportService`, so `rowImporter.importOne(row)` goes through the proxy and gets its own REQUIRES_NEW (or simply REQUIRED, since `importAll` is not transactional) transaction. Alternatively keep it in the class and wrap each row in `transactionTemplate.executeWithoutResult(...)`.

</details>

### P3. Async and transactions

**Difficulty:** Hard · **Type:** Debugging

Inside `@Transactional placeOrder()`, the code saves the order and then calls `@Async notificationService.sendConfirmation(order.getId())`, which loads the order by id. Sometimes the notification service throws "order not found". Why, and how do you fix it?

<details>
<summary>Answer</summary>

The async method runs on another thread with its own transaction, possibly before `placeOrder` commits, so the order is not yet visible. Trigger the notification after commit: publish an event and handle it with `@TransactionalEventListener(phase = AFTER_COMMIT)` (optionally `@Async`), or register a `TransactionSynchronization.afterCommit` callback.

</details>
