# Optimistic and Pessimistic Locking — Practice

### P1. Which exception?

**Difficulty:** Easy · **Type:** MCQ

Two users edit the same `Product` (with `@Version`). The second user's save fails. Which exception does Spring Data typically surface?

- A) `DataIntegrityViolationException`
- B) `ObjectOptimisticLockingFailureException`
- C) `LazyInitializationException`
- D) `TransactionRequiredException`

<details>
<summary>Answer</summary>

**Answer:** B) `ObjectOptimisticLockingFailureException`

**Explanation:** Spring translates JPA's `OptimisticLockException` into this `DataAccessException` subclass.

</details>

### P2. Lost update

**Difficulty:** Medium · **Type:** Code analysis

```java
@Transactional
public void addLoyaltyPoints(long userId, int points) {
    User u = userRepository.findById(userId).orElseThrow();
    u.setPoints(u.getPoints() + points);
}
```

Two requests add 10 and 20 points at the same time to a user with 100 points. What final values are possible, and how do you make it correct?

<details>
<summary>Answer</summary>

130 (correct), 110 or 120 (a lost update). Fix with `@Version` plus retry, a pessimistic lock on read, or an atomic `update User u set u.points = u.points + :p where u.id = :id`.

</details>

### P3. Retry correctly

**Difficulty:** Hard · **Type:** Design

Where should the retry for optimistic lock failures be placed relative to `@Transactional`, and why?

<details>
<summary>Answer</summary>

Outside the transaction: a caller (or a retry annotation on a method that calls the transactional service through its proxy) re-invokes the whole transactional method so each attempt starts a fresh transaction and re-reads the current version. Retrying inside the failed transaction does not work — it is marked rollback-only and its persistence context holds stale state.

</details>

### P4. Booking seats

**Difficulty:** Hard · **Type:** Scenario

A cinema app sees many users trying to book the same few seats at the same instant. Which locking strategy would you choose for the seat rows?

<details>
<summary>Answer</summary>

Either a pessimistic `FOR UPDATE` (with `NOWAIT`/short timeout, telling losers "seat just taken"), or an atomic conditional update (`update seat set status = 'HELD', held_by = ? where id = ? and status = 'FREE'`) — 1 row means you got it. Pure optimistic locking would work but produce many conflicts. Add a unique constraint on (show, seat) bookings as a final guard.

</details>
