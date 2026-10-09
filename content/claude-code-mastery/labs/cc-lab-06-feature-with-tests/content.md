# Lab 06: Implement a Feature with Tests and Inspect the Diff

**Lab:** 06 · **Module:** Git and GitHub Workflows · **Difficulty:** Intermediate · **Verification:** Partially tested — the reference implementation, its tests (including the 409 test) and the mutation check were run with `./mvnw -B verify` on JDK 21; the Claude session was not run.

## Objective

Implement FEAT-7 ("mark as paid") through **Inspect → Plan → Implement → Test → Review the diff → Fix → Summarize**, with one test per acceptance criterion, and read every line of the resulting diff.

## Prerequisites

- Labs 04 and 05 (a useful `CLAUDE.md`; the BUG-101 fix merged into your `main` or applied on this branch).
- The lesson *Working with Issues and the Feature Implementation Workflow*.

## Scenario

Finance needs `POST /api/orders/{id}/pay` (`docs/issues/FEAT-7.md`): NEW → PAID (200), PAID again → 200 unchanged, CANCELLED or SHIPPED → 409, unknown → 404, no schema change.

## Starting State

```bash
git switch main
git switch -c feat/7-mark-order-paid
./mvnw -B verify      # green before you start (BUG-101 fixed)
```

## Instructions

### Step 1: Inspect (plan mode)

```bash
claude --permission-mode plan
```

```text
Read docs/issues/FEAT-7.md. Restate each acceptance criterion as a testable behaviour. Show how
the app returns 404 today (file:line) and where order state lives. List anything unclear.
```

**Expected result:** five behaviours; the existing 404 via `ResponseStatusException` in `OrderController.get`; state in `Order.status`.

### Step 2: Plan

```text
Plan FEAT-7 file by file. Put the state rule in Order, not the controller. Name one test per
acceptance criterion. Confirm no migration is needed. Say what you will not change.
```

Reject any plan with a new migration, a new service layer or unrelated refactors.

### Step 3: Tests first

Approve the plan, then:

```text
Write the tests first in OrderControllerTest and run them; show them failing. Don't implement yet.
```

**Expected result:** the new tests fail — calls to a missing endpoint return 404 `NoResourceFoundException`, so status assertions fail. If any new test passes now, it isn't testing the feature.

### Step 4: Implement

```text
Implement the plan. Run OrderControllerTest, then ./mvnw -B verify, and show the final summary.
```

The reference implementation:

```java
/** NEW becomes PAID; paying a PAID order again changes nothing. */
public void markPaid() {
    if (status == OrderStatus.PAID) {
        return;
    }
    if (status != OrderStatus.NEW) {
        throw new IllegalStateException("Order " + id + " is " + status + " and cannot be paid");
    }
    status = OrderStatus.PAID;
}
```

```java
@PostMapping("/{id}/pay")
@Transactional
public OrderResponse pay(@PathVariable long id) {
    Order order = find(id);
    try {
        order.markPaid();
    } catch (IllegalStateException e) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
    }
    return toResponse(order);
}
```

### Step 5: Review the diff against the criteria

```bash
git diff --stat
git diff
```

Check: only `Order.java`, `OrderController.java`, `OrderControllerTest.java` (plus `find()` helper extraction is fine); no migration; one test per criterion. The reference solution shipped without a **409** test — if yours lacks one too, add it:

```java
@Test
void payingACancelledOrderIs409() throws Exception {
    Order order = orders.save(new Order("noor@example.com", 1_500, null));
    jdbc.update("UPDATE orders SET status = 'CANCELLED' WHERE id = ?", order.getId());

    mvc.perform(post("/api/orders/" + order.getId() + "/pay"))
            .andExpect(status().isConflict());
}
```

(`jdbc` is an `@Autowired JdbcTemplate` field in the test class; no API can cancel an order yet.)

**Output** (reference solution with the 409 test):

```text
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 10.41 s -- in com.example.orderdesk.order.OrderControllerTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.140 s -- in com.example.orderdesk.order.PriceCalculatorTest
[INFO] Tests run: 14, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

### Step 6: Prove the 409 test can fail

Temporarily change the guard `if (status != OrderStatus.NEW)` to `if (false)` and run only that test:

```bash
./mvnw -q test -Dtest=OrderControllerTest#payingACancelledOrderIs409
```

**Output:**

```text
java.lang.AssertionError: Status expected:<409> but was:<200>
```

Restore the guard (`git diff` should no longer show the change) and rerun the full build.

### Step 7: Summarize

```text
Summarize for a pull request: files changed, the test that proves each acceptance criterion,
the exact ./mvnw -B verify summary, and anything not verified.
```

**Expected result:** a summary you can check line by line against the diff and the build output — including "not verified: concurrent pay requests".

## Verification

- ☐ Five behaviours, each with a named test.
- ☐ Each new test was seen failing first (or by mutation).
- ☐ `./mvnw -B verify` green; no migration in the diff.
- ☐ Summary matches the diff and the build output.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Status not saved after pay | No transaction around the change | `@Transactional` on `pay` |
| 500 instead of 409 | `IllegalStateException` not mapped | Map it to `ResponseStatusException(CONFLICT)` |
| New tests pass before implementation | Wrong URL or no status assertion | Fix tests until they fail for the right reason |
| A migration appeared | Scope creep | Reject; FEAT-7 needs no schema change |

## Security Notes

- New endpoints that change state need the same scrutiny as existing ones; orderdesk has no authentication (a known limitation of this teaching app — real services must authorize who may mark orders paid).
- Don't commit or push from the session; review first.

## Cleanup

Keep the branch for Lab 12 (parallel review). To reset: `git switch main && git branch -D feat/7-mark-order-paid`.

## Completion Checklist

- ☐ Feature implemented through all seven steps.
- ☐ Diff read in full.
- ☐ Evidence collected for the PR description.

## Follow-up Challenges

- Add a test for paying a SHIPPED order.
- Ask Claude what happens if two pay requests for the same order arrive at the same time, and how you would test it.
