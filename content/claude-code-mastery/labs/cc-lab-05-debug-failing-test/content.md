# Lab 05: Debug a Failing Java Test

**Lab:** 05 · **Module:** Debugging, Testing and Code Quality · **Difficulty:** Beginner · **Verification:** Partially tested — the failing and passing Maven runs and the fix were run on orderdesk (JDK 21); the Claude conversation needs your model session and was not run.

## Objective

Reproduce the `PriceCalculatorTest` failure, read the stack trace, form a hypothesis with evidence, and fix the **cause** — without weakening any test.

## Prerequisites

- *Lab Setup* (the build fails with one error) and Lab 04 recommended.

## Scenario

BUG-101: orders without a discount code fail. The test `PriceCalculatorTest.orderWithoutDiscountCodeCostsTheSubtotal` fails on `main`.

## Starting State

```bash
git switch main
git switch -c lab05-bug-101
git status --short     # clean
```

## Instructions

### Step 1: Reproduce it yourself first

```bash
./mvnw -q test -Dtest=PriceCalculatorTest
```

**Output** (first lines):

```text
[ERROR] Tests run: 4, Failures: 0, Errors: 1, Skipped: 0, Time elapsed: 0.073 s <<< FAILURE! -- in com.example.orderdesk.order.PriceCalculatorTest
[ERROR] com.example.orderdesk.order.PriceCalculatorTest.orderWithoutDiscountCodeCostsTheSubtotal -- Time elapsed: 0.009 s <<< ERROR!
java.lang.NullPointerException: Cannot invoke "String.trim()" because "discountCode" is null
	at com.example.orderdesk.order.PriceCalculator.totalCents(PriceCalculator.java:14)
	at com.example.orderdesk.order.PriceCalculatorTest.orderWithoutDiscountCodeCostsTheSubtotal(PriceCalculatorTest.java:28)
```

Before asking Claude, write your own one-line hypothesis.

### Step 2: Ask for a diagnosis, not a fix

```bash
claude
```

```text
PriceCalculatorTest.orderWithoutDiscountCodeCostsTheSubtotal fails (docs/issues/BUG-101.md).
Run only that test class, read the stack trace from the first com.example frame, and tell me
the root cause with file:line and evidence. Don't edit anything yet.
```

**Expected result:** Claude runs the test, points at `PriceCalculator.java:14`, and explains that a missing discount code (allowed by `CreateOrderRequest` — only `@Size(max = 20)`) reaches `trim()`. Compare with your hypothesis.

### Step 3: Fix the cause

```text
Fix the cause in PriceCalculator: a null or blank code means no discount. Don't change any
existing test. Add regression tests for a blank code and for rounding down (10% of 999 cents
→ total 900). Run the test class, then ./mvnw -B verify.
```

**Expected result:** a small diff in `PriceCalculator` like:

```java
if (discountCode == null || discountCode.isBlank()) {
    return subtotalCents;
}
```

### Step 4: Check the evidence

With only the production fix (before the new regression tests), the runs were:

**Output:**

```text
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

```text
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

With the two regression tests added, expect 6 tests in `PriceCalculatorTest` and 9 in total.

### Step 5: Review the diff

```bash
git diff --stat
git diff -- src/test
```

**Expected result:** `PriceCalculator.java` and `PriceCalculatorTest.java` only; the test diff contains **only additions**. Any changed `assertEquals` value, `@Disabled` or removed test → reject and ask why.

## Verification

- ☐ The original test passes without being modified.
- ☐ New regression tests exist and passed after the fix.
- ☐ `./mvnw -B verify` shows `BUILD SUCCESS`.
- ☐ The diff touches only the calculator and its test.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Claude proposes `catch (NullPointerException e)` | Fixing the symptom | Reject; restate "null means no discount" |
| Claude changes the expected value | Weakening the test | Reject; the issue defines the expected total |
| The rounding test fails | Implementation rounds to nearest | Integer division rounds down; keep `subtotalCents * percent / 100` |
| Other tests start failing | Unrelated edits | Check `git diff`; revert unrelated hunks |

## Security Notes

- No secrets involved. Keep the session in Manual mode so you see each edit.
- The same endpoint still has SQL injection; that's Lab 12 — don't let this fix grow.

## Cleanup

Keep the branch for Lab 13, or reset: `git switch main && git branch -D lab05-bug-101`.

## Completion Checklist

- ☐ Reproduced before fixing.
- ☐ Root cause identified with evidence.
- ☐ Cause fixed; tests honest; build green.

## Follow-up Challenges

- BUG-101 also says failed creates are stored. Reproduce that (POST without a code on the **unfixed** code, then search) and fix it with `@Transactional` — see *Java and Spring Boot Debugging Scenarios*, scenario 2.
- Add a MockMvc regression test `readsAnOrderWithoutDiscountCode` and confirm it fails on `main`.
