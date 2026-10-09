# Hook Configuration, Input and Output

**Module:** Hooks and Workflow Guardrails · **Interview priority:** Frequently asked

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 and the *Hooks reference* (October 2026). The scripts on this page were run with recorded hook input; see [Lab 09](../../labs/cc-lab-09-create-hook/content.md).

## Definition

**Hook configuration** is the `hooks` block in a settings file (or plugin, skill or subagent) that maps **events** to **matcher groups** and **handlers**. **Hook input** is the JSON Claude Code writes to the handler's stdin; **hook output** is how the handler answers: an **exit code**, text on stdout/stderr, or a **JSON object** with decision fields.

## Why It Matters

- Most hook bugs are configuration bugs: a matcher that never matches, a field at the wrong JSON level, exit 1 instead of 2.
- The JSON input is your only view of what Claude is about to do — knowing its fields is what lets you write precise guards.
- JSON output enables more than block/allow: forcing a prompt (`ask`), adding context, rewriting tool input.

## How It Works

```text
{
  "hooks": {
    "PreToolUse": [                                   ← event
      {
        "matcher": "Edit|Write",                      ← which tool calls (by tool name)
        "hooks": [                                    ← handlers, run in parallel
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protect-files.sh",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

1. The event fires; Claude Code selects groups whose `matcher` matches (and handlers whose optional `if` matches).
2. Each handler receives the event JSON on stdin.
3. Claude Code combines the results; for `PreToolUse` the most restrictive decision wins: `deny` > `defer` > `ask` > `allow`.

## Hook Configuration

**Where hooks live:**

| Location | Scope |
|----------|-------|
| `~/.claude/settings.json` | All your projects |
| `.claude/settings.json` | This project, shared through Git |
| `.claude/settings.local.json` | This project, only you |
| Managed policy settings | Organization-wide |
| Plugin `hooks/hooks.json` | While the plugin is enabled |
| Skill frontmatter | From the skill's invocation for the rest of the session |
| Subagent frontmatter | While that subagent runs |

Hooks from all sources **merge** — every matching hook runs. `/hooks` lists them by event; `"disableAllHooks": true` turns them off (subject to precedence).

**Matchers** filter by a field that depends on the event:

| Event | Matcher compares against | Examples |
|-------|--------------------------|----------|
| `PreToolUse`, `PostToolUse`, `PermissionRequest` … | Tool name | `Bash`, `Edit\|Write`, `mcp__github__.*` |
| `SessionStart` | How the session started | `startup`, `resume`, `clear`, `compact`, `fork` |
| `Notification` | Notification type | `permission_prompt`, `idle_prompt` |
| `PreCompact` | Trigger | `manual`, `auto` |
| `UserPromptSubmit`, `Stop` | — (no matcher; always fires) | |

An empty or missing matcher fires on every occurrence. Matchers are **case-sensitive** and use the canonical tool names from the tools reference.

**The `if` field** narrows one handler with permission-rule syntax, so the process only spawns for matching calls:

```json
{ "type": "command", "if": "Bash(git *)", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check-git-policy.sh" }
```

It works only on tool events and is best-effort — the docs say to use the permission system, not a hook filter, for a hard allow or deny.

**Command form:** without `args`, `command` runs through a shell (`sh -c`, Git Bash on Windows, or PowerShell when Git Bash is missing); quote path placeholders: `"\"$CLAUDE_PROJECT_DIR\"/…"`. With `args` it runs as **exec form** — no shell, each argument passed verbatim — which the docs recommend whenever a path placeholder is involved.

## Hook Input

Every event includes common fields; each event adds its own. A `PreToolUse` hook for a Bash call receives (from the reference):

```json
{
  "session_id": "abc123",
  "transcript_path": "/home/user/.claude/projects/.../transcript.jsonl",
  "cwd": "/home/user/my-project",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm test",
    "description": "Run test suite",
    "timeout": 120000,
    "run_in_background": false
  },
  "tool_use_id": "toolu_01ABC123..."
}
```

| Field | Use |
|-------|-----|
| `tool_name`, `tool_input` | What Claude wants to do: `command` for Bash, `file_path` for Edit/Write/Read |
| `cwd` | Where Claude is working (follows `cd` and worktrees) |
| `permission_mode` | `default` (Manual), `plan`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions` |
| `hook_event_name` | Lets one script serve several events |
| `transcript_path` | Path to the session transcript (written asynchronously — may lag) |

`SessionStart` adds `source`; `UserPromptSubmit` adds `prompt`; `Stop` adds `stop_hook_active` and `last_assistant_message`.

## Hook Output

**Exit codes:**

| Exit | Meaning |
|------|---------|
| `0` | No objection. Stdout is parsed as JSON if it looks like JSON; for `SessionStart`, `UserPromptSubmit` and a few others, plain stdout is added to Claude's context |
| `2` | **Blocking error** on events that can block. Stderr (or the JSON reason) becomes the feedback. JSON cannot override an exit-2 block |
| Anything else | Non-blocking error for most events: the action proceeds and the transcript shows a hook error notice |

**JSON output** (exit 0) gives finer control. Field placement matters:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "ask",
    "permissionDecisionReason": "pom.xml changes the build for everyone: review this edit before approving it."
  }
}
```

| Event | Decision fields |
|-------|-----------------|
| `PreToolUse` | `hookSpecificOutput.permissionDecision`: `allow`, `deny`, `ask` (or `defer` in `-p`) + `permissionDecisionReason`; optional `updatedInput` |
| `PermissionRequest` | `hookSpecificOutput.decision.behavior`: `allow` / `deny` |
| `PostToolUse`, `Stop`, `UserPromptSubmit`, `PreCompact`, `ConfigChange` | Top-level `"decision": "block"` + `reason` |
| `SessionStart`, `UserPromptSubmit` | `hookSpecificOutput.additionalContext` adds context |

A PreToolUse `"allow"` skips the prompt but **does not override deny or ask rules**; a `"deny"` blocks **even in bypass permissions mode**.

## Syntax and Configuration

A tested guard (`.claude/hooks/protect-files.sh` from the orderdesk labs) showing all three outputs — block, ask, no objection:

```bash
#!/usr/bin/env bash
# PreToolUse hook for Edit|Write: protect secrets and applied migrations,
# and ask before pom.xml changes. Reads the hook input (JSON) on stdin.
command -v jq >/dev/null || { echo "protect-files.sh needs jq: blocking until it is installed." >&2; exit 2; }
input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
[ -z "$file" ] && exit 0

file="${file//\\//}"                         # Windows paths use backslashes
root="${CLAUDE_PROJECT_DIR//\\//}"
rel="${file#"$root"/}"                       # path relative to the project root

case "$rel" in
  .env | .env.* | */.env | */.env.*)
    echo "Blocked: $rel holds secrets. Ask the developer to change it." >&2
    exit 2 ;;
  src/main/resources/db/migration/V*.sql)
    if [ -e "$file" ]; then
      echo "Blocked: $rel is an existing Flyway migration. Never change an applied migration; add a new V<n>__description.sql instead." >&2
      exit 2
    fi ;;
  pom.xml)
    jq -n --arg reason "pom.xml changes the build for everyone: review this edit before approving it." \
      '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: $reason}}'
    exit 0 ;;
esac
exit 0
```

Why Bash and `jq` for a hook in a Java project: Claude Code runs command hooks as shell commands, the official examples use `jq` to read the JSON input, and a hook must start fast on every matching event. A Java hook would work too (`java Hook.java`), but JVM start-up adds latency to every edit and Java has no built-in JSON parser.

**Test it without Claude** by piping recorded input:

```bash
echo '{"tool_name":"Edit","tool_input":{"file_path":"'"$PWD"'/.env"}}' | CLAUDE_PROJECT_DIR="$PWD" .claude/hooks/protect-files.sh; echo "exit=$?"
```

**Output:**

```text
Blocked: .env holds secrets. Ask the developer to change it.
exit=2
```

## Real-World Example

A team's PostToolUse formatter "doesn't run". `/hooks` lists it under `PostToolUse` with matcher `edit|write`. Matchers are case-sensitive and the tools are `Edit` and `Write`, so it never matched. Changing it to `Edit|Write` fixes it — and the team adds `Bash` coverage via a `Stop` hook that runs `git status --porcelain`, because Claude can also change files through shell commands.

## Step-by-Step Walkthrough

1. Choose the event (before or after? can it block?).
2. Choose the matcher (tool names, exact case) and an optional `if` filter.
3. Write the script: read stdin once, extract fields with `jq`, decide, exit 0 or 2 (or print JSON and exit 0).
4. Make it executable (`chmod +x`) and reference it with `"$CLAUDE_PROJECT_DIR"` (quoted) or exec form.
5. Test with piped sample JSON for each branch; check exit codes.
6. Check `/hooks`, then trigger the event in a session.

## Common Mistakes

- `permissionDecision` at the top level instead of inside `hookSpecificOutput` — silently ignored.
- Printing anything before the JSON (a shell profile `echo`) — the output no longer parses as JSON.
- Mixing exit 2 with JSON that says allow — exit 2 wins.
- Reading stdin twice (`cat` consumes it) — capture it once into a variable.
- Relative script paths that break when Claude `cd`s — use `$CLAUDE_PROJECT_DIR`.

## Security Considerations

- Treat hook input as untrusted: file paths and commands come from the model, which may have read hostile content. Quote variables, check for `..` in paths, avoid `eval`.
- Hooks inherit your environment. Don't print secrets to stdout of `SessionStart` (it becomes context).
- Scripts referenced by project hooks live in the repository — review changes to them like code that runs on every developer's machine.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| JSON decision ignored | Wrong nesting or extra output before `{` | Put fields under `hookSpecificOutput`; silence profile output |
| Block doesn't happen | Exit 1 or timeout | Exit 2; a timed-out PreToolUse command hook doesn't block |
| Works in Git Bash, not in CI | `jq` missing | Install it, or make the guard fail closed when it's missing |
| `command not found` | Relative path, not executable | `"$CLAUDE_PROJECT_DIR"/…`, `chmod +x`, or exec form |

## Trade-offs

| Output style | Simple | Expressive |
|--------------|--------|------------|
| Exit 2 + stderr | Easiest block | Only block/no-block |
| JSON | More code | ask, deny, allow, context, input rewrites |

## Interview Takeaways

- Explain the event → matcher → handler structure and where hooks can be configured.
- Describe the input fields you use and the exit-code semantics (0, 2, other).
- Show a JSON decision for PreToolUse and explain why field nesting matters.

## Key Takeaways

- `hooks` → event → `{matcher, hooks: [handlers]}`; all sources merge.
- Input arrives as JSON on stdin; read it once and parse with `jq`.
- Exit 2 blocks; other non-zero codes don't. JSON gives allow/deny/ask/context.
- Test hooks by piping sample input before trusting them.
