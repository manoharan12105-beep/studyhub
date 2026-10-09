# Protecting Secrets and Preventing Dangerous Commands

**Module:** Permissions, Settings and Safety · **Interview priority:** Core

> [!NOTE]
> **Checked against:** Claude Code v2.1.289; *Configure permissions*, *Choose a permission mode* and *Configure the sandboxed Bash tool* (October 2026).

## Definition

**Protecting secrets** means keeping credentials — API keys, database passwords, SSH keys, cloud tokens — out of Claude's reach and out of the context window. **Preventing dangerous commands** means making sure commands with destructive or external effects (deleting data, deploying, migrating shared databases, publishing, force-pushing) cannot run without a deliberate human decision. Claude Code offers several layers: deny rules, the Bash **sandbox**, protected and critical paths, hooks, and isolated environments.

## Why It Matters

- Anything Claude reads enters the context, the session transcript and the model provider's request. A secret that was read has, in effect, been copied.
- An agent with shell access can do anything your account can do. Most incidents are not malice but a plausible command run in the wrong place: a migration against staging, `rm -rf` on a variable that was empty, a deploy from a laptop.
- Prompt injection turns "plausible" into "adversarial": text in a README or issue can ask the agent to exfiltrate data.

## How It Works

```text
                 ┌── deny rules ─────────── block reads of secret files, block forbidden commands (text match)
Claude's tools ──┼── protected paths ────── .git, .claude, shell rc files, .mcp.json … never auto-approved
                 ├── critical paths ─────── rm/rmdir on /, ~, the project root … never auto-approved
                 ├── hooks ──────────────── your script inspects the call and can deny it (Module 5)
                 └── Bash sandbox ───────── OS-enforced filesystem + network limits for shell commands
around it all:   container / VM / dev container ─ the outer boundary for untrusted or unattended work
```

No single layer is complete. Deny rules match text; the sandbox covers only shell commands (not file tools, hooks or MCP servers); hooks are only as good as your script; containers limit blast radius but not what happens inside them.

## Keeping Secrets Out of Reach

**1. Deny reads of secret files** (enforced for Claude's file tools, recognized Bash file commands and redirects):

```json
{
  "permissions": {
    "deny": [
      "Read(.env)",
      "Read(.env.*)",
      "Read(!.env.example)",
      "Read(~/.ssh/**)",
      "Read(~/.aws/**)",
      "Read(./config/credentials.json)"
    ]
  }
}
```

A `Read` deny also blocks Edit and Write on the same path. It does **not** stop a command that reads files without naming them (`grep -r password .`) or a program that opens files itself.

**2. Keep secrets out of the repository.** Spring Boot reads environment variables; commit `.env.example` with placeholder values, keep the real `.env` gitignored.

**3. Protect them from shell commands with the sandbox** (macOS, Linux, WSL 2):

```json
{
  "sandbox": {
    "enabled": true,
    "credentials": {
      "files": [
        { "path": "~/.aws/credentials", "mode": "deny" },
        { "path": "~/.ssh", "mode": "deny" }
      ],
      "envVars": [
        { "name": "GITHUB_TOKEN", "mode": "deny" }
      ]
    }
  }
}
```

By default sandboxed commands can **read most of the machine** — including `~/.ssh` — and inherit Claude Code's environment variables. The `credentials` block denies listed files inside the sandbox and unsets listed variables before each sandboxed command.

**4. Never paste secrets into prompts**, and do not ask Claude to print configuration values "to check them". Ask it to compare *names* (`.env.example` vs `application.yml`) and check values yourself.

## The Bash Sandbox

| Aspect | Default when enabled |
|--------|----------------------|
| Turn on | `/sandbox` in a session, or `"sandbox": {"enabled": true}` |
| Platforms | macOS, Linux, WSL 2 — **not native Windows** |
| Writes | Working directory, a per-user temp directory, added directories; protected paths stay write-denied |
| Reads | Most of the machine — restrict with `filesystem.denyRead` or `credentials` |
| Network | No direct route; a local proxy allows only `network.allowedDomains` (empty at first) |
| Covers | Bash, PowerShell and Monitor commands and their child processes |
| Does **not** cover | Read/Edit/Write and WebFetch tools (permission rules govern them), hooks, local MCP servers, status line and helper commands |

**Auto-allow mode** runs sandboxed commands without prompts (deny rules, critical-path `rm` and content-scoped ask rules like `Bash(git push *)` still apply). When a command fails inside the sandbox, Claude may retry it **unsandboxed**, which prompts in Manual and Accept edits mode; `"allowUnsandboxedCommands": false` disables that escape hatch (**strict sandbox mode**).

The docs are explicit about limits: the sandbox "is not a complete isolation boundary". Broad allowed domains such as `github.com` can be paths for exfiltration, and allowing sockets like `/var/run/docker.sock` effectively grants host access.

## Protected and Critical Paths

| Safeguard | What it covers | Behaviour |
|-----------|----------------|-----------|
| **Protected paths** | `.git`, `.claude` (with exceptions), `.vscode`, `.idea`, `.mvn`, `.husky`, `.devcontainer`, shell rc files (`.bashrc`, `.zshrc`, `.profile` …), `.gitconfig`, `.npmrc`, `maven-wrapper.properties`, `gradle-wrapper.properties`, `.mcp.json`, `.claude.json` and others | Writes never auto-approved except in bypass mode; allow rules don't pre-approve them |
| **Critical paths** | `rm`/`rmdir` of the filesystem root, top-level directories, home, the working directory and its parents, and tricky forms like `rm -rf "$DIR"/*` | No allow rule or hook can approve; prompts (or is denied in `dontAsk`) in every mode |

Why protect `.mvn/` and `maven-wrapper.properties`? Changing the wrapper changes which Maven binary every developer downloads and runs — a supply-chain risk.

## Preventing Dangerous Commands

| Action | Risk | Control |
|--------|------|---------|
| Installing dependencies (`pom.xml`, `npm install x`) | Malicious or typo-squatted packages run code on install or at runtime | `ask` on `Edit(/pom.xml)`; review every new dependency |
| Modifying database migrations | Breaks every environment where they ran | `ask` on migration edits + a hook blocking edits to existing files |
| Running migrations against shared databases | Irreversible data changes | Keep shared-database credentials off the machine; deny the command; CI with approval |
| Deleting files | Data loss outside Git | Default prompts; critical-path protection; work on Git-tracked trees |
| Deployment commands | Production outage | Deny locally; deploy only through a pipeline with a human approval gate |
| `git push --force`, history rewrites | Destroys teammates' work | `deny` + server-side branch protection |
| `curl … \| bash` | Executes unknown code | Deny `curl`/`wget` or allow narrowly; sandbox network allowlist |
| Accessing secrets | Credential leak | `Read` denies, sandbox `credentials`, no secrets in the repository |

A useful principle: **the best way to prevent a dangerous command is to make it impossible from this machine** — no production credentials in the developer environment, deploys only from CI.

## Syntax and Configuration

A combined `orderdesk` safety configuration (validated JSON; the sandbox part applies on macOS, Linux and WSL 2):

```json
{
  "permissions": {
    "ask": ["Edit(/pom.xml)", "Edit(/src/main/resources/db/migration/**)", "Bash(git push *)"],
    "deny": ["Read(.env)", "Read(.env.*)", "Read(!.env.example)", "Read(~/.ssh/**)", "Read(~/.aws/**)",
             "Bash(curl *)", "Bash(wget *)", "Bash(git push --force *)", "Bash(./mvnw deploy *)"]
  },
  "sandbox": {
    "enabled": true,
    "network": { "allowedDomains": ["repo.maven.apache.org"] },
    "credentials": {
      "files": [{ "path": "~/.ssh", "mode": "deny" }, { "path": "~/.aws/credentials", "mode": "deny" }]
    }
  }
}
```

## Real-World Example

A developer asks Claude to "debug why the app can't reach the database". Claude proposes `cat .env`. With `Read(.env)` denied, the call is blocked; Claude instead reads `application.yml`, sees `spring.datasource.url` comes from `SPRING_DATASOURCE_URL`, and asks the developer to confirm the variable is set — without the password ever entering the conversation.

## Step-by-Step Walkthrough

1. Inventory secrets: `.env*`, `~/.ssh`, cloud credential files, tokens in environment variables.
2. Add `Read` deny rules for each; commit them in project settings (and user settings for home-directory files).
3. On macOS/Linux/WSL 2, enable the sandbox and add `credentials` entries; keep `allowedDomains` minimal.
4. Put `ask` rules on dependency, migration and push operations; `deny` on deploy and force-push.
5. Add a PreToolUse hook for the patterns rules can't express (Module 5).
6. Keep production credentials off developer machines.

## Common Mistakes

- Relying on "please don't read .env" in `CLAUDE.md`.
- Assuming the sandbox protects files from the Read tool — permission rules do that.
- Allowing broad domains (`*.github.com`) in the sandbox network allowlist "for convenience".
- Approving the unsandboxed retry prompt without reading why the sandbox blocked the command.
- Keeping long-lived production credentials in the shell environment where Claude runs.

## Security Considerations

- Prompt injection is the reason these layers matter: you cannot rely on the model refusing malicious instructions it read.
- A leaked secret must be **revoked and rotated**; deleting it from a file or history does not make it safe.
- Native Windows has no Bash sandbox; use WSL 2, a dev container or a VM when you need OS-level isolation there.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Build fails in the sandbox downloading dependencies | Maven repository host not allowed | Add the host to `network.allowedDomains` (narrowly) |
| `git` over SSH fails in the sandbox | `~/.ssh` denied or SSH host not allowed | Use HTTPS with a credential helper, or exclude the command deliberately |
| Deny rule doesn't stop a read | Read via `grep -r` or a script | Sandbox `denyRead`/`credentials`, or move the secret out of the tree |
| `/sandbox` says settings are overridden | Managed policy controls the sandbox | Ask your administrator |

## Trade-offs

| Control | Strength | Cost |
|---------|----------|------|
| Deny rules | Simple, enforced for file tools | Text-based for Bash |
| Sandbox | OS-enforced for shell commands | Setup; some tools break; not on native Windows |
| Hooks | Arbitrary logic | You maintain the script; can fail open |
| Containers/VMs | Strongest outer boundary | Heavier workflow |
| No credentials on the machine | Removes the risk entirely | Requires CI-based deploys and good tooling |

## Interview Takeaways

- Secrets: deny reads, keep them out of the repository and context, sandbox credentials, rotate if leaked.
- Dangerous commands: ask/deny rules, protected and critical paths, hooks, and — best — remove the capability from the machine.
- Know what the sandbox covers and its documented limits.

## Key Takeaways

- What Claude reads is effectively shared; deny secrets before they are read.
- Layer deny rules, the sandbox, hooks and isolation — each has gaps the others cover.
- Consequential commands need a human decision; production changes go through CI with approval.
- Prefer removing a capability over guarding it.
