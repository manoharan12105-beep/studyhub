# Permission Fundamentals: Allow, Ask and Deny

**Module:** Permissions, Settings and Safety · **Interview priority:** Core

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 and the *Configure permissions* page (October 2026).

## Definition

**Permission rules** tell Claude Code, tool by tool, what may run **without asking** (`allow`), what must **always ask** (`ask`) and what must **never run** (`deny`). They are evaluated by Claude Code — not by the model — before every tool call, on top of the session's permission mode.

## Why It Matters

- Rules are how you get fewer prompts *without* giving up control: pre-approve your test command, keep pushes behind a prompt, block secrets entirely.
- They are the enforceable form of what people try (and fail) to do with `CLAUDE.md` sentences.
- They have sharp edges. A Bash rule matches command **text**, not intent; knowing what a rule does *not* cover is part of using it safely.

## How It Works

```text
tool call ─► deny rules? ── match ──► BLOCKED (in every mode)
                 │ no
                 ▼
             ask rules?  ── match ──► PROMPT (denied in dontAsk mode)
                 │ no
                 ▼
             allow rules? ─ match ──► RUN without prompting
                 │ no
                 ▼
             permission mode decides (Manual: prompt; Accept edits: edits run; Auto: classifier …)
```

- Order is **deny → ask → allow**; the first match wins and specificity does not change the order. A broad `deny` beats a narrow `allow`; an `ask` beats an `allow` for the same call.
- A deny on a **bare tool name** (`"Bash"`, `"WebFetch"`) removes the tool from Claude's context entirely; a scoped deny (`Bash(rm *)`) leaves the tool and blocks matching calls.
- Rules from all settings files are **combined**. A deny at any level (user, project, local, managed, or `--disallowedTools`) cannot be overridden by an allow elsewhere.

In Manual mode, by default:

| Tool type | Needs approval? | "Yes, and don't ask again" lasts |
|-----------|-----------------|----------------------------------|
| Read-only (Read, Grep, Glob) | No, inside the working directories | — |
| Bash | Yes, except a built-in read-only set | Permanently, per repository and command (saved to `.claude/settings.local.json`) |
| File modification (Edit, Write) | Yes | Until the session ends |
| WebFetch | Yes, except preapproved documentation domains | Permanently, per repository and domain |
| WebSearch | Yes | Permanently, per repository |

## Allow, Ask and Deny Concepts

| List | Use for | orderdesk example |
|------|---------|-------------------|
| `allow` | Routine, low-risk actions you would always approve | `Bash(./mvnw test *)` |
| `ask` | Actions you want to see every time, even in auto mode | `Bash(git push *)`, edits to `pom.xml` |
| `deny` | Actions that must never happen through Claude | `Read(.env)`, `Bash(./mvnw deploy *)` |

## Rule Syntax

A rule is `Tool` or `Tool(specifier)`:

| Rule | Matches |
|------|---------|
| `Bash` or `Bash(*)` | Every Bash command |
| `Bash(./mvnw -B verify)` | Exactly that command |
| `Bash(./mvnw test *)` | `./mvnw test`, `./mvnw test -Dtest=X` (a trailing ` *` also matches the bare command) |
| `Read(.env)` | Any `.env` at or below the current directory (bare filenames match at any depth) |
| `Edit(/src/main/resources/db/migration/**)` | Migrations, anchored at the project root when written in project settings |
| `WebFetch(domain:docs.spring.io)` | Fetches to that host |
| `mcp__github` or `mcp__github__*` | Every tool from the MCP server named `github` |
| `mcp__github__get_issue` | One MCP tool |
| `Agent(Explore)` | The built-in Explore subagent |

## Read and Write Permissions

`Read(...)` and `Edit(...)` rules use **gitignore-style** patterns with four anchors:

| Pattern | Meaning | Example |
|---------|---------|---------|
| `//path` | Absolute from the filesystem root | `Read(//etc/**)` |
| `~/path` | From your home directory | `Read(~/.ssh/**)` |
| `/path` | Relative to the **settings source** (project root for project settings; `~/.claude/` for user settings!) | `Edit(/pom.xml)` |
| `path`, `./path` | Relative to the current directory | `Read(src/**)` |

Facts that surprise people:

- `Edit(...)` rules cover all built-in editing tools. Write path rules as `Edit(...)` — a `Write(path)` rule is accepted but never consulted (Claude Code warns at startup).
- A `Read` deny rule also blocks Edit and Write on that path.
- In **user** settings, `Read(/secrets/**)` means `~/.claude/secrets/**`, not your project. Use `//` or `~/` there.
- Deny/ask patterns with a single directory segment (`Read(secrets/**)`) match that directory at **any depth**; the same pattern as an allow rule matches only at the current directory.
- `Read` and `Edit` rules also apply to file commands Claude Code recognizes in Bash (`cat`, `head`, `tail`, `sed`, `tee`) and to redirect targets (`> file`), but **not** to a command that reads files without naming them (`grep -r pattern .`) or to a script that opens files itself. For OS-level enforcement, use the sandbox.

## Shell Command Permissions

Bash rules match the **command text** after Claude Code splits compound commands and strips simple wrappers:

| Behaviour | Detail |
|-----------|--------|
| Compound commands | `&&`, `\|\|`, `;`, `\|`, newlines split a command; an allow rule must match **each** part. Deny and ask rules apply if **any** part (even inside `$( )`) matches |
| Wrappers stripped | `timeout`, `time`, `nice`, `nohup`, `stdbuf`, plain `xargs` — so `Bash(./mvnw test *)` also matches `timeout 600 ./mvnw test` |
| Wildcard position | Put `*` after the subcommand: `Bash(git log *)` allows only `git log`; `Bash(git *)` allows every git command |
| Read-only set | `ls`, `cat`, `grep`, `find`, `wc`, `diff`, read-only `git` forms and similar run without prompts (not configurable; add ask/deny to change) |

**What a Bash rule does not match** (from the docs):

| Rule | Stops | Does not stop |
|------|-------|---------------|
| `Bash(curl *)` | `curl https://example.com` | `/usr/bin/curl …`, `sh -c 'curl …'` |
| `Bash(git push *)` | `git push origin main` | `git -C . push origin main`, `git 'push' origin main` |

So a Bash deny rule is a **guardrail for what Claude usually types**, not a security boundary around a program. For a boundary, use the sandbox (filesystem and network), a PreToolUse hook that inspects the command, or both.

## Tool and MCP Permissions

- MCP tools are named `mcp__<server>__<tool>`. `"deny": ["mcp__*"]` removes every MCP tool; allow rules for MCP must name a server: `mcp__runbook__*`.
- Deny and ask rules can match a top-level tool **parameter**: `Agent(model:opus)`, `Bash(run_in_background:true)`. (Not the primary field: write `Bash(rm *)`, not `Bash(command:rm *)`.)
- Some MCP tools are marked as requiring user interaction; they prompt even when allowed.

## Syntax and Configuration

Rules live under `permissions` in any settings file; `/permissions` shows them with the file each comes from, and you can add or remove rules there.

The `orderdesk` team policy (used in [Lab 08](../../labs/cc-lab-08-safe-permissions/content.md)) — validated JSON; the rules were not exercised in a live model session:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(./mvnw -B verify)",
      "Bash(./mvnw test *)",
      "Bash(./mvnw -q test *)"
    ],
    "ask": [
      "Bash(git commit *)",
      "Bash(git push *)",
      "Edit(/pom.xml)",
      "Edit(/src/main/resources/db/migration/**)"
    ],
    "deny": [
      "Read(.env)",
      "Read(.env.*)",
      "Read(!.env.example)",
      "Read(~/.ssh/**)",
      "Read(~/.aws/**)",
      "Bash(curl *)",
      "Bash(wget *)",
      "Bash(git push --force *)",
      "Bash(./mvnw deploy *)"
    ]
  }
}
```

`Read(!.env.example)` is a gitignore-style negation: it carves `.env.example` out of the `.env.*` deny rule listed before it in the same file.

**Command-line equivalents for one session:** `--allowedTools "Bash(./mvnw test *)" "Read"` and `--disallowedTools "Bash(curl *)"`.

## Real-World Example — Common Actions

| Action on orderdesk | Recommended rule | Why |
|---------------------|------------------|-----|
| Reading source files | None needed | Reads in the working directory don't prompt |
| Editing Java files | None (prompt) or Accept edits mode | Review the diff |
| Running unit tests | `allow: Bash(./mvnw test *)` | Routine and local |
| Installing dependencies (`pom.xml` change) | `ask: Edit(/pom.xml)` | Supply-chain risk; a human checks every new dependency |
| Modifying database migrations | `ask: Edit(/src/main/resources/db/migration/**)` + a hook that blocks editing existing files | Applied migrations must never change |
| Deleting files | Prompt (default); critical paths are protected anyway | Deletes are hard to undo outside Git |
| Running deployment commands | `deny: Bash(./mvnw deploy *)` and CI-only deploys | Deployment is a human-approved pipeline step |
| Accessing secrets | `deny: Read(.env)`, `Read(~/.aws/**)`, `Read(~/.ssh/**)` | Secrets must never enter the context |

## Step-by-Step Walkthrough

1. Open `/permissions` and look at existing rules and their sources.
2. Add allow rules only for exact, routine commands you have read.
3. Add ask rules for anything with external or hard-to-undo effects.
4. Add deny rules for secrets and forbidden operations; remember they do not stop every spelling of a command.
5. Commit team rules in `.claude/settings.json`; keep personal ones in `.claude/settings.local.json`.
6. Watch the startup warnings — they flag rules that match nothing or are never consulted.

## Common Mistakes

- `"allow": ["Bash"]` "to stop the prompts" — that allows every command.
- `Bash(git * main)` — the `*` before the subcommand allows `git push origin main` too (Claude Code warns).
- Expecting `Bash(curl *)` to block all network access.
- Writing `Write(docs/**)` instead of `Edit(docs/**)`.
- Using `/secrets/**` in user settings and protecting the wrong directory.
- Approving "don't ask again" for a long compound command without reading every part.

## Security Considerations

- Permission rules are enforced by Claude Code, but Bash rules match text. Combine deny rules with the sandbox (network and filesystem isolation) and hooks for anything critical.
- Allowing `WebFetch` alone doesn't prevent network access if Bash is allowed — `curl` reaches any URL.
- A repository's committed allow rules apply only after you accept workspace trust (next lesson). Deny and ask rules apply immediately because they only restrict.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| A command still prompts despite an allow rule | Rule text does not match (extra flag, different order), or a compound part is unmatched | Write the exact form; check each part |
| A deny rule "doesn't work" | Command spelled differently (`/usr/bin/curl`, `sh -c`) | Add a hook or the sandbox |
| Startup warning about a rule | Typo in tool name, `Write(...)` path rule, wildcard before subcommand | Fix as the warning suggests |
| Project allow rules ignored | Folder not trusted | Accept the trust dialog after reviewing the rules |

## Trade-offs

| Approach | Prompts | Risk |
|----------|---------|------|
| No rules, Manual mode | Many | Prompt fatigue → blind approval |
| Narrow allowlist + ask for risky + deny secrets | Few | Low, if reviewed |
| Broad allow (`Bash`) | None | High — any command |

## Interview Takeaways

- Evaluation order deny → ask → allow, first match wins; deny anywhere beats allow everywhere.
- Rule syntax for Bash, Read/Edit (gitignore anchors), WebFetch, MCP and Agent.
- The limits of Bash rules and how the sandbox and hooks complement them.

## Key Takeaways

- Allow the routine, ask for the consequential, deny the forbidden.
- Rules are enforced by Claude Code; instructions are not.
- Bash rules match command text — pair them with hooks and the sandbox.
- Keep team rules in the project's settings, personal ones in local settings.
