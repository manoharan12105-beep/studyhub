# Hook Configuration, Input and Output — Interview Questions

## Beginner

### Q1. How is a hook configured?

**Style:** How

<details>
<summary>Answer</summary>

In a settings file's `hooks` object: event name → array of matcher groups → each with a `matcher` and a `hooks` array of handlers (`type`, `command`, optional `if`, `timeout`, `args`). Hooks from user, project, local, managed settings, plugins, skills and subagents all merge and run.

</details>

### Q2. What does a hook receive and return?

**Style:** What

<details>
<summary>Answer</summary>

It receives event JSON on stdin — common fields like `session_id`, `cwd`, `permission_mode`, `hook_event_name` plus event fields like `tool_name` and `tool_input`. It returns an exit code (0 no objection, 2 block, others non-blocking error), text on stdout/stderr, or a JSON object with decision fields.

</details>

## Intermediate

### Q3. When would you use JSON output instead of exit 2?

**Style:** Comparison

<details>
<summary>Answer</summary>

When block/no-block isn't enough: forcing a prompt with `permissionDecision: "ask"`, allowing with a reason, adding `additionalContext`, rewriting tool input with `updatedInput`, or using event-specific decisions such as `decision: "block"` on Stop to keep Claude working. Exit 2 is simplest for a plain block.

</details>

### Q4. What are common reasons a hook's decision is ignored?

**Style:** Debugging

<details>
<summary>Answer</summary>

Fields at the wrong nesting level, extra output before the JSON (shell profile echoes), invalid JSON, exit codes other than 2 for blocking, a timeout (a timed-out PreToolUse command hook doesn't block), or a matcher that doesn't match the tool name exactly.

</details>

## Advanced

### Q5. How do hook decisions interact with permission rules and modes?

**Style:** Follow-up

<details>
<summary>Answer</summary>

PreToolUse hooks run before the permission-mode check in every mode. A hook deny blocks even in bypass mode. A hook allow skips the prompt but can't override deny or ask rules (including managed ones) or prompts for tools that require user interaction. Multiple hooks combine with the most restrictive decision winning.

</details>

### Q6. Why might you write a hook in Bash instead of Java in a Java project?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Hooks run as shell commands on every matching event, so start-up time matters; a Bash script with `jq` starts in milliseconds and is the documented idiom. A Java single-file program works but adds JVM start-up latency per tool call and needs a JSON library or hand parsing. Use Java when the logic is complex and latency acceptable — for example an `http` hook backed by a long-running Java service.

</details>
