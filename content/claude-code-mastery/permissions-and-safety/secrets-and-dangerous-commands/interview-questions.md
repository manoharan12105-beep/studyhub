# Protecting Secrets and Preventing Dangerous Commands — Interview Questions

## Beginner

### Q1. How do you stop Claude Code from reading secret files?

**Style:** How

<details>
<summary>Answer</summary>

`Read` deny rules for the files (`Read(.env)`, `Read(~/.ssh/**)`, `Read(~/.aws/**)`), which Claude Code enforces for its file tools, recognized Bash file commands and redirects; keep secrets out of the repository; and, for shell commands, the sandbox's `credentials` or `denyRead` settings. Instructions in CLAUDE.md alone are not enough.

</details>

### Q2. What is the Bash sandbox?

**Style:** What

<details>
<summary>Answer</summary>

An OS-enforced boundary around the shell commands Claude runs (macOS, Linux, WSL 2): writes limited to the working directory and temp, network through a proxy that allows only listed domains, optional denied reads and scrubbed environment variables. It doesn't cover the file tools, hooks or MCP servers. In auto-allow mode sandboxed commands run without prompts.

</details>

## Intermediate

### Q3. What are protected and critical paths?

**Style:** What

<details>
<summary>Answer</summary>

Protected paths (`.git`, `.claude`, `.mvn`, shell rc files, `.mcp.json`, wrapper properties and others) are never auto-approved for writes except in bypass mode, and allow rules don't pre-approve them. Critical paths cover `rm`/`rmdir` of the root, top-level directories, home and the working directory or its parents — no allow rule or hook can approve those; they prompt or are denied in every mode.

</details>

### Q4. How would you handle dependency installation with an agent?

**Style:** Scenario

<details>
<summary>Answer</summary>

Treat it as a supply-chain decision: an ask rule on build-file edits so every new dependency is seen, a check of coordinates (typo-squatting), necessity, version, maintainers and licence, and preferably a dependency scanner in CI. In auto mode, the classifier allows installing declared dependencies by default, so the human checkpoint is the build-file change itself.

</details>

## Advanced

### Q5. What are the documented limits of the sandbox?

**Style:** Trade-off

<details>
<summary>Answer</summary>

It isn't a complete isolation boundary: the proxy doesn't inspect TLS, so broad allowed domains can enable exfiltration or domain fronting; allowing Unix sockets like the Docker socket can grant host access; broad write permissions can enable privilege escalation; it doesn't wrap file tools, hooks or MCP servers; and native Windows isn't supported. For stronger guarantees run all of Claude Code inside a container, VM or dev container with a network allowlist.

</details>

### Q6. Design guardrails so a junior developer can safely use auto mode on a service with a staging database.

**Style:** Workflow design

<details>
<summary>Answer</summary>

Remove staging write credentials from the laptop (read-only user if needed); deny reads of secret files; ask rules for pushes, build-file and migration edits; deny deploy and force-push commands; a PreToolUse hook for migration and SQL patterns; the sandbox with a minimal domain allowlist; branch protection and CI approval gates on the server; and a team habit of reviewing `git diff` before every commit. Auto mode's classifier is an additional layer, not the only one.

</details>
