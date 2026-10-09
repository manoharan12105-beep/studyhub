# Capstone: Ship a Safe Fix to orderdesk

**Lab:** Capstone · **Module:** Practical Labs · **Difficulty:** Advanced · **Verification:** Partially tested — the reference solution (BUG-101 fix with transaction, SEC-3 fix, FEAT-7 with tests) builds with `Tests run: 13 … BUILD SUCCESS`, and with the added 409 test `Tests run: 14`; every artifact you produce with Claude Code is yours to verify — none of it is shown here.

> [!IMPORTANT]
> No paid service, production system or public repository is needed. Everything runs on your machine against the orderdesk starter. If you use GitHub, use a **private practice** repository.

## Objective

Starting from the orderdesk **starter**, use Claude Code safely to deliver: a documented bug fix, a feature with tests, a security fix, project instructions and guardrails, and a verified change summary. You're graded on **evidence and safety**, not on how much Claude wrote.

## Prerequisites

- All labs, or at least 04, 05, 06, 08, 09 and 12.
- A fresh copy of the starter (*Lab Setup*), committed on `main`.

## Scenario

You've inherited orderdesk with four known problems and one feature request:

| Item | Description | Source |
|------|-------------|--------|
| BUG-101 | 500 for orders without a discount code; failed creates still stored | `docs/issues/BUG-101.md` |
| SEC-3 | Support search is injectable | Found in Lab 01 / Lab 12 |
| FEAT-7 | Mark an order as paid | `docs/issues/FEAT-7.md` |
| Docs | `CLAUDE.md` is one line | Repository |
| Tests | No regression tests for the bugs | Repository |

## Starting State

```bash
git switch main
git log --oneline     # the starter commit only
./mvnw -B verify      # Tests run: 7, Failures: 0, Errors: 1 — BUILD FAILURE
```

## Instructions

### Step 1: Set up the guardrails first

1. Write a specific `CLAUDE.md` (Lab 04).
2. Add `.claude/settings.json` with allow/ask/deny rules (Lab 08).
3. Add the file and command guard hooks (Lab 09); test each with piped input.
4. Commit: `chore: Claude Code project setup`.

### Step 2: BUG-101 (branch `fix/bug-101`)

Reproduce **both** symptoms with failing tests; fix the causes (null/blank code; transactional create); full build green; review the diff; write the PR description. Commit.

### Step 3: SEC-3 (branch `fix/sec-3`)

Reproduce with a hostile-input test that has stored rows; parameterize the query; validate with the read-only security reviewer; search the code for the same pattern elsewhere. Commit.

### Step 4: FEAT-7 (branch `feat/7-mark-order-paid`)

Plan in plan mode; one test per acceptance criterion (including 409); implement with the state rule in `Order`; prove at least one test can fail (mutation); review with the reviewer subagents; commit.

### Step 5: Verified change summary

For each branch, a PR description: what changed, how each requirement is verified (test names), the exact `./mvnw -B verify` summary line, what wasn't verified, and the review findings you validated or rejected.

## Deliverables

| # | Deliverable | Evidence required |
|---|-------------|-------------------|
| 1 | `CLAUDE.md`, `.claude/settings.json`, hook scripts | Commands in CLAUDE.md run; settings validate; hook test transcript (input → exit code/output) |
| 2 | BUG-101 branch | Failing tests before (output), passing after; stored-row symptom fixed |
| 3 | SEC-3 branch | `expected:<0> but was:<…>` failure before; green after |
| 4 | FEAT-7 branch | Five behaviours each with a test; one mutation check output |
| 5 | Three PR descriptions | Evidence and "not verified" sections |
| 6 | Review log | Each AI finding: validated / rejected (reason) / needs a human |
| 7 | Reflection (½ page) | What Claude did well, where you intervened, what you'd configure differently |

## Grading Rubric

| Criterion | Excellent (4) | Good (3) | Weak (1–2) | Points |
|-----------|---------------|----------|------------|--------|
| Reproduction | Every symptom has a failing test seen before the fix | Most symptoms | Fixes without reproduction | 4 |
| Correctness | Causes fixed; build green; edge cases (blank, 409, rollback) covered | Main paths fixed | Symptoms masked (caught exceptions, weakened tests) | 4 |
| Test integrity | Only additions/strengthening in `src/test`; mutation check done | Additions only | Any weakened, disabled or deleted test | 4 |
| Security | SQL parameterized; regression test with stored rows; secrets denied; no secrets anywhere | Fix without test | Hand-escaping, or secrets in files/prompts | 4 |
| Scope | Diffs contain only what each task needs | Minor extras explained | Unrelated refactors, dependency or migration changes | 4 |
| Guardrails | CLAUDE.md specific and true; rules and hooks tested | Present but untested | Missing, or `bypassPermissions` used | 4 |
| Review | Findings validated with evidence; rejections reasoned | Findings listed | AI findings accepted or ignored wholesale | 4 |
| Communication | PR descriptions with exact output and honest gaps | Missing gaps | "All tests pass" without output | 4 |
| **Total** | | | | **32** |

24+ is a strong result. Any of these caps the grade at "Weak" regardless of points: a weakened test, an edited applied migration, a secret in a file or prompt, a push or commit you didn't review.

## Common Mistakes

- Fixing the 500 and missing the stored-row symptom.
- A SEC-3 test with no stored rows (passes before and after the fix).
- FEAT-7 without a 409 test, or with a migration it doesn't need.
- Accepting "tests pass" from a reviewer subagent that can't run tests.
- One branch with all changes mixed together.
- Running in `bypassPermissions` "to save time".

## Verification

- ☐ `main` + three branches, each with a green `./mvnw -B verify` (record the summary line).
- ☐ `git diff main -- src/main/resources/db/migration` is empty on every branch.
- ☐ `git log -p -- src/test` shows only added or strengthened assertions.
- ☐ Deliverables 1–7 complete.

## Self-Assessment

Answer honestly before grading yourself:

1. Could you explain every line Claude wrote, without asking it?
2. For each fix, what would have happened if you had accepted Claude's first proposal unchanged?
3. Which guardrail actually stopped something? Which never fired?
4. Where did you trust a claim without evidence — and what did it cost or nearly cost?
5. If a teammate repeated this tomorrow, what one configuration change would help them most?

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Branches conflict when combined | Overlapping edits in `OrderController` | Merge one at a time; rerun tests after each |
| Build green locally, red after merge | Tests depend on shared database state | Make assertions independent of other tests' rows |
| Hook blocks a legitimate edit | Guard too broad | Narrow the pattern; retest with piped input |

## Security Notes

- orderdesk is deliberately vulnerable before SEC-3: never deploy it or push it publicly.
- Keep `.env` files placeholder-only and denied; never paste keys into prompts.
- Pushes, PRs and merges are your decisions, behind `ask` rules.

## Cleanup

Archive your deliverables (PR descriptions, review log, reflection) outside the repository if you want to keep them, then delete the practice folder.

## Completion Checklist

- ☐ Guardrails set up and tested before feature work.
- ☐ BUG-101, SEC-3 and FEAT-7 delivered on separate branches with evidence.
- ☐ Rubric scored honestly; self-assessment written.

## Follow-up Challenges

- Run the bundled `/code-review` on each branch and compare its findings with your review log.
- Present the capstone in 5 minutes as you would in an interview: problem, approach, evidence, one thing you'd do differently.
