# Hook Debugging, Failure Handling and Limits

**Module:** Hooks and Workflow Guardrails · **Interview priority:** Frequently asked

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 and the *Hooks reference* (October 2026).

## Definition

**Hook debugging** is finding out why a hook did not run, did not have the intended effect, or broke legitimate work. **Failure handling** is deciding what happens when the hook itself fails — crashes, times out, cannot find a dependency. **Limits** are what hooks fundamentally cannot guarantee, however well written.

## Why It Matters

- A broken guard is worse than none if everyone believes it works. The most dangerous hook failure is the **silent** one.
- Hooks sit on every tool call; a slow or flaky hook degrades every session on the team.
- Interviewers probe whether you understand that hooks are guardrails, not a security boundary.

## How It Works

Every hook run ends in one of three outcomes:

| Outcome | What you see | Typical cause |
|---------|--------------|---------------|
| **Success** | Nothing (unless the JSON surfaces a `systemMessage` or feedback) | Exit 0, valid or no JSON |
| **Blocking error** | The hook's reason or stderr as feedback | Exit 2, or a JSON block decision |
| **Non-blocking error** | A `<hook name> hook error` notice; **the action proceeds** | Exit 1 or other codes with plain/empty stdout, invalid JSON, a script that cannot start (127) |

For **most events, only exit code 2 blocks** — a mistyped script path produces a non-blocking error and leaves the guard silently disabled. Watch for that notice the first time a policy hook runs.

## Debugging Tools

| Tool | Use |
|------|-----|
| `/hooks` | Is the hook registered under the right event, from which source? |
| `Ctrl+O` | Transcript view: blocking errors, notices |
| `claude --debug-file /tmp/claude.log` | Full detail: which hooks matched, exit codes, stdout, stderr |
| `/debug` | Turn on debug logging mid-session and find the log path |
| Pipe test | `echo '<json>' \| ./hook.sh; echo $?` reproduces a run without Claude |
| `InstructionsLoaded` hook | Log when CLAUDE.md and rule files load (for rule-related puzzles) |

## Hook Failure Handling

**Fail open vs fail closed:**

| Hook kind | On its own failure it should | Why |
|-----------|------------------------------|-----|
| Guard (PreToolUse policy) | **Fail closed** — exit 2 with a clear message | A guard that silently allows is a false sense of security |
| Automation (formatter, notification, logging) | **Fail open** — exit 0 or 1, log the problem | Breaking every edit because a formatter is missing is worse than an unformatted file |

**Timeouts.** Defaults are 10 minutes for `command`, `http` and `mcp_tool` hooks (30 seconds for `UserPromptSubmit`; 30 s for `prompt`, 60 s for `agent` hooks); set `timeout` in seconds per hook. A **timed-out PreToolUse command hook does not block** — the call continues through the normal permission flow. Don't count on a stalled guard.

**Parallel side effects.** All matching hooks run to completion in parallel before results combine; one hook's deny does not stop another hook's side effects. When several PreToolUse hooks return `updatedInput`, the last to finish wins — non-deterministic, so let only one hook rewrite a tool's input.

**Stop hook loops.** Claude Code overrides a Stop hook that blocks eight times in a row without an intervening tool call; check `stop_hook_active`.

## Security Considerations and Limits

What a hook **cannot** guarantee:

1. **Coverage.** A hook sees only events it matches and fields it inspects. `Edit|Write` misses files changed through Bash; a Bash text match misses other spellings and scripts.
2. **Presence.** It runs only where it is configured and trusted. Interactive sessions hold back settings-file hooks until the folder is trusted; `--bare`, `disableAllHooks` or another machine skip it entirely.
3. **Correctness.** Your script can have bugs, fail open or time out.
4. **Precedence over every extension.** A plugin **mod** that handles `tool.check` can approve a call your PreToolUse hook blocked, unless the hook is in managed settings (see the permissions docs).
5. **Isolation.** Hooks run outside the Bash sandbox with your full permissions — they are code on your machine, not a container.

Best practices from the reference: validate and sanitize input, always quote shell variables, block path traversal (`..`), use absolute paths (`$CLAUDE_PROJECT_DIR`, or exec form), and skip sensitive files.

Organizations can restrict hooks: `allowManagedHooksOnly` runs only managed hooks; managed hooks keep running even if users set `disableAllHooks` (unless it is also set in managed settings).

## Syntax and Configuration

Turn hooks off for one risky run (project settings would otherwise be able to turn them back on):

```bash
claude -p "summarize the repository" --settings '{"disableAllHooks": true}'
```

A per-hook timeout and a spinner message:

```json
{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check-java-file.sh", "timeout": 15, "statusMessage": "Checking Java style" }
```

## Real-World Example

A team's migration guard "worked for months". During an incident review someone notices hundreds of `PreToolUse hook error: Failed with non-blocking status code: … No such file or directory` notices: a refactor moved `.claude/hooks/` to `.claude/scripts/`, but `settings.json` still pointed at the old path. Every edit went through unguarded. Fixes: the path, a fail-closed wrapper for guard hooks, and a CI check that runs each hook against recorded input.

## Step-by-Step Walkthrough

When a hook misbehaves:

1. `/hooks` — registered under the right event and source?
2. Matcher — exact, case-sensitive tool names?
3. Run the script by hand with recorded JSON; check stdout, stderr and the exit code.
4. `claude --debug-file /tmp/claude.log`, trigger the event, read the log for the hook's exit code and output.
5. JSON — correct nesting? anything printed before `{`?
6. Decide fail-open or fail-closed behaviour and make it explicit.

## Common Mistakes

- Exiting 1 to block.
- No dependency check in a guard.
- Relative script paths that break after `cd`.
- Two hooks rewriting the same tool input.
- Believing a hook protects anything outside Claude Code sessions.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Hook not listed in `/hooks` | Invalid JSON, wrong file, or watcher missed an edit | Fix JSON; restart the session |
| `Only hooks from managed settings run here` | `allowManagedHooksOnly` set by the organization | Ask your admin |
| `jq: command not found` in the notice | Missing dependency | Install it; make guards fail closed |
| Hook output ignored, no error | Extra output before JSON, or misplaced fields | Check the debug log for parse messages or unrecognized keys |
| Session slow on every edit | Heavy PostToolUse hook | Scope to the changed file; `async` for non-blocking work |

## Trade-offs

| Choice | Benefit | Risk |
|--------|---------|------|
| Fail closed | Safe and visible | Blocks work until fixed |
| Fail open | Never blocks legitimate work | Silent loss of protection |
| Many small hooks | Clear responsibilities | More processes per event |
| One big hook | One place to debug | One bug disables everything |

## Interview Takeaways

- Explain the three outcomes and why only exit 2 blocks for most events.
- Describe how you debug: `/hooks`, pipe tests, `--debug-file`, JSON checks.
- List what hooks cannot guarantee and how other layers compensate.

## Key Takeaways

- A silent non-blocking error can disable a guard — watch for hook error notices.
- Guards fail closed; automation fails open.
- Timed-out PreToolUse hooks don't block; keep guards fast.
- Hooks are guardrails inside Claude Code, not a security boundary.
