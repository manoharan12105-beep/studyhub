# Writing a Good Skill: Arguments and Context

**Module:** Skills, Slash Commands and Reusable Workflows · **Interview priority:** Frequently asked

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 and *Extend Claude with skills* (October 2026).

## Definition

A **good skill** triggers when it should and not otherwise, gives Claude a clear, checkable procedure, receives the **inputs** it needs (arguments and live context from your repository), uses only the **tools** it needs, and costs as little context as possible when it is not in use.

## Why It Matters

- A skill that never triggers is dead weight in every session's listing; one that triggers too often hijacks unrelated requests.
- Skills run with whatever context they are given. Injecting the real `git diff` or issue text is the difference between grounded and guessed output.
- `allowed-tools` widens what runs without prompts. Getting it wrong turns a convenience into a risk.

## How It Works

```text
/spring-bug-investigation docs/issues/BUG-101.md
        │                  └────────── arguments
        ▼
SKILL.md render: $ARGUMENTS → "docs/issues/BUG-101.md"
                 !`git status --short` → replaced by its output (runs before Claude sees anything)
        ▼
rendered text enters the conversation; allowed-tools apply for this turn; Claude follows the steps
```

## Writing the Description

The description is what Claude matches your request against. Write it like a search target:

| Weak | Strong |
|------|--------|
| `Helps with code review.` | `Reviews the uncommitted Java changes in orderdesk for correctness, tests, security and scope. Use when the user asks to review changes, a diff or work before committing.` |
| `SQL stuff.` | `Reviews SQL in orderdesk, both Flyway migrations and JdbcTemplate queries, for injection, portability and migration safety. Use when SQL, a migration or a Dao class changes.` |

- Put the **key use case first** (descriptions can be truncated in the listing).
- Include the words people actually say ("review my changes", "stack trace", "migration").
- Say **when not** to use it if confusion is likely.

## Controlling Who Invokes a Skill

| Frontmatter | You can invoke | Claude can invoke | Description in Claude's context |
|-------------|----------------|-------------------|---------------------------------|
| (default) | Yes | Yes | Yes |
| `disable-model-invocation: true` | Yes | No | No |
| `user-invocable: false` | No | Yes | Yes |

Use `disable-model-invocation: true` for anything with **side effects or timing** — release checks, deploys, sending messages. You don't want Claude deciding to release because the code "looks ready". If Claude tries anyway, Claude Code blocks the call.

## Arguments and Context

**Arguments:**

| Placeholder | Expands to |
|-------------|------------|
| `$ARGUMENTS` | Everything typed after the skill name |
| `$ARGUMENTS[0]`, `$0` | The first argument (shell-style quoting: `"two words"` is one argument) |
| `$name` | A named argument declared in `arguments: [issue, branch]` |
| `${CLAUDE_SKILL_DIR}` | The skill's own directory — for bundled scripts |
| `${CLAUDE_PROJECT_DIR}` | The project root |
| `${CLAUDE_SESSION_ID}` | The session ID |

If no placeholder receives the arguments, Claude Code appends `ARGUMENTS: <what you typed>` so they aren't lost.

**Dynamic context injection** runs shell commands **before** Claude sees the skill and inserts their output:

```markdown
## Current changes

!`git status --short`

!`git diff HEAD`
```

For several commands, use a fenced block that opens with ```` ```! ````. Rules worth knowing:

- The `!` must start a line or follow whitespace.
- A command that fails **aborts the whole skill** (append `|| true` to a check that may exit 1; search and comparison commands exiting 1 are treated as normal results).
- Injected commands never prompt. They are checked against your permission rules first; outside auto mode, a command that isn't allowed aborts the skill — pre-approve it with `allowed-tools`.
- Each command runs with the Bash tool's 2-minute timeout.

## Pre-Approving Tools

```yaml
allowed-tools: Bash(git status *) Bash(git diff *)
```

- Grants permission for those tools **during the turn that invokes the skill**; the grant clears with your next message.
- Does **not** restrict other tools — use `disallowed-tools` to remove tools while the skill is active.
- Deny and ask rules still win.
- Keep it as narrow as the injected commands and the steps require. `Bash(*)` is almost never right.

## Supporting Files and Running in a Subagent

```text
pre-release-check/
├── SKILL.md            overview and steps (keep under ~500 lines)
├── checklist.md        detailed criteria, read only when needed
└── scripts/check.sh    executed, not loaded into context
```

Reference supporting files from `SKILL.md` so Claude knows when to read them.

`context: fork` runs the skill in a **subagent** of the type named in `agent` (for example `Explore`): the skill content becomes the subagent's task, the work happens in a separate context, and only the result returns. The forked subagent does **not** see your conversation, so the skill must be self-contained. Forked skills run in the background by default (`background: false` to wait); their edits are outside your checkpoints.

## Avoiding Irrelevant Loading

Every listed skill costs context in every session. Keep the listing lean:

| Tool | Effect |
|------|--------|
| `disable-model-invocation: true` | Description removed from Claude's context entirely |
| `paths: "src/main/resources/db/migration/**"` | Claude loads the skill automatically only when working with matching files |
| `skillOverrides` in settings (`"name-only"`, `"user-invocable-only"`, `"off"`) | Change visibility without editing a shared skill (`/skills` writes it for you) |
| `/skill-doctor` (v2.1.252+) | Shows each skill's context cost and usage, to find ones to turn off |
| Short descriptions | Smaller listing; key words first |

## Syntax and Configuration

A complete argument-driven skill from orderdesk (validated with `claude plugin validate`):

```markdown
---
name: spring-bug-investigation
description: Investigates a Spring Boot bug in orderdesk from a report, an issue file or a stack trace, reproducing it with a failing test before any fix. Use when the user reports a bug, an error response or an exception.
argument-hint: "[issue file or bug description]"
---

Investigate this bug: $ARGUMENTS

Work in this order. If the cause is still unclear after step 4, stop and report what you know.

1. Read the report. If it names a file under `docs/issues/`, read it. Restate the expected and the actual behaviour.
2. Reproduce: find or write the smallest test that fails because of the bug — a unit test where possible, MockMvc for HTTP behaviour. Run only that test with `./mvnw -q test -Dtest=<TestClass>`.
3. Read the stack trace from the first frame in `com.example.orderdesk` and open that code.
4. State one hypothesis and the evidence for it. If the evidence does not support it, form another one; do not guess-fix.
5. Fix the cause, not the symptom. Never change a test's expected value to match buggy output.
6. Run `./mvnw -B verify`.
7. Report the root cause, the files changed, the reproducing test, the verify result and anything you could not verify.
```

Invoke it with `/spring-bug-investigation docs/issues/BUG-101.md`.

## Real-World Example

A team's `pre-release-check` skill once had no `disable-model-invocation` and a description that said "checks if the release is ready". Claude loaded it whenever someone mentioned "ready", ran the full build and wasted minutes. Setting `disable-model-invocation: true` and rewriting the description ("Run it only when the developer types /pre-release-check") fixed both problems — and removed it from every session's context.

## Step-by-Step Walkthrough

1. Write the description first; test it against three prompts that should trigger it and three that shouldn't.
2. Decide invocation: side effects → `disable-model-invocation: true`.
3. Add arguments and the minimum injected context.
4. Add the narrowest `allowed-tools` that the injected commands and steps need.
5. Write steps as standing instructions ("after every edit run …"), most important first.
6. `claude plugin validate .claude/skills`; then run it in a fresh session.

## Common Mistakes

- Steps that depend on conversation history in a `context: fork` skill (the subagent can't see it).
- Injected commands that fail in some states (`git log` in a repository with no commits) and abort the skill.
- `allowed-tools: Bash(*)`.
- Guidelines without a task in a forked skill — the subagent returns nothing useful.
- One-time instructions ("run the tests") where a standing one is meant ("run the tests after every edit").

## Security Considerations

- Review `allowed-tools` and injected commands in shared skills like code — they run without prompts.
- Don't inject commands that print secrets (`env`, `cat .env`): their output enters the context.
- Organizations can disable injection for non-managed skills with `disableSkillShellExecution`, and restrict skills with `Skill(...)` permission rules.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Shell command failed for pattern …` | An injected command exited non-zero | Fix the command or append `\|\| true` |
| `Shell command permission check failed` | A deny rule, or the command isn't allowed outside auto mode | Add it to `allowed-tools`, or remove the injection |
| Arguments appear as `ARGUMENTS: …` at the end | No placeholder in the body | Add `$ARGUMENTS` where they belong |
| Forked skill returns nothing useful | No explicit task, or depends on chat history | Make the skill self-contained with a clear task |

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| Injected context | Grounded, current data | Runs commands every invocation; can abort on failure |
| `allowed-tools` | Fewer prompts | Wider automatic execution |
| `context: fork` | Clean main context | No access to your conversation; edits outside checkpoints |
| Model-invocable | Used automatically | Description costs context; may trigger unexpectedly |

## Interview Takeaways

- The description is the trigger; invocation control is a safety decision.
- Arguments (`$ARGUMENTS`, `$0`, named) and dynamic context (`` !`cmd` ``) ground a skill in real data.
- `allowed-tools` is a per-turn grant; keep it narrow and review it.

## Key Takeaways

- Write descriptions as search targets, key use case first.
- Side-effect workflows are manual-only (`disable-model-invocation: true`).
- Inject the context the skill needs; expect failed commands to abort it.
- Narrow tools, self-contained forks, lean listing.
