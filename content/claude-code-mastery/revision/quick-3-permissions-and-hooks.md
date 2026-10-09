# Block 3: Permissions and Hooks

## Permission Rules

- `allow` / `ask` / `deny`; **deny > ask > allow**.
- `Bash(./mvnw -B verify)`, `Bash(git push *)`, `Edit(/pom.xml)`, `Read(.env)`, `Read(!.env.example)`, `mcp__server__tool`.
- Files: managed > CLI/`--settings` > local > project > user; lists merge.
- Workspace trust gates project config; `-p` has no trust dialog.
- Bash rules match command **text**: `git -C . push` escapes `Bash(git push *)`.

## A Safe Project Baseline

| Category | Rules |
|----------|-------|
| allow | build and test commands |
| ask | `git commit *`, `git push *`, `Edit(/pom.xml)`, migrations |
| deny | `.env*` (except example), `~/.ssh/**`, `~/.aws/**`, `curl`/`wget`, force push, deploy |

## Hooks in One Minute

- Run at events: `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PermissionRequest`, `PostToolUse`, `Notification`, `Stop`, `SubagentStop`, `PreCompact`, `SessionEnd`.
- Input: JSON on stdin (`tool_name`, `tool_input.file_path`, `tool_input.command`, `stop_hook_active`, …). Env: `CLAUDE_PROJECT_DIR`.
- **Exit 2 = block** (stderr to Claude); exit 0 = OK (JSON decisions read); other = non-blocking error.
- JSON: `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"…"}}`.

## orderdesk Hooks

| Hook | Event | Does |
|------|-------|------|
| `session-start-context.sh` | SessionStart | Branch, uncommitted count, reminder |
| `protect-files.sh` | PreToolUse Edit\|Write | Blocks `.env*` and existing migrations; asks for `pom.xml` |
| `block-dangerous-bash.sh` | PreToolUse Bash | Denies force push, deploy, DROP TABLE, flyway clean |
| `check-java-file.sh` | PostToolUse Edit\|Write | Reports tabs / >400 lines (exit 2) |
| `test-before-stop.sh` | Stop | Runs tests if `src/` changed; checks `stop_hook_active` |

## Truths to Say in Interviews

- CLAUDE.md = guidance; permissions and hooks = enforcement; neither alone is a security boundary.
- Guards should **fail closed** (missing `jq` → exit 2).
- Test hooks by piping JSON: `echo '{…}' | .claude/hooks/x.sh; echo "exit=$?"`.
- Stop hooks: honour `stop_hook_active`; 8 consecutive continuations max.

## Self-Check

- Which wins: `allow Bash(git *)` or `deny Bash(git push --force *)`? → deny (for that spelling).
- A PostToolUse hook exits 2 — is the edit undone? → No; Claude sees stderr and fixes next.
- Why might a project `defaultMode: "bypassPermissions"` do nothing? → Ignored from project settings.
