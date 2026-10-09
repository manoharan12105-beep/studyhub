# Local vs CI Automation and Non-Interactive Usage — Practice

### P1. Trust dialog

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** -p and trust

What happens with the workspace trust dialog when you run `claude -p` in a folder you've never opened?

- A) It is shown and the run waits
- B) It is skipped; the project's hooks and `.mcp.json` servers still load unless you use `--bare`
- C) The run refuses to start
- D) Only CLAUDE.md is loaded

<details>
<summary>Answer</summary>

**Answer:** B) It is skipped; the project's hooks and `.mcp.json` servers still load unless you use `--bare`

Only run `-p` in directories you trust.

</details>

### P2. YOLO

**Difficulty:** Easy · **Type:** Misconception · **Concepts:** permission modes

A blog post says "run `claude -p --permission-mode yolo` in CI". What happens, and what is "YOLO mode"?

<details>
<summary>Answer</summary>

The CLI rejects it: `argument 'yolo' is invalid. Allowed choices are acceptEdits, auto, bypassPermissions, manual, dontAsk, plan.` "YOLO" is community slang for skipping permission checks (`bypassPermissions` / `--dangerously-skip-permissions`), which belongs only in disposable, isolated environments.

</details>

### P3. Read the result

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** JSON output

A JSON result has `"subtype": "success"`, `"is_error": true`, `"result": "Not logged in · Please run /login"` and the process exited 1. Did the review succeed? What should a script check?

<details>
<summary>Answer</summary>

No. The run failed before any review. Check the exit code and `is_error`; don't rely on `subtype` or on stdout having text.

</details>

### P4. Lock it down

**Difficulty:** Medium · **Type:** Command · **Concepts:** dontAsk, stdin

Write a command that summarizes `build.log` with no tool access needed, denies anything that would prompt, limits turns to 2, and returns JSON.

<details>
<summary>Answer</summary>

```bash
claude -p "Explain the root cause of this build failure in five lines or fewer." \
  --output-format json --permission-mode dontAsk --max-turns 2 < build.log
```

Piping the log means Claude doesn't need Read or Bash.

</details>

### P5. Why bare in CI?

**Difficulty:** Medium · **Type:** Trade-off · **Concepts:** --bare

Give two benefits and one cost of `--bare` for CI runs.

<details>
<summary>Answer</summary>

Benefits: the same behaviour on every machine (no local hooks, skills, plugins, MCP servers, auto memory or CLAUDE.md are discovered), and faster startup. Cost: you must pass what you need explicitly (`--settings`, `--mcp-config`, `--append-system-prompt`), and authentication must be `ANTHROPIC_API_KEY` or an `apiKeyHelper` — OAuth and the keychain aren't read.

</details>

### P6. Silent settings

**Difficulty:** Hard · **Type:** Failure diagnosis · **Concepts:** settings validation

Your CI run ignores the `deny` rules in `.claude/settings.json`, though they work interactively on your machine where you edited the file yesterday. You find a trailing comma in the JSON. Explain.

<details>
<summary>Answer</summary>

In `-p` mode, settings files that fail validation are silently ignored — no error dialog. Interactively you would have seen an error (or your session started before the edit). Fix the JSON, validate it (for example against the settings schema), and add a CI step that parses settings files before running Claude.

</details>

### P7. Script review

**Difficulty:** Hard · **Type:** Code review · **Concepts:** safe scripting

Find three problems in this CI step: `claude -p "fix the failing tests and push" --permission-mode bypassPermissions`.

<details>
<summary>Answer</summary>

1. `bypassPermissions` removes all checks on a runner that likely has secrets and a write token.
2. "push" makes the job publish unreviewed changes — no human gate.
3. No `--max-turns`/budget/timeout and no result check (`--output-format json`, `is_error`). Also no `--bare`, so repository configuration influences the run. A safer design reports failures, proposes a patch as an artifact or PR comment, and leaves pushing to a human.

</details>
