# Lab 12: Delegate Code Review to Specialized Subagents

**Lab:** 12 · **Module:** Subagents and Agent Teams · **Difficulty:** Advanced · **Verification:** Partially tested — the three agent files pass `claude plugin validate .claude/agents` (v2.1.289), and the SQL injection finding they should report was reproduced with a real test run; running the reviewers needs your model session and was not run.

## Objective

Create three **read-only** reviewer subagents — correctness, security, test coverage — run them in parallel on a change, then **validate every finding** before anything is fixed.

## Prerequisites

- Lab 06 (the FEAT-7 branch) — or any branch with a real change.
- The lessons *Subagent Configuration* and *Parallel Code Review and Coordinating Results*.

## Scenario

The FEAT-7 change is ready for review. You want three focused opinions quickly, without giving any reviewer the ability to change code — and you want to know which of their findings are real.

## Starting State

```bash
git switch feat/7-mark-order-paid
git diff main --stat          # the change under review
mkdir -p .claude/agents
```

## Instructions

### Step 1: Create the reviewers

Create the three files from *Parallel Code Review and Coordinating Results* (security and test coverage) and *Subagent Configuration* (correctness). Each starts like this — note the tool list:

```markdown
---
name: correctness-reviewer
description: Read-only reviewer that checks an orderdesk change for logic errors, missed edge cases and broken contracts. Use when asked to review a change for correctness.
tools: Read, Grep, Glob
---
```

| Agent | Lens | Tools |
|-------|------|-------|
| `correctness-reviewer` | Logic, edge cases, HTTP behaviour, state transitions | Read, Grep, Glob |
| `security-reviewer` | Injection, validation, data exposure, secrets | Read, Grep, Glob |
| `test-coverage-reviewer` | Missing or weakened tests | Read, Grep, Glob |

No Edit, Write or Bash: they **can't** change anything, whatever the session's permission mode.

### Step 2: Validate

```bash
claude plugin validate .claude/agents
```

**Output** (path shortened):

```text
Validating components in: …\.claude\agents

✔ Validation passed
```

Restart Claude Code if `.claude/agents/` didn't exist when the session started.

### Step 3: Run them in parallel

```bash
claude
```

```text
Review the FEAT-7 change. Changed files: src/main/java/com/example/orderdesk/order/Order.java,
src/main/java/com/example/orderdesk/order/OrderController.java,
src/test/java/com/example/orderdesk/order/OrderControllerTest.java. Requirements:
docs/issues/FEAT-7.md. Run correctness-reviewer, security-reviewer and test-coverage-reviewer in
parallel with that file list. When all three return, merge their findings, remove duplicates,
open every cited file:line yourself and mark each finding Validated, Rejected (with reason) or
Needs a human. Don't edit any file.
```

**Expected result:** three subagents run (visible in the panel or `/tasks`); a merged list follows. Typical real findings on the reference solution: the **missing 409 test** (test coverage) and the **SQL injection in `OrderSearchDao`** if the security reviewer looks beyond the diff (it's in code the same controller calls).

### Step 4: Validate the findings yourself

For each **Validated** finding, check it independently:

| Finding | Your check |
|---------|-----------|
| "No test for 409" | Search `OrderControllerTest` for `isConflict` |
| "Search is injectable" | Run the regression test below on the starter DAO |
| Anything citing a line | Open the line; does the code say what the finding claims? |

The injection check — `searchTreatsInputAsAValueNotAsSql` (from *Diff Inspection, Security Review and Performance Investigation*) — on the unfixed DAO:

**Output:**

```text
JSON path "$.length()" expected:<0> but was:<2>
```

That failure confirms the security finding; the reviewer's sentence alone doesn't.

### Step 5: Decide, then fix separately

Write the decision list: fix, reject, or ask. Then, in a **new** step (main conversation, Manual mode), fix only the validated items — for example add `payingACancelledOrderIs409` and parameterize the DAO query — and run `./mvnw -B verify`.

## Verification

- ☐ Three agent files, `tools: Read, Grep, Glob`, validated.
- ☐ All three ran on the same file list.
- ☐ Every finding labelled Validated / Rejected / Needs a human, with your own check for each validated one.
- ☐ Fixes happened in a separate step, with a green build.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Agents not offered | New `agents` directory, YAML error, missing `description` | Restart; validate; `claude --debug` |
| A reviewer edited a file | It had Edit/Write/Bash (no `tools` field) | Add `tools: Read, Grep, Glob` |
| Findings about unrelated files | No file list given | Pass the changed files explicitly |
| Test reviewer says "tests pass" | It can't run commands | Reject; run the build yourself |

## Security Notes

- Read-only reviewers are safe to run on untrusted changes; they still read text that may contain instructions — the security reviewer's prompt tells it to treat file text as data.
- `permissionMode: plan` wouldn't make them read-only under a permissive parent mode; the tool list does.

## Cleanup

Keep the agents for Lab 16. Revert any experimental edits with `git restore`.

## Completion Checklist

- ☐ Read-only reviewers created and validated.
- ☐ Parallel review run and consolidated.
- ☐ Findings validated with evidence before fixing.

## Follow-up Challenges

- Re-run only `security-reviewer` after fixing the DAO and confirm the finding disappears.
- Compare with the bundled `/code-review` on the same branch: which findings overlap, which differ?
