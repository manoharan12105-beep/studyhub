# Guardrail, Automation and Session Hooks — Interview Questions

## Beginner

### Q1. Give an example of a useful PreToolUse hook in a Java project.

**Style:** Scenario

<details>
<summary>Answer</summary>

A guard on `Edit|Write` that blocks edits to existing Flyway migrations (exit 2 with "add a new V<n>__ file instead"), blocks `.env` edits, and returns a JSON `ask` for `pom.xml` changes so a human reviews every dependency change. Claude reads the reason and adapts — for example by creating a new migration.

</details>

### Q2. What is a SessionStart hook useful for?

**Style:** What

<details>
<summary>Answer</summary>

Injecting fresh context at the start of a session — and after `/compact` or resume when matched — such as the current branch, number of uncommitted files and a couple of critical reminders. Plain stdout becomes context. It's for dynamic facts; static instructions belong in CLAUDE.md.

</details>

## Intermediate

### Q3. Why should a guard hook fail closed?

**Style:** Why

<details>
<summary>Answer</summary>

If its dependency (like `jq`) is missing or it crashes, a fail-open guard exits 0 or 1 and the action proceeds — the protection disappears silently. Checking prerequisites and exiting 2 makes the failure visible and safe; you fix the environment instead of discovering later that nothing was protected.

</details>

### Q4. How do you keep PostToolUse automation from slowing sessions down?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Scope it to the changed file (from `tool_input.file_path`), keep it to fast checks (format, lint one file, size limits), avoid running full test suites per edit (use a Stop hook or the definition of done instead), and consider `async` for slow non-blocking work.

</details>

## Advanced

### Q5. Your team's guard hook blocks `git push --force`. Is that enough to protect main?

**Style:** Security

<details>
<summary>Answer</summary>

No. It matches text — `git -C . push --force`, `git push origin +main` or a script slip past — and it only runs in Claude Code sessions with the project settings trusted. Main is protected by server-side branch protection that rejects force pushes and requires reviewed PRs; the hook is an early, friendly guardrail with a helpful message.

</details>

### Q6. Design hooks for a team where Claude often forgets to run tests before finishing.

**Style:** Workflow design

<details>
<summary>Answer</summary>

Keep the definition of done in CLAUDE.md, and add a Stop hook that runs the fast test command when source files changed (check `git status --porcelain`), exits 2 with the failures on stderr so Claude keeps working, and respects `stop_hook_active` to avoid endless loops. Optionally a prompt or agent hook to judge completion, and CI as the final gate. Measure whether it reduces escaped failures before making it mandatory.

</details>
