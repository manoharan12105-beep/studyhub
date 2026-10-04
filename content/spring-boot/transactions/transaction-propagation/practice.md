# Transaction Propagation — Practice

### P1. Default propagation

**Difficulty:** Easy · **Type:** MCQ

What is the default propagation of `@Transactional`?

- A) `REQUIRES_NEW`
- B) `SUPPORTS`
- C) `REQUIRED`
- D) `NESTED`

<details>
<summary>Answer</summary>

**Answer:** C) `REQUIRED`

**Explanation:** Join an existing transaction or create one if none exists.

</details>

### P2. Predict the rows

**Difficulty:** Medium · **Type:** Behavior

`placeOrder()` (REQUIRED) inserts an order, then calls `auditService.log()` (REQUIRES_NEW, separate bean) which inserts an audit row, then throws `RuntimeException`. Which rows exist afterwards?

<details>
<summary>Answer</summary>

Only the audit row. The audit transaction committed independently before the outer transaction rolled back.

</details>

### P3. Login attempts

**Difficulty:** Medium · **Type:** Design

`AuthService.login()` is transactional. On a wrong password it increments `failed_attempts` and then throws `BadCredentialsException`, which rolls back the increment. How do you keep the counter?

<details>
<summary>Answer</summary>

Move the increment to a separate bean method with `@Transactional(propagation = Propagation.REQUIRES_NEW)` (`LoginAttemptService.recordFailure(userId)`), so it commits independently; or perform it after the transaction, or configure `noRollbackFor = BadCredentialsException.class` if nothing else in `login()` must roll back.

</details>

### P4. Silent rollback

**Difficulty:** Hard · **Type:** Debugging

Logs show `UnexpectedRollbackException` from `CheckoutService.checkout()`, but no exception is visible inside the method. The method wraps `couponService.apply(code)` (a `@Transactional` bean method) in a try/catch. Explain the cause and two fixes.

<details>
<summary>Answer</summary>

`couponService.apply` threw a runtime exception inside the shared REQUIRED transaction, marking it rollback-only; `checkout` caught it and continued, so the commit failed. Fixes: (1) let `apply` validate without throwing (return a result object) or validate before calling it; (2) give `apply` `REQUIRES_NEW` (or `noRollbackFor` for that exception) if its failure must not affect checkout; or (3) rethrow so the caller sees a clear failure.

</details>
