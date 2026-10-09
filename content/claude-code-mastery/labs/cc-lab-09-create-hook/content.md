# Lab 09: Create Useful Hooks

**Lab:** 09 · **Module:** Hooks and Workflow Guardrails · **Difficulty:** Intermediate · **Verification:** Partially tested — every hook script was run by piping recorded hook input into it (Git Bash on Windows, jq 1.7.1) and the outputs below are from those runs; the notification hook and the hooks' behaviour inside a live session were not run.

## Objective

Build five hooks for orderdesk — a **notification**, a **session-start reminder**, a **secrets and migration guard**, a **dangerous-command guard** and a **Java file check** — and test each one **outside** Claude Code by feeding it the JSON it would receive.

## Prerequisites

- Labs 04 and 08; `jq` installed (`jq --version`).
- The hooks lessons, especially *Hook Configuration, Inputs and Outputs*.

## Scenario

Instructions in CLAUDE.md are followed most of the time. The team wants a few rules enforced **every** time: no edits to secrets or applied migrations, no force pushes, no tabs in Java files — and a heads-up when Claude is waiting for you.

## Starting State

```bash
git switch main
git switch -c lab09-hooks
mkdir -p .claude/hooks
```

**Why Bash + jq?** Hooks receive JSON on stdin and run as shell commands. Bash and `jq` are available on macOS, Linux, WSL and Git Bash, start fast, and are easy to read. A JVM-based hook would add a second or more to every tool call. On Windows without Git Bash, write hooks in PowerShell instead.

## Instructions

### Step 1: Session-start reminder

`.claude/hooks/session-start-context.sh`:

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

Test it (on a branch with one modified file):

```bash
chmod +x .claude/hooks/*.sh
echo '{"hook_event_name":"SessionStart","source":"startup"}' | CLAUDE_PROJECT_DIR="$PWD" .claude/hooks/session-start-context.sh; echo "exit=$?"
```

**Output:**

```text
Session context for orderdesk:
- Current branch: feature/pay-endpoint
- Uncommitted files: 1
- Reminder: run ./mvnw -B verify before reporting a change as done; never edit an applied migration.
exit=0
```

### Step 2: Secrets and migration guard

`.claude/hooks/protect-files.sh`:

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

Tests:

```bash
echo '{"tool_name":"Edit","tool_input":{"file_path":"'"$PWD"'/.env"}}' | CLAUDE_PROJECT_DIR="$PWD" .claude/hooks/protect-files.sh; echo "exit=$?"
echo '{"tool_name":"Edit","tool_input":{"file_path":"'"$PWD"'/src/main/resources/db/migration/V1__create_orders.sql"}}' | CLAUDE_PROJECT_DIR="$PWD" .claude/hooks/protect-files.sh; echo "exit=$?"
echo '{"tool_name":"Write","tool_input":{"file_path":"'"$PWD"'/src/main/resources/db/migration/V2__add_paid_at.sql"}}' | CLAUDE_PROJECT_DIR="$PWD" .claude/hooks/protect-files.sh; echo "exit=$?"
echo '{"tool_name":"Edit","tool_input":{"file_path":"'"$PWD"'/pom.xml"}}' | CLAUDE_PROJECT_DIR="$PWD" .claude/hooks/protect-files.sh; echo "exit=$?"
```

**Output:**

```text
Blocked: .env holds secrets. Ask the developer to change it.
exit=2
Blocked: src/main/resources/db/migration/V1__create_orders.sql is an existing Flyway migration. Never change an applied migration; add a new V<n>__description.sql instead.
exit=2
exit=0
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "ask",
    "permissionDecisionReason": "pom.xml changes the build for everyone: review this edit before approving it."
  }
}
exit=0
```

Exit 2 blocks the tool call and shows stderr to Claude; a new migration passes; `pom.xml` gets an `ask` decision.

### Step 3: Dangerous-command guard

`.claude/hooks/block-dangerous-bash.sh`:

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

Tests:

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"git push --force origin main"}}' | .claude/hooks/block-dangerous-bash.sh; echo "exit=$?"
echo '{"tool_name":"Bash","tool_input":{"command":"git push origin feature/pay-endpoint"}}' | .claude/hooks/block-dangerous-bash.sh; echo "exit=$?"
```

**Output:**

```text
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Force-push rewrites shared history. Push normally and let a human decide."
  }
}
exit=0
exit=0
```

Fail-closed check — with `jq` missing from `PATH`, the guard refuses everything:

**Output:**

```text
block-dangerous-bash.sh needs jq: blocking until it is installed.
exit=2
```

### Step 4: Java file check

`.claude/hooks/check-java-file.sh`:

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

Test with a file indented by a tab:

```bash
printf 'class Tabbed {\n\tint x;\n}\n' > Tabbed.java
echo '{"tool_name":"Write","tool_input":{"file_path":"'"$PWD"'/Tabbed.java"}}' | .claude/hooks/check-java-file.sh; echo "exit=$?"
rm Tabbed.java
```

**Output** (absolute path shortened):

```text
…/Tabbed.java contains tab characters: this project indents with 4 spaces.
exit=2
```

A PostToolUse hook can't undo the edit — exit 2 tells Claude about the problem so it fixes it next. Unlike the guards, this check has no `jq` test: without `jq` it lets everything pass, which is acceptable for a style check and not for a security guard.

### Step 5: Register the project hooks

Add to `.claude/settings.json` (keep your Lab 08 permissions):

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

### Step 6: Personal notification hook

Notifications are personal — put this in `~/.claude/settings.json`, not the project. On Windows (from the official hooks guide):

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

macOS: `osascript -e 'display notification "Claude Code needs your attention" with title "Claude Code"'`. Linux: `notify-send 'Claude Code' 'Claude Code needs your attention'`.

### Step 7: Check in a live session

```bash
claude
```

```text
/hooks
```

**Expected result:** the five hooks listed by event. Then ask Claude to "add a comment to V1__create_orders.sql" — **expected:** blocked with your message; Claude proposes a new migration instead.

## Verification

- ☐ Each script passes its piped tests with the exit codes above.
- ☐ `/hooks` lists the hooks.
- ☐ A live attempt to edit V1 is blocked.
- ☐ The notification appears when a permission prompt waits.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Hook never runs | Not executable, wrong path, project not trusted | `chmod +x`; check the path; accept the trust dialog |
| Every edit blocked | `jq` missing (guard fails closed) | Install `jq` |
| `.env` edit not blocked on Windows | Backslash paths | The script converts `\` to `/`; keep that line |
| Exit 1 didn't block | Only exit 2 blocks | Use exit 2 or a JSON `deny` decision |

## Security Notes

- Hooks run with your user's permissions on every matching event. Review hook scripts in repositories you didn't write before trusting the folder.
- Text-matching guards miss other spellings (`git -C . push --force`, scripts). They catch mistakes; server-side protection and sandboxing stop determined misuse.
- Never print secrets from a hook — stdout of some events goes into Claude's context.

## Cleanup

Keep the hooks for Lab 16, or `git restore .claude/settings.json && rm -r .claude/hooks`.

## Completion Checklist

- ☐ Five hooks written, tested outside Claude Code, registered.
- ☐ You can explain exit 0, exit 2 and JSON decisions.
- ☐ You know which hooks fail closed and why.

## Follow-up Challenges

- Add the Stop hook from *Test-Driven Bug Fixes* and test its four cases.
- Extend `block-dangerous-bash.sh` to deny `git reset --hard` and write a test for it.
