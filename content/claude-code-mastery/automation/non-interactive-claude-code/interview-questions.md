# Local vs CI Automation and Non-Interactive Usage — Interview Questions

## Beginner

### Q1. What is claude -p?

**Style:** What

<details>
<summary>Answer</summary>

Non-interactive (print) mode: Claude Code runs one prompt, prints the result to stdout and exits with 0 on success or non-zero on failure. It reads stdin, supports text/JSON/stream-JSON output, and can't ask anyone for permission.

</details>

## Intermediate

### Q2. How do you control what a headless run may do?

**Style:** How

<details>
<summary>Answer</summary>

Set the permission mode explicitly (`dontAsk` or `plan` for locked-down jobs), pre-approve only the needed tools with `--allowedTools`, feed input on stdin, use `--bare` to exclude local configuration, and cap turns, budget and job time. Permission rules and hooks still apply first.

</details>

### Q3. What's different about -p compared to an interactive session?

**Style:** Comparison

<details>
<summary>Answer</summary>

No trust dialog (project hooks and MCP servers still load unless `--bare`), no one to answer prompts, invalid settings files silently ignored, fork mode off by default, no agent teammates, and failures appear as the result on stdout with a non-zero exit code.

</details>

## Advanced

### Q4. Design a safe local automation that uses Claude to review diffs before push.

**Style:** Design

<details>
<summary>Answer</summary>

A script that pipes `git diff base...HEAD` to `claude -p` with `--permission-mode dontAsk`, JSON output, turn and budget limits; checks exit code and `is_error`; prints findings and never edits, commits or pushes; skips cleanly when there's no diff; and is tested with a stub and a failing run. The human decides what to do with findings.

</details>

### Q5. Where would you never use bypassPermissions?

**Style:** Security

<details>
<summary>Answer</summary>

Anywhere with real credentials, production access, write tokens, personal files, or untrusted input — developer laptops, normal CI runners with secrets, repositories you don't control. Only in disposable, network-restricted containers or VMs where the worst case is acceptable, and even then with limits on turns, budget and time.

</details>
