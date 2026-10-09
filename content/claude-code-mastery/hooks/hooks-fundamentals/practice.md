# What Are Hooks? Lifecycle and Events — Practice

### P1. Pick the event

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** hook events

You want to stop Claude from editing an applied migration **before** the edit happens. Which event?

- A) `PostToolUse`
- B) `PreToolUse`
- C) `Stop`
- D) `SessionEnd`

<details>
<summary>Answer</summary>

**Answer:** B) `PreToolUse`

It fires before a tool call and can block it. `PostToolUse` runs after the edit already happened.

</details>

### P2. Exit codes

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** exit codes

A `PreToolUse` script detects a forbidden command, prints a reason to stderr and runs `exit 1`. What happens?

- A) The tool call is blocked
- B) The tool call proceeds; the hook is reported as a non-blocking error
- C) Claude Code stops the session
- D) The user is asked

<details>
<summary>Answer</summary>

**Answer:** B) The tool call proceeds; the hook is reported as a non-blocking error

Only exit code 2 blocks (or a JSON decision). Exit 1 is treated as a non-blocking error for most events.

</details>

### P3. Hook or CLAUDE.md?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** determinism

Classify each as a hook or a CLAUDE.md instruction: (a) prefer records for DTOs; (b) run the formatter on every edited Java file; (c) notify me when Claude needs approval; (d) explain trade-offs before large refactors.

<details>
<summary>Answer</summary>

(a) CLAUDE.md — a convention requiring judgement.
(b) Hook (`PostToolUse` on `Edit|Write`) — must happen every time.
(c) Hook (`Notification` with `permission_prompt`) — event-driven side effect.
(d) CLAUDE.md — behavioural guidance.

</details>

### P4. Hooks vs GitHub Actions

**Difficulty:** Medium · **Type:** Misconception · **Concepts:** local vs server

"We have a PreToolUse hook that blocks pushes to main, so we don't need branch protection." What's wrong?

<details>
<summary>Answer</summary>

The hook runs only inside Claude Code sessions on machines where the settings are present and trusted. Anyone pushing from a terminal, an IDE or another tool bypasses it, and the hook matches command text that can be spelled differently. Branch protection is enforced by GitHub for every push.

</details>

### P5. Which hook type?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** hook types

Match each need to a hook type: (1) log every Bash command to a file; (2) send all tool events to the security team's audit service; (3) decide at the end of a turn whether all requested tasks are complete.

<details>
<summary>Answer</summary>

(1) `command` on `PostToolUse` with matcher `Bash`.
(2) `http` posting the event JSON to the audit endpoint.
(3) `prompt` on `Stop` — a model judges completion; `ok: false` keeps Claude working (an `agent` hook could also inspect files, but it is experimental).

</details>

### P6. Informational event

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** PostToolUse

A `PostToolUse` hook on `Edit|Write` finds tabs in an edited Java file and exits 2 with a message on stderr. What happens to the edit and to Claude?

<details>
<summary>Answer</summary>

The edit stays — `PostToolUse` cannot undo it. Exit 2 shows the stderr message to Claude, which can fix the file in its next step. That is the right use: feedback after the fact.

</details>

### P7. Trust and hooks

**Difficulty:** Hard · **Type:** Security · **Concepts:** workspace trust

Your CI job runs `claude -p "update the changelog"` on pull requests from external contributors, in a checkout of their branch. Why is this dangerous with respect to hooks, and what would you change?

<details>
<summary>Answer</summary>

`-p` sessions treat the folder as trusted, so hooks in the contributor's `.claude/settings.json` run with the CI job's permissions and secrets — arbitrary code execution. Use `--bare` or `--settings '{"disableAllHooks": true}'` (plus `--setting-sources user`), run without secrets on untrusted PRs, and treat PR content as untrusted input (Module 10).

</details>
