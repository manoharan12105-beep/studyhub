# Hooks Reference

## Configuration Shape

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protect-files.sh", "timeout": 30 }
        ]
      }
    ]
  }
}
```

- Where: `~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`, managed settings, plugins, skill/agent frontmatter.
- `matcher`: tool name or regex (`Edit|Write`, `Bash`, `mcp__runbook__.*`); for SessionStart the source (`startup|resume|compact`); for Notification the type (`permission_prompt`, `idle_prompt`).
- Types: `command`, `http`, `mcp_tool`, `prompt`, `agent`. Default timeout 600 s for command/http/mcp_tool (30 s for prompt, 60 s for agent).
- `/hooks` lists configured hooks.

## Common Events

| Event | Fires | Can block? |
|-------|-------|-----------|
| `SessionStart` | Session start, resume, after compact | No; stdout adds context |
| `UserPromptSubmit` | Before Claude processes your prompt | Yes |
| `PreToolUse` | Before a tool call | Yes (exit 2 or `permissionDecision`) |
| `PermissionRequest` | When a permission prompt would show | Can allow/deny |
| `PostToolUse` | After a tool succeeds | Feedback to Claude (exit 2: stderr shown) |
| `Notification` | Claude needs attention | No |
| `Stop` / `SubagentStop` | Claude / a subagent finishes | Yes (`decision: "block"` or exit 2) |
| `PreCompact` | Before compaction | — |
| `SessionEnd` | Session ends (shared 1.5 s budget) | No |

## Input (stdin JSON)

Common: `session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`. Tool events add `tool_name`, `tool_input` (e.g. `tool_input.file_path`, `tool_input.command`). Stop adds `stop_hook_active`, `last_assistant_message`. Env: `CLAUDE_PROJECT_DIR`.

## Exit Codes

| Exit | Meaning |
|------|---------|
| 0 | Success; JSON on stdout is parsed for decisions; some events add stdout to context |
| 2 | **Block** (where the event supports it); stderr goes to Claude |
| Other | Non-blocking error; execution continues |

## JSON Decisions

```json
{ "hookSpecificOutput": { "hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": "Force-push rewrites shared history." } }
```

`permissionDecision`: `allow` · `deny` · `ask`. Stop: `{"decision": "block", "reason": "…"}` or `hookSpecificOutput.additionalContext`.

## Testing a Hook Without Claude

```bash
echo '{"tool_name":"Edit","tool_input":{"file_path":"'"$PWD"'/.env"}}' \
  | CLAUDE_PROJECT_DIR="$PWD" .claude/hooks/protect-files.sh; echo "exit=$?"
```

Expected for the orderdesk guard: `Blocked: .env holds secrets. …` and `exit=2`.

## Rules of Thumb

- Fail closed for guards: `command -v jq >/dev/null || { echo "needs jq" >&2; exit 2; }`.
- Stop hooks: honour `stop_hook_active`; Claude Code caps 8 consecutive continuations.
- Keep hooks fast; never print secrets.
- Project hooks run only after workspace trust (but `-p` runs settings hooks without a dialog).
- Hooks are a layer: text matching misses spellings; sandbox and server-side controls cover the rest.
- Bash + jq is portable (macOS, Linux, WSL, Git Bash); on plain Windows use PowerShell hooks.
