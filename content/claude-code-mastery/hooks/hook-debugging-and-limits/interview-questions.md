# Hook Debugging, Failure Handling and Limits — Interview Questions

## Beginner

### Q1. How do you debug a hook that doesn't seem to run?

**Style:** Debugging

<details>
<summary>Answer</summary>

Check `/hooks` for registration and source, verify the matcher (exact, case-sensitive tool names), run the script by hand with recorded JSON, then use `claude --debug-file` (or `/debug`) to see which hooks matched, their exit codes and output.

</details>

## Intermediate

### Q2. What does "fail closed" mean for a hook?

**Style:** What

<details>
<summary>Answer</summary>

When the hook can't do its job — missing dependency, unexpected input — it blocks (exit 2 with a clear message) rather than letting the action through. Guards should fail closed; convenience automation like formatters and notifications should fail open so they never block work.

</details>

### Q3. What happens when a hook times out?

**Style:** What happens if

<details>
<summary>Answer</summary>

Claude Code cancels it and discards its output, so on most events it renders no decision. A timed-out PreToolUse command hook doesn't block — the call proceeds to the normal permission flow. Defaults are 10 minutes for command hooks (lower for some events); set short explicit timeouts for guards.

</details>

## Advanced

### Q4. Why are hooks not a security boundary?

**Style:** Security

<details>
<summary>Answer</summary>

They only see what they match and inspect, can be bypassed by different spellings or tools, only run in configured and trusted Claude Code sessions, run with full user permissions outside the sandbox, can fail open or time out, and non-managed hook blocks can even be overridden by an installed mod's tool check. Real boundaries are the sandbox, containers, least-privilege credentials and server-side controls.

</details>

### Q5. How would you make a team's hooks reliable?

**Style:** Workflow design

<details>
<summary>Answer</summary>

Version hook scripts with the repository, keep them small and fast, fail closed for guards with dependency checks, test every branch with recorded JSON in CI (so a moved path or broken script fails the build), document what each guard does not cover, review changes in PRs, and use managed hooks for organization-wide policy.

</details>
