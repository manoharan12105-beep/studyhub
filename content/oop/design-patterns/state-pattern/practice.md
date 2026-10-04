# State — Practice

### P1. Spot the need

**Difficulty:** Easy · **Type:** MCQ

Which code most strongly suggests the State pattern?

- A) A method choosing between three sort algorithms by input size
- B) Five methods each starting with `switch (status)` over the same six statuses
- C) A class creating objects of different subclasses
- D) A wrapper adding logging around a service

<details>
<summary>Answer</summary>

**Answer:** B

**Explanation:** Behaviour of many operations depends on one state field. A suggests Strategy, C a factory, D a decorator or proxy.

</details>

### P2. Trace the states

**Difficulty:** Medium · **Type:** Output-based

Using the lesson's `Order`, what is printed by this sequence?

```java
Order order = new Order();
attempt("ship", order::ship, order);
attempt("cancel", order::cancel, order);
attempt("pay", order::pay, order);
```

<details>
<summary>Answer</summary>

**Output:**

```text
rejected: cannot ship when CREATED
  ship -> CREATED
cancelled, nothing to refund
  cancel -> CANCELLED
rejected: cannot pay when CANCELLED
  pay -> CANCELLED
```

**Explanation:** `Created` does not override `ship`, so the default rejects it; `cancel` moves to `Cancelled`, which rejects everything.

</details>

### P3. Add a state

**Difficulty:** Hard · **Type:** Coding

Add an `OnHold` state: from `Paid`, `hold()` moves to `OnHold`; from `OnHold`, `release()` returns to `Paid` and `cancel()` cancels with a refund. Describe the changes.

<details>
<summary>Answer</summary>

1. Add default methods `hold(Order)` and `release(Order)` to `OrderState` that throw "not allowed".
2. Add `hold()` and `release()` to `Order`, delegating to the state.
3. Override `hold` in `Paid` to print and call `order.setState(new OnHold())`.
4. Create `OnHold` implementing `release` (→ `Paid`), `cancel` (refund → `Cancelled`) and `name()` returning `"ON_HOLD"`.

**Explanation:** Existing states other than `Paid` are untouched; they inherit the "not allowed" defaults for the new operations.

</details>
