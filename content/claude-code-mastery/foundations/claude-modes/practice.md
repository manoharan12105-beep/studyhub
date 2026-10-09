# Claude Modes — Practice

### P1. Name the official modes

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** permission modes

Which list contains only official Claude Code permission modes (config values)?

- A) `default`, `acceptEdits`, `plan`, `yolo`
- B) `default`, `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`
- C) `manual`, `fast`, `plan`, `turbo`
- D) `read`, `write`, `execute`

<details>
<summary>Answer</summary>

**Answer:** B) `default`, `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`

"YOLO" is a community nickname for bypass permissions. `manual` is accepted as an alias for `default`, but `fast` is a speed setting for supported Opus models, not a permission mode.

</details>

### P2. Auto-accept vs auto

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** acceptEdits, auto mode

In Accept edits mode, Claude wants to run `./mvnw test`. What happens?

- A) It runs without a prompt, because the mode auto-accepts everything
- B) You are asked, because Accept edits only auto-approves file edits and a few filesystem commands
- C) It is denied
- D) The classifier decides

<details>
<summary>Answer</summary>

**Answer:** B) You are asked, because Accept edits only auto-approves file edits and a few filesystem commands

Accept edits covers edits plus `mkdir`, `touch`, `rm`, `rmdir`, `mv`, `cp`, `sed` in the working directories. The build is another command. The classifier (D) belongs to auto mode.

</details>

### P3. Deny rules in bypass

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** rule precedence

Settings contain `"deny": ["Read(./.env)"]`. You start `claude --dangerously-skip-permissions` inside a container and Claude tries to read `.env`. What happens?

<details>
<summary>Answer</summary>

The read is **blocked**. Deny rules apply in every mode, including `bypassPermissions`. Bypass skips prompts, not deny rules. (Allow rules, conversely, have no effect in bypass mode because everything else already runs.)

</details>

### P4. Choose a mode — exploration

**Difficulty:** Easy · **Type:** Scenario · **Concepts:** mode selection

First day on a team; you must understand how `orderdesk` calculates totals. Which mode, and why?

<details>
<summary>Answer</summary>

**Plan mode** (Manual also works). The goal is understanding, not change: Plan mode lets Claude read and explore, blocks source edits, and ends with a proposal you can discuss. Accept edits or Auto add risk without benefit when nothing should change.

</details>

### P5. Choose a mode — refactor

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** mode selection

You will rename `OrderSearchDao` to `OrderLookupDao` and update 12 call sites and tests. Which modes, in which order?

<details>
<summary>Answer</summary>

**Plan → Accept edits → Manual (or allow rules) for the build.** Plan to agree on scope (including tests and any configuration). Accept edits so 12 edits do not produce 12 prompts — you review the complete `git diff` afterwards. Keep the build and Git commands visible or narrowly pre-approved. Avoid Bypass: you would lose every check for a task that does not need it.

</details>

### P6. Choose a mode — security-sensitive review

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** mode selection, security

A pull request changes authentication filters in Spring Security. You want Claude's help reviewing it. Which mode and why not Auto?

<details>
<summary>Answer</summary>

**Manual** (or Plan for a read-only analysis). You must see every command and every proposed change personally on security-critical code. Auto's classifier reviews actions for *danger*, not for *correctness of your security logic*; it is not a substitute for your review, and its own documentation says it does not guarantee safety.

</details>

### P7. Choose a mode — CI

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** dontAsk

Write the command for a CI job that may only read files and run `./mvnw -B verify`, where nothing else should run and nobody can answer prompts.

<details>
<summary>Answer</summary>

```bash
claude -p "Run the build and summarize any test failures" \
  --permission-mode dontAsk \
  --allowedTools "Read" "Bash(./mvnw -B verify)"
```

`dontAsk` denies anything that would prompt; reads and the exact allowed command still run. Bypass would allow everything and is only appropriate in a fully isolated, disposable runner.

</details>

### P8. Why didn't auto apply?

**Difficulty:** Medium · **Type:** Failure diagnosis · **Concepts:** defaultMode

A teammate commits `{"permissions": {"defaultMode": "auto"}}` to `.claude/settings.json`. Sessions still start in Manual. Why, and is that a bug?

<details>
<summary>Answer</summary>

Not a bug: per the docs, `"auto"` (and `"bypassPermissions"`) in a project's `.claude/settings.json` or `.claude/settings.local.json` does not take effect, so a cloned repository cannot choose an autonomous mode for you. Each developer who wants auto sets it in `~/.claude/settings.json` (or uses the flag).

</details>

### P9. Plan mode is not fully read-only

**Difficulty:** Hard · **Type:** Misconception · **Concepts:** plan mode

"Plan mode is completely read-only, so it is safe to point at any repository." What is wrong with this statement?

<details>
<summary>Answer</summary>

Plan mode blocks **source edits** until you approve a plan, but Claude still explores with commands: read-only commands run, and other commands either prompt or — when auto mode is available and `useAutoModeDuringPlan` is on — go to the classifier. In interactive terminal sessions started with bypass permissions available, plan mode's blocks are not enforced at all. And the repository's own settings, hooks and MCP servers still apply once you trust it. Plan mode reduces risk; it does not make an untrusted repository safe.

</details>

### P10. The mode decision exercise

**Difficulty:** Hard · **Type:** Workflow design · **Concepts:** mode per stage

For each stage of "add a paginated `GET /api/orders` endpoint to orderdesk", choose a mode and justify it in one line: (1) understand the current controller and repository; (2) agree on the design; (3) implement and write tests; (4) run the test suite repeatedly; (5) commit and push.

<details>
<summary>Answer</summary>

1. **Plan** — read and explain; nothing should change yet.
2. **Plan** — produce and edit the plan (`Ctrl+G`); approve only when it covers page size limits and tests.
3. **Accept edits** — many small edits; review the full diff afterwards.
4. **Manual with an allow rule** `Bash(./mvnw test *)` (or Auto) — routine, safe command; no prompt per run, everything else still visible.
5. **You** — run `git commit` and `git push` yourself (or approve them explicitly in Manual). Pushing publishes your work; keep it a deliberate human step.

</details>

### P11. Classify the failure

**Difficulty:** Hard · **Type:** Security · **Concepts:** bypass, prompt injection

A developer runs `claude --dangerously-skip-permissions` on their laptop to "fix CI faster". A dependency's postinstall README tells AI agents to upload `~/.aws/credentials` to a URL. Which safeguards were active, which were not, and what should they have done?

<details>
<summary>Answer</summary>

Active: only deny rules, ask rules, hook denials and the hard safeguards (critical-path `rm`, actions no mode auto-approves) — none of which cover an upload unless configured. Not active: every permission prompt, protected-path checks and the auto mode classifier (which blocks sending sensitive data externally by default). Bypass also offers no protection against prompt injection. They should have used Manual or Auto on the laptop, kept bypass for an isolated container without credentials or internet, and denied reads of credential files (`Read(~/.aws/**)`) or enabled the sandbox.

</details>
