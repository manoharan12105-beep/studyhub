# CLAUDE.md and Rules Cheat Sheet

## Where Instructions Live

| File | Scope | Loads |
|------|-------|-------|
| Managed policy CLAUDE.md | Organization | Always; can't be excluded |
| `~/.claude/CLAUDE.md` | You, all projects | Session start |
| `./CLAUDE.md` or `./.claude/CLAUDE.md` | Project (committed) | Session start |
| `./CLAUDE.local.md` | You, this project (gitignored) | Session start |
| `<subdir>/CLAUDE.md` | That area | When Claude works there |
| `.claude/rules/*.md` (no `paths`) | Project | Session start |
| `.claude/rules/*.md` with `paths:` | Matching files | When Claude reads matching files |
| `AGENTS.md` | Project (other tools' convention) | Supported as project instructions |
| Auto memory `MEMORY.md` | Claude's notes per project | First 200 lines / 25 KB |

Imports: `@docs/conventions.md` inside CLAUDE.md (relative paths; up to 4 hops). Check what loaded: `/memory`, `/context`.

## Path-Scoped Rule

```markdown
---
paths:
  - "src/main/resources/db/migration/**"
---

# Migrations
- Add a new V<n>__description.sql; never edit an applied migration.
- A NOT NULL column on a table with data needs a default or a backfill.
```

## What Belongs in CLAUDE.md

| Include | Leave out |
|---------|-----------|
| Build, test, run commands (exact) | Generic advice ("write clean code") |
| Conventions Claude can't infer (money as `long` cents) | Things Claude already does |
| Project rules (migrations, error codes) | Long procedures → skills |
| Definition of done | Secrets, hostnames, customer data |
| Who commits/pushes | Must-hold rules **only** here → also hooks/permissions |

Target: short (well under ~200 lines), specific, true. Review it in PRs like code.

## Templates

```markdown
## Commands
- Build and run all tests: `./mvnw -B verify`
- One test class: `./mvnw -q test -Dtest=PriceCalculatorTest`

## Definition of done
- `./mvnw -B verify` passes.
- New behaviour and every bug fix have tests.
- The summary lists changed files, tests added, and anything not verified.
- Do not commit or push; the developer does that.
```

## Large Repositories

- Short root file + per-directory files (or path-scoped rules).
- Start Claude in the package you're changing.
- `claudeMdExcludes: ["**/legacy/**"]` for areas you never touch (patterns match absolute paths — start with `**/`).
- Procedures → skills; verbose exploration → subagents.

## Instruction Hygiene

- Remove instructions Claude follows anyway; fix ones it ignores (specific, higher up, no contradictions).
- Contradictions between CLAUDE.md, rules, skills and auto memory → keep each fact in one place.
- After compaction: root CLAUDE.md and unscoped rules reload; scoped rules reload when matching files are read again.
- `/init` drafts a CLAUDE.md — then cut it down and verify every line.
