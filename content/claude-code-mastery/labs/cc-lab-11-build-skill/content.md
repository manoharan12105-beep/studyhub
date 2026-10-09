# Lab 11: Build a Reusable Skill

**Lab:** 11 · **Module:** Skills, Slash Commands and Reusable Workflows · **Difficulty:** Intermediate · **Verification:** Partially tested — the skill file and a deliberately broken one were checked with `claude plugin validate .claude/skills` (v2.1.289); invoking the skill and testing its triggering need your model session and were not run.

## Objective

Write a `java-review` skill with a precise description, an optional argument and injected repository context; validate it; and test **when it triggers and when it shouldn't**.

## Prerequisites

- Labs 04 and 05 (a change to review is useful).
- The lessons *What Are Skills?* and *Writing a Good Skill*.

## Scenario

Every reviewer on the team asks for reviews differently, and results vary. A shared skill makes the checklist, the evidence and the report format the same every time.

## Starting State

A branch with an uncommitted change to review — for example the BUG-101 fix from Lab 05 before committing it:

```bash
git status --short     # at least one modified .java file
mkdir -p .claude/skills/java-review
```

## Instructions

### Step 1: Write the skill

`.claude/skills/java-review/SKILL.md`:

```markdown
---
name: java-review
description: Reviews the uncommitted Java changes in orderdesk for correctness, tests, security and scope. Use when the user asks to review changes, a diff or work before committing.
argument-hint: "[optional focus, e.g. transactions]"
allowed-tools: Bash(git status *) Bash(git diff *)
---

## Current changes

!`git status --short`

!`git diff HEAD`

## Review the changes above

Extra focus requested by the developer (may be empty): $ARGUMENTS

Check in this order and cite `file:line` for every finding:

1. Correctness: does the change do what the task asked, including null, blank and boundary inputs?
2. Tests: is new behaviour tested? Was any existing assertion changed, skipped or deleted? Flag every change under `src/test`.
3. Security: SQL built by string concatenation, user input or personal data in logs, disabled validation, secrets in code.
4. Project rules from CLAUDE.md: money as `long` cents, constructor injection, `ResponseStatusException` status codes, migrations never edited.
5. Scope: files or lines the task did not need.

Report findings grouped as **Must fix**, **Should fix** and **Question**; write "none" for an empty group. Do not edit files: this skill only reviews.
```

| Part | Purpose |
|------|---------|
| `description` | What Claude matches requests against — key use case first |
| `argument-hint` + `$ARGUMENTS` | Optional focus: `/java-review transactions` |
| `` !`git diff HEAD` `` | The real diff is injected before Claude reads the skill |
| `allowed-tools` | Pre-approves exactly the two injected Git commands for that turn |
| Last line | Review only; no edits |

### Step 2: Validate

```bash
claude plugin validate .claude/skills
```

**Output** (path shortened):

```text
Validating components in: …\.claude\skills

✔ Validation passed
```

See what a broken file looks like — a skill whose frontmatter contains `description: [unclosed` reported:

**Output** (paths shortened):

```text
Validating skill: …\.claude\skills\broken\SKILL.md

✘ Found 1 error:

  ❯ frontmatter: YAML frontmatter failed to parse: YAML Parse error: Unexpected token. At runtime this skill loads with empty metadata (all frontmatter fields silently dropped).

✘ Validation failed
```

A skill with unparseable frontmatter still works as `/name`, but Claude can't match its description — a silent failure that validation catches.

### Step 3: Invoke it directly

```bash
claude
```

```text
/java-review
```

**Expected result:** the review cites `file:line`, lists Must fix / Should fix / Question (with "none" where empty), and doesn't edit files. With the BUG-101 fix, a good review notes the missing `@Transactional` on `create()` as a question or should-fix.

Then with a focus:

```text
/java-review transactions
```

### Step 4: Test triggering

In **fresh sessions** (`/clear` between them), try three prompts that should load the skill and three that shouldn't:

| Prompt | Should trigger? |
|--------|-----------------|
| "Review my changes before I commit" | Yes |
| "Can you check this diff for problems?" | Yes |
| "Look over what I changed in PriceCalculator" | Yes |
| "Explain how PriceCalculator works" | No |
| "Write a test for the pay endpoint" | No |
| "What does git diff HEAD do?" | No |

**Expected result:** the skill loads for the first three (the transcript shows it being used) and not for the others. Record your results; if it misfires, change **only the description**, start a fresh session, and retest.

### Step 5: Check its cost

```text
/context
/skills
```

**Expected result:** the skill's listing entry (name + description) appears in every session; its body loads only when used. In `/skills`, press `t` to sort by token count.

## Verification

- ☐ `claude plugin validate .claude/skills` passes.
- ☐ `/java-review` produces the fixed report format with `file:line` citations and no edits.
- ☐ Your trigger table has six results; misfires were fixed through the description.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Shell command failed for pattern …` | An injected command exited non-zero (no commits yet?) | Commit once first, or make the command tolerant |
| `Shell command permission check failed` | Injected command not allowed outside auto mode | Keep `allowed-tools` matching the injected commands |
| Never triggers | Description lacks the words users say, or YAML broken | Rewrite; validate |
| Review mentions code that didn't change | Diff not injected | Check the `!` lines start a line |

## Security Notes

- `allowed-tools` in a project skill isn't gated by workspace trust — review it in skills from repositories you didn't write. Keep it as narrow as here.
- Injected commands run before Claude sees the skill; never inject commands that print secrets.

## Cleanup

Keep the skill for Lab 16, or delete `.claude/skills/java-review/`.

## Completion Checklist

- ☐ Skill written with description, argument, injected context and narrow tools.
- ☐ Validated, invoked, trigger-tested.
- ☐ You know its context cost.

## Follow-up Challenges

- Write `sql-review` with `paths: "src/main/resources/db/migration/**, src/main/java/**/*Dao.java"` and check that it loads automatically when Claude works on `OrderSearchDao`.
- Make a `pre-release-check` skill manual-only with `disable-model-invocation: true` and confirm Claude can't start it on its own.
