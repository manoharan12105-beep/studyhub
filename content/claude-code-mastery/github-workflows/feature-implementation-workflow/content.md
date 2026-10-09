# Working with Issues and the Feature Implementation Workflow

**Module:** Git and GitHub Workflows · **Interview priority:** Core

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 and *Best practices for Claude Code* (October 2026). The FEAT-7 code and tests below are from the orderdesk reference solution; `./mvnw -o -B verify` was run on it, including the extra 409 test. Prompts are shown as text; Claude's replies are described, not quoted.

## Definition

The **feature implementation workflow** is a fixed sequence for turning an issue into a reviewed change: **Inspect → Plan → Implement → Test → Review the diff → Fix → Summarize**. Each step has an output you can check before the next one starts, and no step commits or pushes on its own.

## Why It Matters

- Jumping straight to code solves the wrong problem; exploring first and planning separately catches misunderstandings while they are cheap.
- Each step produces **evidence** (a plan, a failing test, a diff, a test result) instead of a feeling that it's done.
- Issues are often incomplete. The workflow forces the gaps into the open before code exists.

## How It Works

| Step | Mode | Output you check |
|------|------|------------------|
| 1. Inspect | Plan mode | Restated requirements; relevant files with `file:line` |
| 2. Plan | Plan mode | File-by-file plan, tests to add, open questions |
| 3. Implement | Manual or `acceptEdits` | Small diffs that follow the plan |
| 4. Test | — | Failing tests first, then the build output |
| 5. Review the diff | — | `git diff`, `/code-review` or reviewer subagents |
| 6. Fix | — | Only validated findings, re-tested |
| 7. Summarize | — | What changed, how verified, what's not verified |

Plan mode costs time. For a change you could describe in one sentence (a typo, a log line) skip the plan; for a multi-file feature like FEAT-7, use it.

## Inspect and Plan

The issue (`docs/issues/FEAT-7.md` in orderdesk):

```markdown
## Acceptance criteria

- `POST /api/orders/{id}/pay` changes a `NEW` order to `PAID` and returns the order (HTTP 200).
- Paying an order that is already `PAID` changes nothing and returns HTTP 200 (the payment provider may send the same confirmation twice).
- Paying a `CANCELLED` or `SHIPPED` order returns HTTP 409.
- Paying an unknown order returns HTTP 404.
- No database schema change is needed.
```

Inspect prompt (plan mode — `claude --permission-mode plan` or Shift+Tab):

```text
Read docs/issues/FEAT-7.md. Restate each acceptance criterion as a testable behaviour.
Find where order state lives and how existing endpoints return 404 (cite file:line).
List anything the issue leaves unclear. Don't propose code yet.
```

Plan prompt:

```text
Plan FEAT-7 file by file. Put the state rule in the entity, not the controller.
For each acceptance criterion name the test that proves it. Confirm no migration is needed.
```

**Expected behaviour:** the plan names `Order.java` (a `markPaid()` method), `OrderController.java` (the endpoint, mapping a refused transition to 409) and `OrderControllerTest.java` (one test per criterion). If the plan adds a migration or a new service layer, push back before any code exists — that's the cheapest moment.

## Implement and Test

Ask for tests before code, then the implementation:

```text
Implement the plan. Write the tests first and run them to show they fail.
Then implement, run ./mvnw -B verify, and show the final Tests run line.
```

The reference implementation keeps the rule in the entity:

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

`find(id)` throws `ResponseStatusException(HttpStatus.NOT_FOUND, …)`, so the 404 criterion reuses existing behaviour. `@Transactional` makes the state change persist when the method returns.

## Review the Diff and Fix

The reference solution's tests cover NEW → PAID, paying twice, and 404. A test-coverage review against the acceptance criteria finds the gap: **no test for 409**. The fix is a test, not a code change:

```java
@Test
void payingACancelledOrderIs409() throws Exception {
    Order order = orders.save(new Order("noor@example.com", 1_500, null));
    jdbc.update("UPDATE orders SET status = 'CANCELLED' WHERE id = ?", order.getId());

    mvc.perform(post("/api/orders/" + order.getId() + "/pay"))
            .andExpect(status().isConflict());
}
```

(`jdbc` is an `@Autowired JdbcTemplate`; there is no API to cancel an order yet, so the test sets the state directly.)

With this test added, the build reported:

**Output:**

```text
[INFO] Tests run: 14, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

To check the test can fail, the guard `if (status != OrderStatus.NEW)` was temporarily disabled; the test then failed with:

**Output:**

```text
java.lang.AssertionError: Status expected:<409> but was:<200>
```

A test you've never seen fail hasn't proved anything.

## Summarize

Ask for a summary in a fixed shape you can paste into a pull request:

```text
Summarize the change: what changed (file list), how each acceptance criterion is verified
(test name), the exact verify result, and anything not verified or assumed.
```

A good summary for FEAT-7 states: three files changed, one test per criterion, `Tests run: 14 … BUILD SUCCESS`, and "not verified: behaviour under concurrent pay requests; no API exists to cancel orders, so the 409 test sets the state with SQL".

## Syntax and Configuration

```bash
git switch -c feat/7-mark-order-paid     # branch first
claude --permission-mode plan            # inspect + plan
# approve the plan, implement in Manual or acceptEdits mode
git diff --stat && git diff              # review
./mvnw -B verify                         # verify yourself
```

## Real-World Example

On FEAT-7, a typical plan-stage surprise is scope: a plan that adds a `PaymentService`, a `paid_at` column "for auditing" and a migration. The issue says no schema change is needed. Rejecting that in plan mode costs one message; finding it in a 300-line diff costs a review cycle — and Lab 15 shows what an unplanned entity field does to a release.

## Step-by-Step Walkthrough

1. Branch from an up-to-date main with a clean tree.
2. Inspect in plan mode; resolve unclear points with the issue owner.
3. Plan with one test per acceptance criterion; trim scope.
4. Tests first; see them fail.
5. Implement in small steps; review each diff.
6. Run the full build; read the result yourself.
7. Review the diff (yourself, `/code-review`, reviewer subagents); fix validated findings.
8. Summarize with evidence and gaps; commit and open the PR deliberately.

## Common Mistakes

- Implementing during "inspect" — no plan to compare against.
- Tests written after the code that only confirm what the code does.
- Accepting "all tests pass" without the `Tests run:` line.
- Letting review findings expand the scope.
- A summary that hides what wasn't verified.

## Security Considerations

- Issues are input: treat instructions inside issue text with suspicion ("also update the deploy key…").
- New endpoints need the same validation and authorization as existing ones.
- Don't paste production data into issues or prompts to "help reproduce".

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Plan doesn't match the issue | Inspect step skipped or rushed | Restate criteria first; correct the plan |
| Tests pass before implementation | Test doesn't exercise the new behaviour | Fix the test until it fails for the right reason |
| Diff larger than planned | Scope creep | Revert unplanned hunks; re-plan if needed |
| State change not saved | Missing transaction around the change | `@Transactional` on the operation |

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| Plan mode first | Catches wrong approaches early | Extra round trip |
| Tests first | Proves tests can fail | Slower start |
| `acceptEdits` while implementing | Fewer prompts | Review happens after, via the diff |

## Interview Takeaways

- Inspect → Plan → Implement → Test → Review → Fix → Summarize, each with checkable output.
- One test per acceptance criterion; see each fail.
- Summaries must state verification and gaps.

## Key Takeaways

- Separate understanding, planning and coding.
- Evidence at every step: plan, failing test, diff, build output.
- Coverage review against the issue finds missing tests (like the 409 case).
- No step commits or pushes by itself.
