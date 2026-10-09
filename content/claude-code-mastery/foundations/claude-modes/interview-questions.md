# Claude Modes — Interview Questions

## Beginner

### Q1. What is a permission mode in Claude Code?

**Style:** What

<details>
<summary>Answer</summary>

The baseline for what Claude may do in a session without asking you. There are six: Manual (`default`), Accept edits (`acceptEdits`), Plan (`plan`), Auto (`auto`), Don't ask (`dontAsk`) and Bypass permissions (`bypassPermissions`). You switch with `Shift+Tab`, start with `--permission-mode`, or set `permissions.defaultMode`.

</details>

### Q2. What is the difference between Manual and Accept edits?

**Style:** Comparison

<details>
<summary>Answer</summary>

Manual asks before every edit and every non-read-only command. Accept edits applies file edits in the working directories without asking — plus `mkdir`, `touch`, `rm`, `rmdir`, `mv`, `cp`, `sed` on in-scope paths — but still asks for other commands such as builds, tests and Git. With Accept edits you review the diff afterwards instead of each edit.

</details>

### Q3. What does plan mode do?

**Style:** What

<details>
<summary>Answer</summary>

Claude researches and writes a plan without editing source files. When the plan is ready you approve it (switching to auto or to manually approved edits), or keep planning; `Ctrl+G` lets you edit the plan. It is ideal for unclear or multi-file changes and unnecessary for a one-line fix.

</details>

### Q4. Is "YOLO mode" an official Claude Code mode?

**Style:** Misconception

<details>
<summary>Answer</summary>

No. It is a community nickname for bypass permissions (`--dangerously-skip-permissions` / `bypassPermissions`). Similarly "auto-accept" usually means Accept edits. The official set also includes Auto and Don't ask, which the informal four-mode picture omits.

</details>

## Intermediate

### Q5. How does auto mode decide what to run?

**Style:** How

<details>
<summary>Answer</summary>

Reads and working-directory edits run directly; other actions — shell commands, network requests — go to a separate classifier model that checks them against your request and a block list (download-and-execute, force push, production deploys, discarding uncommitted work, leaking secrets, and more). Explicit ask rules still prompt and deny rules still block. After 3 consecutive or 20 total blocks, it falls back to prompting. It reduces prompts but does not guarantee safety.

</details>

### Q6. When would you use dontAsk?

**Style:** Scenario

<details>
<summary>Answer</summary>

In CI or scripts where no human can answer prompts and the job's actions are known in advance. Combine it with an exact allowlist (`--allowedTools "Read" "Bash(./mvnw -B verify)"`): allowed actions run, anything that would prompt is denied, and the allowlist documents what the job may do.

</details>

### Q7. Do deny rules still apply in bypass mode?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Yes. Deny rules block in every mode, explicit ask rules still prompt, PreToolUse hooks that deny still block, and critical-path `rm` commands still need approval. Bypass removes the prompts and safety checks that would otherwise apply; it is meant only for isolated containers or VMs.

</details>

### Q8. Which mode does a new session start in?

**Style:** How

<details>
<summary>Answer</summary>

The `--permission-mode` (or bypass) flag first, then `permissions.defaultMode` from settings, then the built-in default. With v2.1.283 or later the built-in default for interactive terminal and VS Code sessions is auto, when auto mode is available; `claude -p` usually starts in `default`. `"auto"` and `"bypassPermissions"` set in project settings files don't take effect. Always read the status bar.

</details>

## Advanced

### Q9. Walk me through choosing modes for a multi-file refactor in a production service.

**Style:** Workflow design

<details>
<summary>Answer</summary>

Plan first: Claude maps call sites and proposes steps; I edit the plan to set scope and tests. Then Accept edits for the mechanical edits, because thirty prompts would turn into blind approvals — I review the complete diff instead. Builds and tests run with a narrow allow rule (`Bash(./mvnw test *)`) or in Manual; anything touching deployment or migrations stays behind ask rules. I commit and push myself. Bypass is never part of this; production credentials are on the machine.

</details>

### Q10. What protects you if Claude reads a prompt-injection payload in auto mode versus bypass mode?

**Style:** Security

<details>
<summary>Answer</summary>

In auto mode, the classifier reviews the resulting actions — its own input excludes tool results, so the payload cannot address it directly — and blocks things like data exfiltration or `curl | bash` by default; deny rules, hooks and the sandbox add hard limits. In bypass mode only deny rules, ask rules, hook denials and hard safeguards remain; the docs say it offers no protection against prompt injection. That is why bypass belongs only in disposable isolation.

</details>

### Q11. A colleague says "plan mode is read-only, so it's safe on any repo". Correct them.

**Style:** Misconception

<details>
<summary>Answer</summary>

Plan mode blocks source edits, but exploration commands can still run — read-only ones directly, others with a prompt or classifier review — and the repository's hooks, settings and MCP servers apply once the folder is trusted. In terminal sessions launched with bypass permissions available, plan mode's blocks aren't enforced. Safety on an untrusted repository comes from not trusting it blindly, deny rules, the sandbox or a container — not from plan mode alone.

</details>

### Q12. How are permission modes different from model, effort and fast mode?

**Style:** Comparison

<details>
<summary>Answer</summary>

Permission modes control what runs without asking. `/model` chooses which Claude model reasons, `/effort` how much it reasons per step, and `/fast` switches supported Opus models to a faster, more expensive configuration (a research preview). They affect quality, speed and cost — not permissions. Choosing Opus with `max` effort does not let Claude run anything new.

</details>
