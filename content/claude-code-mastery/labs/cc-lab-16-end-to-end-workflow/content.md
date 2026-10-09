# Lab 16: Build an End-to-End Engineering Workflow

**Lab:** 16 · **Module:** Advanced Context and Workflow Engineering · **Difficulty:** Advanced · **Verification:** Partially tested — every component was tested in its own lab (instructions, settings validation, hook scripts, skill and agent validation, workflow schema validation, the review script); running the whole workflow on a task needs your model session and was not run.

## Objective

Combine the pieces from Labs 04–14 into one workflow for orderdesk — instructions, permissions, hooks, a review skill, a reviewer subagent and CI — then **measure** it on a real task instead of assuming it helps.

## Prerequisites

- Labs 04, 08, 09, 11, 12 and 14 completed (their files are reused here).

## Scenario

SEC-3: the support search is injectable (`x' OR '1'='1` returns every order). You'll fix it with the full workflow and record what each layer contributed.

## Starting State

```bash
git switch main
git switch -c sec-3-parameterized-search
```

Assemble the layers on this branch (copy from your lab branches if needed):

```text
CLAUDE.md                          Lab 04  — facts, conventions, definition of done
.claude/settings.json              Lab 08  — allow / ask / deny rules
                                   Lab 09  — hooks registered in the same file
.claude/hooks/*.sh                 Lab 09  — session context, file guard, command guard, Java check
.claude/skills/java-review/        Lab 11  — the review checklist
.claude/agents/security-reviewer.md  Lab 12 — read-only security lens
.github/workflows/ci.yml           Lab 14  — the deterministic gate
scripts/ai-review.sh               Lab 14  — local advisory review
```

## Instructions

### Step 1: Check every layer loads

```bash
claude
```

```text
/memory
/permissions
/hooks
/skills
```

**Expected result:** CLAUDE.md listed; your rules attributed to project/local settings; four hooks under their events; `java-review` listed. The SessionStart reminder appears in the conversation. Ask "which subagents are available?" — `security-reviewer` should be named.

### Step 2: Run the task through the workflow

```text
SEC-3: GET /api/orders/search?email=x' OR '1'='1 returns every order. Plan first: reproduce with
a failing MockMvc test (it needs stored orders), then fix OrderSearchDao with a ? parameter.
Follow CLAUDE.md's definition of done.
```

Work through plan → failing test → fix → `./mvnw -B verify`. Then:

```text
/java-review security
```

```text
Use the security-reviewer subagent on OrderSearchDao.java and OrderController.java.
```

### Step 3: Record what each layer did

| Layer | Did it act? | Evidence |
|-------|-------------|----------|
| CLAUDE.md | e.g. Claude used `./mvnw -q test -Dtest=…` without asking | Transcript |
| Permissions | e.g. build ran without prompts; nothing else allowed silently | Transcript |
| Hooks | e.g. SessionStart reminder; any blocked edit | Transcript / hook messages |
| Skill | Review report format with `file:line` | Skill output |
| Subagent | Security findings, validated by you | Your validation notes |
| CI / script | Build result; advisory review | `./mvnw -B verify`; `scripts/ai-review.sh main` |

The regression test from *Diff Inspection, Security Review and Performance Investigation* failed on the unfixed DAO with `JSON path "$.length()" expected:<0> but was:<2>` — use that as your "red" evidence.

### Step 4: Measure

Compare with a baseline — the same kind of task without the setup (for example Lab 03's direct run, or a colleague's notes):

| Measure | Baseline | With workflow |
|---------|----------|---------------|
| Corrections you had to make | | |
| Unrequested changes in the diff | | |
| Tests added; tests weakened | | |
| Validated vs rejected review findings | | |
| Time to a green, reviewed change | | |
| Tokens/cost (`/usage`, `total_cost_usd`) | | |

### Step 5: Prune

For each layer, ask: did it change an outcome? Remove or simplify what didn't (a never-triggered skill, a hook that never fired and protects nothing important, instructions Claude already followed without being told). Keep guards whose value is the rare case they stop.

## Verification

- ☐ All layers load (Step 1 commands).
- ☐ SEC-3 fixed with a red → green regression test and a green build.
- ☐ The layer table and measurement table are filled with evidence.
- ☐ At least one layer simplified or removed based on the evidence — or a written reason to keep everything.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| A layer is missing in `/hooks` or `/skills` | File not on this branch, or new directory needs a restart | Copy it; restart Claude Code |
| Too many prompts | Allow rules don't match your exact commands | Align rules with the commands CLAUDE.md names |
| Layers contradict each other | CLAUDE.md says one thing, a skill another | Keep each fact in one place |

## Security Notes

- More automation means more configuration to review: hooks and skills in a repository run with your permissions once you trust it.
- The deny rules, hook guards and CI gate are layers; none is a complete boundary. Branch protection and human review stay.

## Cleanup

Commit the workflow files you decided to keep on `main` of your practice repository. Delete experiment branches.

## Completion Checklist

- ☐ Integrated workflow running.
- ☐ Real task completed through it.
- ☐ Effect measured; configuration pruned.

## Follow-up Challenges

- Turn the measurement into a short team proposal: which layers to adopt first, with your evidence.
- Add the Stop hook from *Test-Driven Bug Fixes* and measure whether "finished with red tests" ever happens again.
