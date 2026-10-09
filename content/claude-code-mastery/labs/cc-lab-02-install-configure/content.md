# Lab 02: Install and Configure Claude Code

**Lab:** 02 · **Module:** Foundations · **Difficulty:** Beginner · **Verification:** Partially tested — `claude --version` and the settings-schema validation ran (Claude Code v2.1.289 on Windows); installation commands and sign-in were not re-run for this lab.

## Objective

Install Claude Code, confirm the version, sign in, check the setup, and create a small, safe **user settings** file.

## Prerequisites

- A terminal: macOS/Linux shell, WSL, Git Bash or PowerShell on Windows.
- A Claude subscription (Pro, Max, Team, Enterprise) or a Claude Console account with API access.

## Scenario

You're setting up a laptop for the labs. You want a working install and personal defaults that make Claude Code safer, not looser.

## Starting State

No Claude Code installed, or an older version.

## Instructions

### Step 1: Install

Follow the current official instructions at code.claude.com/docs (Setup). The native installer is the documented default:

```bash
# macOS, Linux, WSL
curl -fsSL https://claude.ai/install.sh | bash
```

```powershell
# Windows PowerShell
irm https://claude.ai/install.ps1 | iex
```

> [!CAUTION]
> Piping a script from the internet into a shell runs it with your permissions. Only do it for the official URL from the documentation, typed or copied from there — never from a blog post or chat message.

**Expected result:** the installer reports success and `claude` is on your `PATH` (open a new terminal if not).

### Step 2: Check the version

```bash
claude --version
```

**Output** (the version used to write this subject):

```text
2.1.289 (Claude Code)
```

Yours may be newer. Features in this subject marked with a version need at least that version.

### Step 3: Sign in

```bash
claude
```

**Expected result:** on first start, Claude Code opens a sign-in flow in the browser. Afterwards, run `/status` inside the session to see the account, model and version. Exit with `/exit`.

### Step 4: Check the installation

Inside a session:

```text
/doctor
```

**Expected result:** a setup checkup listing problems with installation, settings or CLAUDE.md, with proposed fixes it applies only after you confirm.

### Step 5: Create user settings

Create `~/.claude/settings.json` (merge with it if it exists):

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "defaultMode": "default",
    "deny": [
      "Read(~/.ssh/**)",
      "Read(~/.aws/**)",
      "Read(./.env)",
      "Read(./.env.*)"
    ]
  }
}
```

- `defaultMode: "default"` starts sessions in Manual mode (prompts before edits and commands) rather than the built-in start mode, which can be auto mode in recent versions.
- The deny rules keep SSH keys, cloud credentials and `.env` files out of every session.
- `$schema` lets your editor validate the file.

Validating this file against the schemastore schema (Ajv) reported:

**Output:**

```text
valid   settings.json
```

### Step 6: Confirm what loaded

Start `claude` in the orderdesk folder and run:

```text
/permissions
```

**Expected result:** your deny rules appear, attributed to user settings.

## Verification

- ☐ `claude --version` prints a version.
- ☐ `/status` shows your account.
- ☐ `/doctor` reports no blocking problems (or you fixed them).
- ☐ `/permissions` lists the user deny rules.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `claude: command not found` | `PATH` not updated | Open a new terminal; check the installer's message |
| Sign-in loops or fails | Browser blocked, proxy, wrong account | Follow `/status` and the documentation's authentication troubleshooting |
| Settings ignored | Invalid JSON (trailing comma) | Validate; in `-p` mode invalid files are silently ignored |
| Rules missing in `/permissions` | Edited a different file than the one loaded | Check the path (`~/.claude/settings.json`) |

## Security Notes

- Never put API keys in `settings.json` or CLAUDE.md. If you use an API key, set `ANTHROPIC_API_KEY` in your environment or a secret manager.
- User-level deny rules protect every project on the machine.
- Don't set `defaultMode` to `bypassPermissions` on your workstation.

## Cleanup

Keep the settings file — later labs build on it.

## Completion Checklist

- ☐ Installed and signed in.
- ☐ User settings created and validated.
- ☐ You know where to check the version, status and configuration.

## Follow-up Challenges

- Run `claude --help` and find the flags for permission mode, model and print mode.
- Add `"model"` to your settings and confirm with `/status` that new sessions use it.
