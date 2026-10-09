# Skills and Reusable Workflows

## Anatomy

```markdown
---
name: java-review
description: Reviews the uncommitted Java changes in orderdesk for correctness, tests, security and scope. Use when the user asks to review changes, a diff or work before committing.
allowed-tools: Bash(git status *) Bash(git diff *)
---

## Current changes

!`git status --short`

!`git diff HEAD`

## Review the changes above
…
```

## Locations

| Location | Scope |
|----------|-------|
| `.claude/skills/<name>/SKILL.md` | Project (commit it) |
| `~/.claude/skills/<name>/SKILL.md` | You, all projects |
| `<subdir>/.claude/skills/` | Loaded when working there |
| Plugin `skills/` | `/plugin:skill` |
| Managed | Organization |

Same name: managed > user > project. `.claude/commands/<name>.md` still works (commands merged into skills).

## Frontmatter

| Field | Effect |
|-------|--------|
| `description` | What Claude matches; key use case first (description + `when_to_use` capped at 1,536 chars) |
| `argument-hint`, `arguments` | Autocomplete hint; named `$name` arguments |
| `disable-model-invocation: true` | Manual only; description hidden from Claude |
| `user-invocable: false` | Hidden from `/` menu; Claude-only |
| `allowed-tools` | Pre-approved for the invoking turn only; not trust-gated |
| `disallowed-tools` | Removed while active |
| `paths` | Auto-load only for matching files |
| `context: fork` + `agent` | Run in a subagent (no conversation history) |
| `model`, `effort`, `hooks` | Per-skill overrides |

## Placeholders and Injection

- `$ARGUMENTS` (all), `$ARGUMENTS[0]` / `$0` (positional, shell quoting), `$name` (named), `${CLAUDE_SKILL_DIR}`, `${CLAUDE_PROJECT_DIR}`, `${CLAUDE_SESSION_ID}`.
- `` !`command` `` runs **before** Claude sees the skill; output replaces it. A failing command aborts the skill (`|| true` to tolerate); outside auto mode, a command not allowed aborts it — pre-approve with `allowed-tools`.

## Workflow Skills That Work

| Skill | Must require |
|-------|--------------|
| Code review | Injected diff; `file:line`; Must fix / Should fix / Question; no edits |
| Bug investigation | Reproduce with a failing test first; one hypothesis + evidence; stop if unclear |
| SQL review | `?` parameters; ORDER BY; new migrations only (`paths` on migrations and DAOs) |
| Regression test | Assert specified behaviour; show it failing for the right reason; no production changes |
| Docs update | Only what the code shows; limited sections; manual-only |
| Pre-release check | PASS / FAIL / NOT CHECKED with evidence; GO only if all PASS; never tag/push/deploy; manual-only |

## Commands

`/skills` (list, `t` sort by tokens, Space cycles visibility) · `/skill-doctor` (cost + usage, v2.1.252+) · `/reload-skills` · `claude plugin validate .claude/skills` (frontmatter, v2.1.233+) · `/context`.

## Evaluating

- Measure triggering **and** usefulness, with and without the skill, in **fresh** sessions; include should-not-trigger prompts.
- `skillOverrides: { "name": "off" }` for a baseline (project/personal skills); `claude plugin eval` for plugin skills (real model runs, costs usage).
- Retire unused skills; keep skills in sync with renamed classes and commands.

## Bundled vs Built-in

Built-in commands (`/compact`, `/clear`, `/permissions`) are part of Claude Code. Bundled skills (`/code-review`, `/simplify`, `/debug`, `/verify`, `/run`, `/loop`) ship with it but are prompt-based skills. Not every slash command is a skill.
