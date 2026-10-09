# Modes and Permissions Cheat Sheet

## Permission Modes

| Mode (config value) | Edits | Shell commands | Use for |
|---------------------|-------|----------------|---------|
| `default` (Manual) | Ask | Ask (read-only commands run) | Normal work; learning |
| `acceptEdits` | Auto-accepted in working dirs | Common filesystem commands auto; others ask | Edit-heavy work you review via `git diff` |
| `plan` | No | Read-only exploration | Understanding code, planning |
| `auto` | Classifier reviews | Classifier reviews | Long tasks with fewer prompts (where available) |
| `dontAsk` | Only pre-approved | Only pre-approved | Locked-down scripts/CI |
| `bypassPermissions` | No checks | No checks | Disposable, isolated environments only |

- Switch: **Shift+Tab** in a session; `claude --permission-mode plan`; `"permissions": {"defaultMode": "…"}` in settings.
- Project settings can't set `defaultMode` to `auto` or `bypassPermissions`.
- Not modes: model (`/model`), effort (`/effort`), fast mode (`/fast`), "YOLO" (slang).

## Rule Syntax

| Rule | Matches |
|------|---------|
| `Bash(./mvnw -B verify)` | Exactly that command |
| `Bash(./mvnw test *)` | `./mvnw test` and anything after it |
| `Bash(git log *)` | `git log …` (the trailing ` *` also matches bare `git log`) |
| `Read(.env)`, `Read(.env.*)` | `.env` files (gitignore-style paths) |
| `Read(!.env.example)` | Carves `.env.example` out of earlier rules in the same file |
| `Edit(/pom.xml)` | `pom.xml` at the project root (`/` = settings-relative root) |
| `Read(~/.ssh/**)` | Everything under your SSH directory |
| `mcp__runbook__get_runbook` | One MCP tool |
| `Agent(Explore)` | Delegation to the Explore subagent |
| `WebFetch(domain:github.com)` | Fetches from one domain |

**Evaluation:** deny > ask > allow. Bash rules match command text after splitting compound commands and stripping wrappers — other spellings (`git -C . push`) aren't matched.

## Settings Files and Precedence

| Priority | Source | Shared? |
|----------|--------|---------|
| 1 | Managed settings | Organization-enforced |
| 2 | CLI flags / `--settings` | Session |
| 3 | `.claude/settings.local.json` | No (gitignored) |
| 4 | `.claude/settings.json` | Yes (committed) |
| 5 | `~/.claude/settings.json` | You, all projects |

Arrays (permission rules) merge across files; scalar values take the highest-priority source.

## Safe Starter Settings (project)

```json
{
  "permissions": {
    "allow": ["Bash(./mvnw -B verify)", "Bash(./mvnw -q test *)"],
    "ask": ["Bash(git commit *)", "Bash(git push *)", "Edit(/pom.xml)"],
    "deny": ["Read(.env)", "Read(.env.*)", "Read(!.env.example)", "Read(~/.ssh/**)", "Bash(git push --force *)"]
  }
}
```

## Trust and Headless

- New folder → **workspace trust dialog** before project settings, hooks and MCP servers apply.
- `claude -p` skips the dialog: project hooks and `.mcp.json` servers still load (unless `--bare`); invalid settings files are silently ignored.
- Project skills' `allowed-tools` aren't gated by trust.

## Commands

`/permissions` (view/edit rules) · `/status` · `/config` · `/sandbox` (macOS, Linux, WSL2) · `/doctor`.
