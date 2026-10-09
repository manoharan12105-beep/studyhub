# What Are Skills? Discovery, Loading and Structure

**Module:** Skills, Slash Commands and Reusable Workflows · **Interview priority:** Core

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 and *Extend Claude with skills* (October 2026). The example skills were validated with `claude plugin validate .claude/skills`; they were not run in a model session.

## Definition

A **skill** is a folder with a `SKILL.md` file: YAML **frontmatter** that says what the skill is for and how it may be invoked, followed by Markdown **instructions** Claude follows when the skill runs. You invoke a skill with `/skill-name`, or Claude loads it automatically when your request matches its description. Skills follow the open **Agent Skills** standard, with Claude Code extensions such as invocation control, subagent execution and dynamic context.

## Why It Matters

- Skills capture procedures you would otherwise paste again and again — a review checklist, a release check, a debugging playbook.
- Unlike `CLAUDE.md`, a skill's **body loads only when used**, so long procedures cost almost nothing until needed.
- **Custom commands have been merged into skills**: a file at `.claude/commands/deploy.md` and a skill at `.claude/skills/deploy/SKILL.md` both create `/deploy`. Knowing the difference avoids confusion with older tutorials.

## How It Works

```text
session start ──► skill LISTING loads: names + descriptions (+ when_to_use), capped per entry
                     │
you type /java-review ───────────┐
or Claude matches a description ─┴─► SKILL.md body is rendered:
                                       • $ARGUMENTS substituted
                                       • !`commands` run, output inserted
                                     ──► enters the conversation as one message and STAYS there
                                     ──► allowed-tools pre-approved for that turn only
```

| Stage | What is in context |
|-------|--------------------|
| Before use | Name and description in the skill listing (unless the skill is hidden from Claude) |
| On invocation | The full rendered `SKILL.md` content |
| Later turns | The content stays; Claude Code does not re-read the file |
| After compaction | The latest invocation of each skill is re-attached: first 5,000 tokens per skill, 25,000 tokens in total, newest first |

## How Skills Are Discovered and Loaded

| Location | Path | Loads in |
|----------|------|----------|
| Enterprise | `.claude/skills/<name>/SKILL.md` in the managed settings directory | Every user the organization deploys to |
| Personal | `~/.claude/skills/<name>/SKILL.md` | All your projects on this machine |
| Project | `.claude/skills/<name>/SKILL.md` | This repository (commit it for the team) |
| Nested | `<subdir>/.claude/skills/<name>/SKILL.md` | Sessions in that subdirectory; loaded once Claude works on files there |
| Plugin | `<plugin>/skills/<name>/SKILL.md` | Wherever the plugin is enabled, as `/plugin-name:skill-name` |
| claude.ai account | Skills enabled for your account | Cowork, cloud and signed-in terminal sessions |

When two skills share a name, priority is **managed > user > project** for skills; plugin skills are namespaced so they don't collide. Skills added or edited during a session are detected (or reload them with `/reload-skills`).

## Skill Structure and Metadata

```markdown
---
name: java-review
description: Reviews the uncommitted Java changes in orderdesk for correctness, tests, security and scope. Use when the user asks to review changes, a diff or work before committing.
allowed-tools: Bash(git status *) Bash(git diff *)
---

## Current changes
...
```

The most-used frontmatter fields (all optional; `description` is recommended):

| Field | Effect |
|-------|--------|
| `name` | Command name; defaults to the directory name |
| `description` | What it does and when to use it — Claude matches requests against this |
| `when_to_use` | Extra trigger phrases, appended to the description (both share a 1,536-character cap in the listing) |
| `argument-hint` | Autocomplete hint such as `[issue-number]` |
| `arguments` | Named positional arguments for `$name` placeholders |
| `disable-model-invocation` | `true`: only you can invoke it; its description is not in Claude's context |
| `user-invocable` | `false`: hidden from the `/` menu; only Claude can invoke it |
| `allowed-tools` | Tools pre-approved during the turn that invokes the skill |
| `disallowed-tools` | Tools removed while the skill is active |
| `model`, `effort` | Override for the rest of the turn |
| `context: fork`, `agent` | Run the skill in a subagent |
| `paths` | Glob patterns; Claude loads the skill automatically only for matching files |
| `hooks` | Hooks registered when the skill is invoked |

A field name must match exactly (hyphens included); unknown fields are silently ignored. If the YAML doesn't parse, the skill loads with **no** metadata — `claude plugin validate .claude/skills` (v2.1.233+) catches that. Keep `SKILL.md` under about 500 lines and move long reference material into supporting files in the same folder.

## Reusable Commands and Their Relationship to Skills

| | `.claude/commands/<name>.md` (older) | `.claude/skills/<name>/SKILL.md` |
|---|---|---|
| Creates `/<name>` | Yes | Yes |
| Frontmatter | Same fields except `name` and `paths` | All fields |
| Supporting files | No folder | Yes — scripts, references, examples |
| Status | Still works | Recommended for new work |

Subdirectories namespace commands: `.claude/commands/frontend/component.md` becomes `/frontend:component`. **Built-in commands** such as `/compact`, `/clear` and `/permissions` are part of Claude Code and are not skills; **bundled skills** such as `/code-review`, `/debug`, `/simplify`, `/verify`, `/run`, `/loop` and `/claude-api` ship with Claude Code but are prompt-based skills that orchestrate tools. So "slash command" and "skill" are not interchangeable: every skill can be a slash command, but not every slash command is a skill.

## Skills vs Other Instruction Mechanisms

| | CLAUDE.md | `.claude/rules/` | Skill |
|---|---|---|---|
| Loads | Every session | Every session, or for matching paths | Listing always; body on demand |
| Best for | "Always" facts and rules | Area-specific conventions | Procedures, playbooks, reference material |
| Can be invoked | No | No | Yes, `/name` |

## Real-World Example

The orderdesk team kept pasting the same eight-line review checklist. As a `java-review` skill it now pulls the live `git diff`, applies the checklist and reports **Must fix / Should fix / Question**. The checklist costs nothing until someone asks for a review, and everyone gets the same checks.

## Step-by-Step Walkthrough

1. `mkdir -p .claude/skills/java-review` and write `SKILL.md` with a precise `description`.
2. `claude plugin validate .claude/skills` — the frontmatter must parse.
3. In a session, ask "what skills are available?" or open `/skills`.
4. Invoke `/java-review`; then try a natural request ("review my changes") to see automatic loading.
5. Commit the skill for the team.

## Common Mistakes

- Vague descriptions ("helps with code") — the skill never triggers, or triggers on everything.
- Expecting edits to `SKILL.md` to affect a skill already invoked in this session — the content in context doesn't change; invoke it again.
- Putting must-hold rules only in a skill — Claude can stop following it; use a hook.
- Huge `SKILL.md` files that are truncated after compaction — important instructions first.

## Security Considerations

- A project skill's `allowed-tools` **is not gated by workspace trust** — even in a `-p` run in an untrusted folder. Review `allowed-tools` in skills from repositories you didn't write.
- Injected `` !`command` `` lines run shell commands while the skill renders; review them like scripts. `disableSkillShellExecution` can turn this off (bundled and managed skills are unaffected).
- Skills synced from your claude.ai account never run injected shell commands on your machine.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Skill never triggers | Description lacks the words users say; YAML didn't parse | Rewrite the description; `claude plugin validate` |
| Skill triggers too often | Description too broad | Narrow it, or `disable-model-invocation: true` |
| `/name` not in the menu | Nested skill not loaded yet, `user-invocable: false`, or turned off | Work in that directory, `/add-dir`, check `/skills` |
| Description cut short | Many skills; the listing has a budget | Put the key use case first; `/skill-doctor` to remove unused skills |

## Trade-offs

| Benefit | Cost |
|---------|------|
| Reusable, shareable procedures | Descriptions use context every session |
| Loads detail only when needed | Not deterministic — Claude interprets it |
| Can run in a subagent or with pre-approved tools | `allowed-tools` widens what runs without prompts |

## Interview Takeaways

- A skill = `SKILL.md` with frontmatter + instructions; listing always loaded, body on demand.
- Custom commands were merged into skills; built-in commands and bundled skills are different things.
- Know the key fields: `description`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `context: fork`, `paths`.

## Key Takeaways

- Put procedures in skills, facts in CLAUDE.md, enforcement in hooks and settings.
- The description decides when a skill is used — write it like a search query.
- Skill content stays in context once invoked and is re-attached after compaction within a budget.
- Validate frontmatter; review `allowed-tools` and injected commands like code.
