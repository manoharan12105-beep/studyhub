# Lab 03: Compare Planning and Implementation Workflows

**Lab:** 03 · **Module:** Foundations · **Difficulty:** Beginner · **Verification:** Instructions only — both runs need a model session; outcomes differ between runs, so none are shown.

## Objective

Solve the same small task twice — once by asking directly, once through plan mode — and compare the diffs, the number of corrections you needed and the surprises.

## Prerequisites

- *Lab Setup* and Lab 02 completed.

## Scenario

Support wants the search endpoint to reject empty input: `GET /api/orders/search?email=` should return **400** instead of running a query. Small task, real decisions: where to validate, which status, which test.

## Starting State

```bash
git switch main
git status --short          # clean
git switch -c lab03-direct
```

## Instructions

### Step 1: Direct run

```bash
claude
```

```text
Make GET /api/orders/search return 400 when the email parameter is empty or blank. Add a test.
Run ./mvnw -B verify and show the final Tests run line.
```

Approve or reject each edit as it comes (Manual mode). When it finishes, record:

```bash
git diff --stat
git diff
```

Note: files changed, how the 400 is produced, the test added, whether the BUG-101 test still fails (it should — not part of this task), and every correction you had to make.

### Step 2: Reset for the second run

```bash
git add -A && git commit -m "lab03 direct attempt"
git switch main
git switch -c lab03-planned
```

### Step 3: Planned run

```bash
claude --permission-mode plan
```

```text
Plan this change without editing: GET /api/orders/search must return 400 when email is empty
or blank. Find how the app validates input today (cite file:line), propose where the check goes
and why, list the exact tests to add, and say what you will NOT change.
```

Review the plan. Push back on anything you don't want (for example a new exception handler class for a one-line check). Approve it, then:

```text
Implement the approved plan. Tests first; show them failing, then passing. Show the final
./mvnw -B verify summary.
```

### Step 4: Compare

```bash
git diff lab03-direct lab03-planned --stat
```

Fill in:

| | Direct | Planned |
|---|---|---|
| Files changed | | |
| Lines changed | | |
| How the 400 is produced (`@NotBlank` + `@Validated`, manual check, …) | | |
| Tests added | | |
| Corrections you made | | |
| Surprises (unrequested changes) | | |
| Total time | | |

## Verification

- ☐ Both branches exist with a commit each.
- ☐ In both, `GET /api/orders/search?email=` returns 400 in a test.
- ☐ The comparison table is filled in from the real diffs.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Validation annotation has no effect | Method-level validation needs the controller to be validated | Ask Claude to show the test failing first; check the explanation |
| Unrelated tests changed | Scope creep | Reject the edit; restate the scope |
| Build fails on `orderWithoutDiscountCodeCostsTheSubtotal` | That's BUG-101, pre-existing | Leave it for Lab 05 |

## Security Notes

- Rejecting blank input is good hygiene but doesn't fix the SQL injection in the same endpoint — keep that for Lab 12.
- Approve commands one by one in Manual mode; don't switch to bypass to "save time".

## Cleanup

```bash
git switch main
git branch -D lab03-direct lab03-planned   # only after you've filled in the table
```

## Completion Checklist

- ☐ Same task done both ways.
- ☐ Differences recorded with evidence.
- ☐ A personal rule written down: "I plan first when …".

## Follow-up Challenges

- Repeat with a larger task (FEAT-7 is Lab 06) and see whether the planning advantage grows.
- Try `acceptEdits` mode for the implementation step and note what you lose and gain.
