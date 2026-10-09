# Reusable Workflows: Review, Testing, Documentation and Release

**Module:** Skills, Slash Commands and Reusable Workflows · **Interview priority:** Frequently asked

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 and *Extend Claude with skills* (October 2026). The six orderdesk skills below passed `claude plugin validate .claude/skills`. They were **not** run in a model session, so no example of their output is shown.

## Definition

A **reusable engineering workflow** is a team procedure — reviewing a change, investigating a bug, checking SQL, writing a regression test, updating docs, checking a release — written down once as a skill so that every developer (and Claude) follows the same steps and reports the same evidence.

## Why It Matters

- Review quality varies with who asks and how. A skill makes the checklist the same every time.
- Each workflow ends in **evidence** — a test result, a `file:line` citation, a PASS/FAIL line — which is what a human reviewer needs to trust AI-assisted work.
- Writing the workflow down exposes gaps ("what does *done* mean for a migration?") the team had never agreed on.

## How It Works

Each workflow skill answers five questions:

| Question | Where it goes in `SKILL.md` |
|----------|-----------------------------|
| When does it apply? | `description` (and `paths` for area-specific skills) |
| Who may start it? | `disable-model-invocation` for side effects or deliberate timing |
| What does it need to see? | `$ARGUMENTS` and injected `` !`commands` `` |
| What may it do without asking? | `allowed-tools`, as narrow as possible |
| What must it report? | A fixed report format with evidence, and what it must **not** do |

```text
orderdesk/.claude/skills/
├── java-review/SKILL.md               review uncommitted changes (read-only)
├── spring-bug-investigation/SKILL.md  reproduce → hypothesis → fix → verify
├── sql-review/SKILL.md                auto-loads for migrations and *Dao.java
├── regression-test/SKILL.md           failing test first, no production changes
├── update-docs/SKILL.md               manual only: README endpoint list
└── pre-release-check/SKILL.md         manual only: GO / NO-GO with evidence
```

## Java Code Review

```markdown
---
name: java-review
description: Reviews the uncommitted Java changes in orderdesk for correctness, tests, security and scope. Use when the user asks to review changes, a diff or work before committing.
allowed-tools: Bash(git status *) Bash(git diff *)
---

## Current changes

!`git status --short`

!`git diff HEAD`

## Review the changes above

Check in this order and cite `file:line` for every finding:

1. Correctness: does the change do what the task asked, including null, blank and boundary inputs?
2. Tests: is new behaviour tested? Was any existing assertion changed, skipped or deleted? Flag every change under `src/test`.
3. Security: SQL built by string concatenation, user input or personal data in logs, disabled validation, secrets in code.
4. Project rules from CLAUDE.md: money as `long` cents, constructor injection, `ResponseStatusException` status codes, migrations never edited.
5. Scope: files or lines the task did not need.

Report findings grouped as **Must fix**, **Should fix** and **Question**; write "none" for an empty group. Do not edit files: this skill only reviews.
```

What makes it work: the diff is **injected**, so the review is about real changes, not what Claude remembers editing; the order puts correctness and tests before style; every finding needs a `file:line`, which makes invented findings easy to spot; and it says plainly that it must not edit.

## Spring Boot Bug Investigation

The `spring-bug-investigation` skill (quoted in full in *Writing a Good Skill*) takes the issue as `$ARGUMENTS` and forces the order **read → reproduce with a failing test → read the stack trace from the first project frame → one hypothesis with evidence → fix the cause → verify → report**. Its key lines are the guard rails:

```text
If the cause is still unclear after step 4, stop and report what you know.
Never change a test's expected value to match buggy output.
```

Without them, an agent under pressure "fixes" the symptom (catching the `NullPointerException`) or the test.

## SQL Review

```markdown
---
name: sql-review
description: Reviews SQL in orderdesk, both Flyway migrations and JdbcTemplate queries, for injection, portability and migration safety. Use when SQL, a migration or a Dao class changes.
paths: "src/main/resources/db/migration/**, src/main/java/**/*Dao.java"
---

Review the SQL you are working on against these rules and cite `file:line` for each finding.

Queries in Java:
- Values are passed as `?` parameters to `JdbcTemplate`, never concatenated into the SQL string.
- Queries that return lists have a deterministic `ORDER BY`.
- No `SELECT *` in production code.

Migrations:
- A change is a new `V<n>__<description>.sql` with the next number; existing migrations are never edited.
- SQL must run on H2 (tests) and PostgreSQL (production): avoid vendor-only syntax.
- Adding a `NOT NULL` column to a table with data needs a default or a backfill step.
- Dropping or renaming a column needs a two-release plan; ask the developer before writing it.

Report findings as **Must fix** and **Should fix**. Do not run migrations against any shared database.
```

`paths` keeps it out of unrelated work: Claude loads it automatically only when it works with matching files. The starter `OrderSearchDao` breaks the first rule, which is exactly what this skill exists to catch.

## Test Generation

```markdown
---
name: regression-test
description: Writes a regression test for a described orderdesk bug that fails on the current code and passes once the bug is fixed. Use when the user asks for a regression test or a test that reproduces a bug.
argument-hint: "[bug description]"
---

Write a regression test for: $ARGUMENTS

1. Choose the level: a unit test in the existing test class for pure logic (`PriceCalculatorTest`), a MockMvc test in `OrderControllerTest` for HTTP behaviour.
2. Name the test after the behaviour (`readsAnOrderWithoutDiscountCode`), add a one-line comment with the bug id if there is one, and assert the specified behaviour, not the current output.
3. Run only that test and confirm it fails for the expected reason. Show the failure message.
4. If the bug is already fixed on this branch, say so and show that the test passes.

Do not change production code in this skill.
```

The decisive instruction is **"assert the specified behaviour, not the current output"**. A generated test that records today's buggy result as "expected" passes forever and protects the bug. Step 3 makes the test prove itself: it must fail first, for the right reason. On the starter project, a test like `readsAnOrderWithoutDiscountCode` fails with a `ServletException` caused by the `NullPointerException` — that is the expected reason.

## Documentation Updates

```markdown
---
name: update-docs
description: Updates orderdesk's README endpoint list after an API change. Use when the user asks to update the documentation for a change.
disable-model-invocation: true
allowed-tools: Bash(git diff *)
---

## Changes to document

!`git diff HEAD --stat`

Update `README.md` so it matches the code:

1. Read the controllers changed above and list every endpoint: method, path, request fields and the main status codes.
2. Update only the "Run" section's endpoint list and any example that is now wrong. Keep the existing style and wording elsewhere.
3. Do not document behaviour you cannot see in the code; mark open questions as `TODO(docs):` in your reply, not in the file.
```

Documentation skills fail by **inventing** behaviour and by **rewriting** text nobody asked to change. Step 2 limits the edit; step 3 forbids documenting what isn't in the code. It is manual-only because it edits a shared file at a moment you choose.

## Pre-Release Checks

```markdown
---
name: pre-release-check
description: Runs orderdesk's pre-release checks and reports a go or no-go summary. Run it only when the developer types /pre-release-check.
disable-model-invocation: true
allowed-tools: Bash(./mvnw -B verify) Bash(git status *) Bash(git log *) Bash(git diff *)
---

## Repository state

!`git status --short`

!`git log --oneline -5`

## Checks

Report each check as PASS, FAIL or NOT CHECKED, with the evidence.

1. Run `./mvnw -B verify` and quote the final `Tests run:` summary line.
2. The working tree is clean (see the status above).
3. No existing migration changed since the last tag: run `git diff --stat <last-tag> -- src/main/resources/db/migration`. With no tag, report NOT CHECKED.
4. No `TODO` or `FIXME` added since the last tag.
5. `README.md` lists every endpoint the controllers expose.

Do not commit, tag, push or deploy. Finish with **GO** only if every check is PASS; otherwise **NO-GO** and the failing checks.
```

Three choices matter: **NOT CHECKED** is a legal answer, so missing evidence can't be reported as a pass; **GO requires every check to PASS**; and the skill **checks but never releases**. The person who types `/pre-release-check` decides what happens next.

## Syntax and Configuration

Patterns used across the six skills:

| Pattern | Example | Purpose |
|---------|---------|---------|
| Injected state | `` !`git diff HEAD` `` | Ground the work in the real repository |
| Evidence requirement | "cite `file:line`", "quote the `Tests run:` line" | Make claims checkable |
| Fixed report shape | Must fix / Should fix / Question; PASS / FAIL / NOT CHECKED | Easy to scan and compare |
| Explicit "do not" | "Do not edit files", "Do not commit, tag, push or deploy" | State the boundary |
| Stop condition | "If the cause is still unclear after step 4, stop" | Prevent guess-fixing |
| Narrow tools | `Bash(./mvnw -B verify)` | Pre-approve only what the steps run |

## Real-World Example

On the starter orderdesk project, the workflows chain naturally for BUG-101:

1. `/spring-bug-investigation docs/issues/BUG-101.md` — reproduces the `NullPointerException` at `PriceCalculator.java:14` with a failing test.
2. `/regression-test GET /api/orders/{id} returns 500 for an order without a discount code` — adds an HTTP-level test.
3. After the fix, "review my changes" loads `java-review` from its description.
4. `/update-docs` is not needed (no endpoint changed); `/pre-release-check` runs before tagging.

Each step's output is evidence the next step and the human reviewer can check.

## Step-by-Step Walkthrough

1. Pick a procedure the team repeats and argues about.
2. Write the steps a careful senior engineer follows, most important first.
3. Add the inputs (`$ARGUMENTS`, injected commands) and the narrowest tools.
4. Define the report: format, evidence required, what counts as "not checked".
5. Add the "do not" line and decide invocation (side effects → manual only).
6. Validate the frontmatter, then try it on a real task in a fresh session and compare with doing it without the skill.

## Common Mistakes

- Review skills that read the conversation instead of the diff.
- Test-generation skills that "make the tests pass" — the opposite of a regression test.
- Release skills that can tag, push or deploy.
- Reports without evidence ("all good") or without a "not checked" option.
- One mega-skill for every workflow — it triggers everywhere and its steps blur.

## Security Considerations

- A review skill is **not** a security gate. It reduces misses; it doesn't prove absence of defects. Keep human review and deterministic checks (tests, static analysis).
- Skills that read untrusted content (issues, pull request text) can be steered by instructions hidden in it. Keep their tools narrow and their actions read-only where possible.
- Never inject commands that print secrets, and never put credentials in a skill file.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Review mentions code that didn't change | Diff not injected, or stale context | Inject `git diff HEAD`; run in a fresh session |
| Generated test passes on buggy code | Test asserts current output | Require "fails first, for the expected reason" |
| Release check says PASS without running anything | No evidence requirement | Require quoting the result line; allow NOT CHECKED |
| SQL review never loads | `paths` don't match, or the work didn't touch matching files | Check globs; invoke `/sql-review` directly |

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| One skill per workflow | Precise triggers, clear reports | More skills to maintain and list |
| Strict report format | Comparable, scannable | Less flexibility for unusual changes |
| Read-only review skills | Safe to auto-load | A human or another step applies fixes |
| Manual-only release skills | Timing stays human | Someone has to remember to run them |

## Interview Takeaways

- Good workflow skills require **evidence** (`file:line`, test result lines) and allow "not checked".
- Separate *checking* from *acting*: review and release-check skills don't edit, commit or deploy.
- Regression tests must fail first and assert specified behaviour.

## Key Takeaways

- Turn repeated, argued-about procedures into skills with fixed steps and fixed reports.
- Ground every workflow in injected repository state.
- Say what the skill must not do, and make side-effect workflows manual-only.
- A skill improves consistency; tests, hooks and human review still carry the guarantees.
