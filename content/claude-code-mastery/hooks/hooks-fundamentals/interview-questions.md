# What Are Hooks? Lifecycle and Events — Interview Questions

## Beginner

### Q1. What is a Claude Code hook?

**Style:** What

<details>
<summary>Answer</summary>

A handler — usually a shell command — that Claude Code runs automatically at a lifecycle event such as `PreToolUse`, `PostToolUse`, `SessionStart`, `Notification` or `Stop`. It receives event data as JSON on stdin and communicates through exit codes and output. It gives deterministic control: it runs every time the event matches.

</details>

### Q2. Which hook would you use to block a dangerous command?

**Style:** How

<details>
<summary>Answer</summary>

`PreToolUse` with matcher `Bash`: the script reads `tool_input.command`, and on a match exits 2 with a reason on stderr, or prints JSON with `permissionDecision: "deny"` and a reason. Claude receives the reason and can adapt. A deny from a PreToolUse hook applies in every permission mode, including bypass.

</details>

## Intermediate

### Q3. How do hooks differ from CLAUDE.md and skills?

**Style:** Comparison

<details>
<summary>Answer</summary>

CLAUDE.md and skills are instructions the model interprets — useful for judgement, not guaranteed. Hooks are executed by Claude Code at events whether or not the model "remembers"; they're for things that must always happen or never happen. Skills can also declare hooks that register when the skill is invoked.

</details>

### Q4. Which events can block and which can't?

**Style:** What

<details>
<summary>Answer</summary>

Events for things not yet done can block: `PreToolUse`, `UserPromptSubmit`, `Stop`, `SubagentStop`, `PreCompact`, `ConfigChange` and others. Events about things that already happened can't: `PostToolUse` (stderr goes to Claude), `Notification`, `SessionStart` (stdout adds context), `SessionEnd`. `PermissionRequest` uses a JSON decision instead of exit code 2.

</details>

## Advanced

### Q5. How do hooks relate to GitHub Actions and MCP?

**Style:** Comparison

<details>
<summary>Answer</summary>

Hooks run locally inside a Claude Code session at its lifecycle events. MCP tools are capabilities Claude chooses to call — the model decides. GitHub Actions run on GitHub for repository events, independent of any developer's session. A hook can call an MCP tool (`mcp_tool` type), and the Claude Code GitHub Action runs Claude Code (with its hooks) inside a workflow, but they solve different problems: local guardrails, tool access, and server-side automation.

</details>

### Q6. What can a hook not guarantee?

**Style:** Security

<details>
<summary>Answer</summary>

That it covers every path: it checks only what its script inspects (a Bash guard can be bypassed by a different spelling or a script file), it can fail open if it crashes or exits non-2, it runs only in sessions where it's configured and trusted, and a timed-out PreToolUse command hook doesn't block. It's one layer; pair it with permission rules, the sandbox, CI and review.

</details>
