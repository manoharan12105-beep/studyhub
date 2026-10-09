# Settings Files, Precedence and Project Trust

**Module:** Permissions, Settings and Safety · **Interview priority:** Core

> [!NOTE]
> **Checked against:** Claude Code v2.1.289, the *Settings files and precedence* and *Configure permissions* pages (October 2026).

## Definition

**Settings** are JSON keys that change how Claude Code behaves — permissions, hooks, environment variables, model, default mode. They live in several files whose **scope** decides who they affect, and **precedence** decides which value wins when the same key is set twice. **Workspace trust** is the decision, made once per folder, to let a repository's own configuration (allow rules, hooks, helper commands, MCP servers) take effect.

## Why It Matters

- "My setting doesn't work" is almost always a scope or precedence problem.
- A repository's `.claude/settings.json` can run hooks — shell commands — on your machine. Trust is the security gate in front of that.
- Organizations enforce policy through managed settings; knowing what you can and cannot override saves time and arguments.

## How It Works

```text
highest ─┐  1. Managed settings      managed-settings.json, MDM, or the claude.ai console (organization)
         │  2. Command line           claude --settings <file-or-json>   (this session only)
         │  3. Project local          .claude/settings.local.json        (you, this project)
         │  4. Shared project         .claude/settings.json              (everyone, committed)
lowest  ─┘  5. User                   ~/.claude/settings.json            (you, every project)
```

- A key at a higher level **overrides** the same key below it.
- **List keys merge** across files (`permissions.allow` from user, project and local are combined). A few model-related keys have their own rules.
- **Deny rules are different:** a deny at any level blocks, whatever the precedence of an allow elsewhere.
- **Environment variables** are not a level; each variable/key pair has its own rule (for example `ANTHROPIC_MODEL` beats the `model` key from any file).
- `~/.claude.json` is a separate file Claude Code writes itself (sign-in, MCP servers, per-project state, trust decisions).

## Settings Files and Who They Affect

| Scope | File | Affects | Typical content |
|-------|------|---------|-----------------|
| User | `~/.claude/settings.json` | You, all projects | Theme, editor mode, personal allow rules, `defaultMode` |
| Shared project | `.claude/settings.json` | Everyone who clones (commit it) | Team permissions, hooks, plugins, env vars |
| Project local | `.claude/settings.local.json` | You, this project | Personal overrides; approvals saved by "don't ask again" |
| Managed | Deployed by IT | Everyone it is deployed to | Security policy, compliance |

Claude Code keeps `.claude/settings.local.json` out of Git when it creates the file (it adds a global git exclude). If you create it by hand, add it to `.gitignore` yourself.

## Changing and Checking Settings

| Task | How |
|------|-----|
| Change common options | `/config` (writes the right file for you); `/config verbose=true` sets one key |
| Edit any key | Edit the JSON file — strict JSON: no comments, no trailing commas |
| One session only | `claude --settings '{"model": "claude-opus-5-5"}'`, or a key's own flag such as `--model` |
| See what loaded | `/status` → **Setting sources** |
| Find rejected keys | `claude doctor` |
| Validate in your editor | `"$schema": "https://json.schemastore.org/claude-code-settings.json"` |

Most edits apply to a running session (the files are watched); a few keys such as `model` and `effortLevel` are read only at start — use `/model` and `/effort` mid-session.

## Project Trust and Untrusted Repositories

The first time you start Claude Code in a folder interactively, it shows the **workspace trust dialog**, listing what the folder's settings would activate. Until you accept:

| What the repository supplies | Before trust (interactive) | In `claude -p` or the SDK |
|------------------------------|----------------------------|---------------------------|
| Hooks in settings files, `env` block, helper commands (`apiKeyHelper` …) | Held back until you accept | **Used** — the folder counts as trusted |
| `permissions.allow` and `additionalDirectories` in `.claude/settings.json` | Not used until you accept | **Not used**; a warning is printed |
| `deny` and `ask` rules | Applied immediately (they only restrict) | Applied |
| Servers in `.mcp.json` | You are asked before each is connected; the repository's own approvals don't count | **Connected without asking** |
| A project skill's `allowed-tools` | Not gated by trust | Not gated by trust |

Key consequences:

- **Accepting trust is accepting code execution.** Hooks are shell commands with your full user permissions.
- **`claude -p` never shows the dialog.** Running a script over a repository you did not write executes its hooks and connects its MCP servers.
- Trust is keyed on the Git repository root (worktrees share the main checkout's decision). In your home directory, trust is held for the session only and never saved.

### Opening a repository you do not trust

1. Read before you run: `.claude/settings.json`, `.claude/settings.local.json` (if tracked), `.claude/hooks/`, `.claude/skills/` (`allowed-tools`!), `.claude/agents/`, `.mcp.json`, `CLAUDE.md`.
2. If you only need to read code, use your editor or a container instead of trusting the folder.
3. For a scripted run, choose what it may load:

```bash
# Skip hooks, skills, plugins, MCP servers, auto memory and CLAUDE.md discovery from the project
claude --bare -p "summarize the architecture" --allowedTools "Read"

# Or keep normal discovery but read only your own settings files
claude -p "summarize the architecture" --setting-sources user

# Or turn hooks off for one run (project settings could otherwise turn them back on)
claude -p "summarize the architecture" --settings '{"disableAllHooks": true}'
```

4. Prefer a disposable container or VM for anything that will build or run the repository's code.

`--bare` mode is documented as the recommended mode for scripted calls; it uses only `ANTHROPIC_API_KEY` or an `apiKeyHelper` passed with `--settings` for authentication.

## Syntax and Configuration

A complete small project file (hooks shown in Module 5):

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": ["Bash(./mvnw test *)"],
    "ask": ["Bash(git push *)"],
    "deny": ["Read(.env)"],
    "defaultMode": "default"
  },
  "env": {
    "SPRING_PROFILES_ACTIVE": "test"
  }
}
```

Personal override in `.claude/settings.local.json`:

```json
{
  "permissions": {
    "allow": ["Bash(./mvnw spring-boot:run)"]
  }
}
```

## Real-World Example

A developer adds `"spinnerTipsEnabled": false` to `~/.claude/settings.json`; the tips still appear in one repository. `/status` shows **Shared project settings** loaded; that file sets the key to `true`. Shared project outranks user, so the developer adds the key to `.claude/settings.local.json` (project local outranks shared project) — teammates are unaffected. Had the organization's managed settings set it, nothing below could override it.

## Step-by-Step Walkthrough

1. Run `/status` and note every settings source listed.
2. Open each file; find which one sets the key you care about.
3. Decide the right scope for your change: team → project; personal → local or user.
4. Edit, save, and re-check `/status`; run `claude doctor` if anything looks rejected.
5. For a new repository, review `.claude/` and `.mcp.json` before accepting trust.

## Common Mistakes

- Editing user settings and expecting them to beat a project file.
- Committing `.claude/settings.local.json` (and with it, someone's personal approvals).
- JSON comments or trailing commas — the whole file is rejected with a settings error.
- Assuming `claude -p` is safe on any repository because "it's read-only" — hooks and MCP servers still run.
- Accepting the trust dialog without reading what it lists.

## Security Considerations

- Managed settings can lock policy that users cannot override (`allowManagedPermissionRulesOnly`, `disableBypassPermissionsMode`, `allowManagedHooksOnly`). For a few security-sensitive keys, a stricter value from a lower level is honoured over a managed one.
- A tracked `.claude/settings.local.json` or a symlinked `.claude` folder is treated as repository-supplied and waits for trust.
- `disableAllHooks` set only in your user settings is not enough for an untrusted repository — project settings take precedence and can set it back. Pass it with `--settings` for that run.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Setting ignored | Higher-precedence file sets it, file not loaded, or key read only at startup | `/status`; check precedence; restart or use the command (`/model`) |
| "Settings Error" at startup | Invalid JSON or rejected value | Fix the JSON; `claude doctor` |
| Committed allow rules don't apply for a teammate | They haven't trusted the folder | They accept the dialog after reviewing |
| `this workspace has not been trusted` in CI logs | `claude -p` in an untrusted folder; project allow rules skipped | Pass permissions with flags or `--settings`; consider `--bare` |

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| Team policy in project settings | Consistent, reviewed in PRs | Must be trusted per developer; can't stop users adding allows locally |
| Managed settings | Enforced organization-wide | Less individual flexibility; needs admin rollout |
| `--bare` for scripts | Reproducible, no repo surprises | You pass every needed setting explicitly |

## Interview Takeaways

- Name the five levels in order and that list keys merge while deny rules always win.
- Explain workspace trust: what it gates, what `-p` skips, and how to run Claude safely on an untrusted repository.
- Show how you debug a setting with `/status` and `claude doctor`.

## Key Takeaways

- Managed > command line > project local > shared project > user.
- Team rules in `.claude/settings.json`, personal in `.claude/settings.local.json`.
- Trust a folder only after reading what it would run; `claude -p` trusts implicitly.
- Use `--bare`, `--setting-sources` or a container for repositories you did not write.
