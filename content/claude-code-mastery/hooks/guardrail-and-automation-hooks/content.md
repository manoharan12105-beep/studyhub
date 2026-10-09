# Guardrail, Automation and Session Hooks

**Module:** Hooks and Workflow Guardrails · **Interview priority:** Frequently asked

> [!NOTE]
> **Verification:** the scripts on this page were run with recorded hook input on Git Bash (Windows) with `jq` 1.7.1, and a `SessionStart` hook was fired by `claude --init-only` (v2.1.289). The hooks were not exercised inside a model conversation.

## Definition

This lesson builds the hooks most teams actually use:

- **Pre-tool-use guardrails** — `PreToolUse` hooks that block or escalate risky edits and commands before they run.
- **Post-tool-use automation** — `PostToolUse` hooks that check or format what Claude just changed and report problems back.
- **Session lifecycle hooks** — `SessionStart` (inject context), `Stop` (keep working until a check passes), `SessionEnd` (cleanup).
- **Notifications** — `Notification` hooks that alert you when Claude waits for input.

## Why It Matters

- Guardrails turn your most important rules ("never edit applied migrations", "never force-push") from requests into checks.
- Automation removes repetitive prompts ("format it", "check the line length") and gives Claude immediate feedback.
- Session hooks re-establish context after a restart or compaction without bloating `CLAUDE.md`.

## How It Works

```text
Claude: Edit V1__create_orders.sql
   └─► PreToolUse  protect-files.sh ── exit 2 + reason ──► blocked; Claude reads the reason
Claude: Edit Order.java
   └─► PreToolUse  protect-files.sh ── exit 0 ──► normal permission flow ──► edit runs
          └─► PostToolUse check-java-file.sh ── tabs found: exit 2 ──► Claude sees "contains tab characters"
Claude: Bash "git push --force origin main"
   └─► PreToolUse  block-dangerous-bash.sh ── JSON deny ──► blocked even in bypass mode
```

## Pre-Tool-Use Guardrails

**Protect secrets and applied migrations, ask before build changes** — `protect-files.sh` (shown in full in the previous lesson): `.env` files → exit 2; an **existing** `V*.sql` migration → exit 2 (new migrations are allowed); `pom.xml` → JSON `ask`.

Captured runs (recorded input piped into the script):

| Input `file_path` | Output | Exit |
|-------------------|--------|------|
| `<project>/.env` | `Blocked: .env holds secrets. Ask the developer to change it.` | 2 |
| `<project>/src/main/resources/db/migration/V1__create_orders.sql` (exists) | `Blocked: src/main/resources/db/migration/V1__create_orders.sql is an existing Flyway migration. Never change an applied migration; add a new V<n>__description.sql instead.` | 2 |
| `<project>/src/main/resources/db/migration/V2__add_paid_at.sql` (new) | *(nothing)* | 0 |
| `<project>/pom.xml` | JSON with `"permissionDecision": "ask"` | 0 |
| `<project>/src/main/java/.../Order.java` | *(nothing)* | 0 |

**Block selected unsafe commands** — `.claude/hooks/block-dangerous-bash.sh`:

```bash
#!/usr/bin/env bash
# PreToolUse hook for Bash: refuse a few commands this project never wants an
# agent to run. It matches the command text, so it is a guardrail, not a
# security boundary: "git -C . push --force" or a script file would get past it.
command -v jq >/dev/null || { echo "block-dangerous-bash.sh needs jq: blocking until it is installed." >&2; exit 2; }
input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')

deny() {
  jq -n --arg reason "$1" \
    '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $reason}}'
  exit 0
}

case "$cmd" in
  *"git push"*"--force"* | *"git push"*" -f"*)
    deny "Force-push rewrites shared history. Push normally and let a human decide." ;;
  *mvn*" deploy"*)
    deny "Publishing artifacts is a release step for a human." ;;
  *[Dd][Rr][Oo][Pp]" "[Tt][Aa][Bb][Ll][Ee]*)
    deny "Dropping tables is not allowed from an agent session." ;;
  *flyway*clean*)
    deny "flyway clean deletes every object in the schema." ;;
esac
exit 0
```

| Command tested | Result |
|----------------|--------|
| `git push --force origin main`, `git push -f` | deny: "Force-push rewrites shared history …" |
| `./mvnw -B deploy` | deny: "Publishing artifacts is a release step for a human." |
| `psql -c "drop table orders"` | deny: "Dropping tables is not allowed …" |
| `git push origin feature/pay`, `./mvnw test` | no output, exit 0 |
| `git -C . push --force` | **no output, exit 0 — not caught** |

The last row is the point of the comment at the top: a text-matching guard misses other spellings. It complements `permissions.deny`, the sandbox and server-side branch protection.

**Fail closed.** Both guards start with `command -v jq … || exit 2`. Without that line, a missing `jq` made the scripts exit 0 — the guard silently allowed everything. A guard that cannot run should block, not allow.

## Post-Tool-Use Automation

`.claude/hooks/check-java-file.sh` checks every Java file Claude writes or edits:

```bash
#!/usr/bin/env bash
# PostToolUse hook for Edit|Write: report Java files that grew too long or
# contain tab characters. The edit has already happened; exit 2 shows stderr
# to Claude so it can fix the file in its next step.
input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
case "$file" in *.java) ;; *) exit 0 ;; esac
[ -f "$file" ] || exit 0

problems=""
lines=$(wc -l < "$file" | tr -d ' ')
if [ "$lines" -gt 400 ]; then
  problems+="$file has $lines lines (limit 400): split the class. "
fi
if grep -q $'\t' "$file"; then
  problems+="$file contains tab characters: this project indents with 4 spaces. "
fi
if [ -n "$problems" ]; then
  echo "$problems" >&2
  exit 2
fi
exit 0
```

Tested: a file with a tab produced `… contains tab characters: this project indents with 4 spaces.` and exit 2; a 407-line file produced `… has 407 lines (limit 400): split the class.` and exit 2; `Order.java` passed with exit 0.

Other common PostToolUse automation: running a formatter on the edited file only, compiling the touched module, or appending the command to an audit log. Keep them **fast** and **scoped to the changed file** — a hook that reformats the whole project creates huge diffs.

## Session Lifecycle Hooks

**SessionStart context reminder** — `.claude/hooks/session-start-context.sh`:

```bash
#!/usr/bin/env bash
# SessionStart hook: plain text on stdout is added to Claude's context.
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0
branch=$(git branch --show-current 2>/dev/null)
changed=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
echo "Session context for orderdesk:"
echo "- Current branch: ${branch:-unknown (not a git repository)}"
echo "- Uncommitted files: $changed"
echo "- Reminder: run ./mvnw -B verify before reporting a change as done; never edit an applied migration."
```

**Output (varies)** — from a test repository on branch `feature/pay-endpoint` with four uncommitted files:

```text
Session context for orderdesk:
- Current branch: feature/pay-endpoint
- Uncommitted files: 4
- Reminder: run ./mvnw -B verify before reporting a change as done; never edit an applied migration.
```

Register it with the matcher `startup|resume|compact` so it also runs after compaction.

**Stop hooks** keep Claude working until a condition holds. A `prompt` hook can judge completion; a `command` hook can run a check. A Stop hook must look at `stop_hook_active` in its input and allow the stop when it is already continuing, or Claude Code overrides it after it blocks eight times in a row.

**SessionEnd** suits cleanup (removing temp files). All `SessionEnd` hooks share a short time budget (1.5 seconds by default), so keep them tiny.

## Notifications

On Windows (PowerShell), from the official guide:

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "permission_prompt",
        "hooks": [
          {
            "type": "command",
            "command": "powershell.exe -Command \"[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('Claude Code needs your attention', 'Claude Code')\""
          }
        ]
      }
    ]
  }
}
```

macOS uses `osascript -e 'display notification "Claude Code needs your attention" with title "Claude Code"'`; Linux uses `notify-send 'Claude Code' 'Claude Code needs your attention'` (needs a notification daemon). The `permission_prompt` matcher fires when a permission prompt has waited about six seconds; `idle_prompt` when Claude finished about 60 seconds ago and you haven't typed. Put notification hooks in `~/.claude/settings.json` — they are personal.

## Syntax and Configuration

The orderdesk team configuration in `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|compact",
        "hooks": [
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/session-start-context.sh" }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protect-files.sh" }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/block-dangerous-bash.sh" }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check-java-file.sh" }
        ]
      }
    ]
  }
}
```

## Real-World Example

During a FEAT-7 session Claude decides the cleanest design is to add `paid_at` to the `orders` table and starts editing `V1__create_orders.sql`. The PreToolUse guard blocks it and returns: *"…is an existing Flyway migration. Never change an applied migration; add a new V<n>__description.sql instead."* Claude creates `V2__add_paid_at.sql`, which the guard allows; the ask rule on migration edits still shows you the new file before it is written.

## Step-by-Step Walkthrough

1. Write each script in `.claude/hooks/`, make it executable.
2. Test every branch by piping recorded JSON; check exit codes and JSON.
3. Register the hooks in `.claude/settings.json`; confirm with `/hooks`.
4. Trigger each one in a session (ask Claude to edit `.env`, to run `./mvnw deploy`, to add a tab).
5. Commit the scripts and settings; teammates get them after trusting the folder.

## Common Mistakes

- A guard that fails open when its dependency is missing.
- Matching `Edit` only, forgetting `Write` (and that Bash can change files).
- PostToolUse hooks that run the whole test suite on every edit — slow sessions.
- A Stop hook without a `stop_hook_active` check — repeated blocking until Claude Code overrides it.
- Notification hooks committed to the project — your desktop preferences forced on teammates.

## Security Considerations

- A guard is a guardrail, not a boundary: document what it does **not** catch (as the script comment does).
- Hook scripts run with your permissions on every matching event; review changes to `.claude/hooks/` in pull requests.
- Never print secrets from a SessionStart hook — its stdout becomes context.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Guard allows everything | `jq` missing and no fail-closed line; wrong path normalization | Add the `command -v jq` check; test with real paths (Windows backslashes) |
| PostToolUse feedback never reaches Claude | Exit 1 or stdout instead of stderr | Exit 2 with the message on stderr |
| SessionStart text missing | Not registered for that `source`, or the script printed to stderr | Matcher `startup\|resume\|compact`; print to stdout |
| Notification never appears | OS permission for notifications, missing daemon | Test the notification command by itself first |

## Trade-offs

| Hook | Benefit | Cost |
|------|---------|------|
| PreToolUse guard | Prevents mistakes before they happen | Latency on every matching call; maintenance |
| PostToolUse check | Immediate feedback | Can't prevent; must be fast |
| SessionStart context | Oriented sessions, survives compaction | Output counts as context |
| Notification | Lets you step away | Personal; noisy if too broad |

## Interview Takeaways

- Show a PreToolUse guard and explain exit 2 versus JSON deny versus ask.
- Explain why guards should fail closed and what text matching misses.
- Describe a PostToolUse check, a SessionStart reminder and a notification hook, and where each belongs (project vs user settings).

## Key Takeaways

- PreToolUse to prevent, PostToolUse to give feedback, SessionStart to orient, Notification to alert.
- Test every branch of a hook with recorded input before relying on it.
- Fail closed; document what the guard cannot see.
- Keep automation fast and scoped to the file that changed.
