# Imports and Scoped Rules

**Module:** Project Instructions, Rules and Memory · **Interview priority:** Frequently asked

## Definition

**Imports** let a `CLAUDE.md` pull other files into context with `@path/to/file`. **Rules** are Markdown files in `.claude/rules/` that split instructions into topics; a rule with **`paths` frontmatter** is **path-scoped** — it loads only when Claude works with files that match its glob patterns.

## Why It Matters

- Imports organize a long instruction set but do **not** save context: imported files load at launch with the file that imports them.
- Path-scoped rules **do** save context: database rules load only when Claude touches migrations; frontend rules only for `web/`.
- In large repositories and monorepos, scoping is the difference between a focused session and one that drags every team's rules along.

## How It Works

```text
CLAUDE.md ──@docs/testing.md──► loaded at launch together (organization only)

.claude/rules/
├── code-style.md            no paths:  → loaded at launch, like CLAUDE.md
├── migrations.md            paths: src/main/resources/db/**  → loaded when Claude reads,
└── web/components.md        paths: web/**/*.tsx                 writes or edits a match
```

A path-scoped rule loads when Claude uses the Read, Write or Edit tool on a matching file — or views one with a Bash command that counts as a read, such as `cat` on a single file.

## Importing Additional Files

```markdown
See @README.md for an overview.

# Additional instructions
- Testing guide @docs/testing.md
- Personal setup @~/.claude/orderdesk-personal.md
```

| Rule | Detail |
|------|--------|
| Path resolution | Relative to the file containing the import, not the working directory |
| Depth | Imports can import, up to four hops |
| Spaces in paths | Escape each space with a backslash: `@Design\ Docs/api.md`; quoted paths are not imported |
| Code spans | `` `@README` `` in backticks stays literal; imports are skipped inside code spans and fenced blocks |
| External files | An import resolving outside the working directory shows an approval dialog the first time in a project; if you decline, those imports stay disabled |
| Context cost | Same as writing the text inline — imports organize, they do not shrink |

A useful pattern for teams using several tools: `@AGENTS.md` at the top of `CLAUDE.md`, then Claude-specific lines below.

## Rules and Scoped Instructions

Create one Markdown file per topic in `.claude/rules/` (subdirectories are discovered recursively):

```markdown
---
paths:
  - "src/main/resources/db/migration/**"
---

# Migration rules

- Never edit an existing migration file; add `V<n>__<description>.sql` with the next number.
- Migrations must work on PostgreSQL as well as H2 (tests use H2).
- A migration that drops or renames a column needs a two-step plan; ask before writing it.
```

| Field | Meaning |
|-------|---------|
| `paths` | The only frontmatter field Claude Code reads from a rule: glob patterns, as a YAML list or comma-separated string. Other fields are ignored |
| No `paths` | The rule loads at launch with the same priority as `.claude/CLAUDE.md` |
| Invalid YAML | The frontmatter is ignored and the rule loads as if it had no `paths` (`claude --debug` shows the parse error) |

Glob examples:

| Pattern | Matches |
|---------|---------|
| `src/main/java/**/*Controller.java` | Every controller |
| `src/test/**/*.java` | All test sources |
| `**/*.sql` | SQL anywhere |
| `src/**/*.{java,kt}` | Java and Kotlin (brace expansion) |

**User-level rules** in `~/.claude/rules/` apply to every project on your machine and load before project rules. Neither set overrides the other — keep them consistent.

## Excluding Other Teams' Files in a Monorepo

Claude loads `CLAUDE.md` files from every directory above where you start. In a monorepo that can include rules for code you never touch. Exclude them locally:

```json
{
  "claudeMdExcludes": [
    "**/monorepo/CLAUDE.md",
    "/home/user/monorepo/other-team/.claude/rules/**"
  ]
}
```

Put this in `.claude/settings.local.json` so the exclusion stays personal. Patterns match absolute paths; arrays merge across settings layers. Managed policy `CLAUDE.md` files cannot be excluded.

## Syntax and Configuration

| What | Where |
|------|-------|
| Imports | `@relative/path`, `@/absolute/path`, `@~/home/path` inside any `CLAUDE.md` |
| Project rules | `.claude/rules/**/*.md` |
| User rules | `~/.claude/rules/**/*.md` |
| Shared rules across projects | Symlinks in `.claude/rules/` (an external target needs the same approval as external imports) |
| Skip a file | `claudeMdExcludes` in settings |

## Real-World Example

`orderdesk` grows a React admin UI in `web/` and a reporting job in `reports/`. Instead of one 400-line `CLAUDE.md`:

- `CLAUDE.md` keeps commands, the definition of done and global rules (~45 lines).
- `.claude/rules/migrations.md` with `paths: src/main/resources/db/migration/**`.
- `.claude/rules/web.md` with `paths: web/**`.
- `.claude/rules/reports.md` with `paths: reports/**`.

A backend bug-fix session now loads only the backend rules; the migration rules appear the moment Claude opens a migration file.

## Step-by-Step Walkthrough

1. List the sections of your current `CLAUDE.md` and mark which apply to all work and which to one area.
2. Move each area section into `.claude/rules/<area>.md` with a `paths` list.
3. Keep global rules in `CLAUDE.md` (or unscoped rule files).
4. Start a session, open a matching file, and confirm the rule loaded (an `InstructionsLoaded` hook can log loads; `/context` shows memory files).
5. Remove anything now duplicated between files.

## Common Mistakes

- Splitting `CLAUDE.md` into imports and expecting context savings.
- A rule that must survive compaction placed under `paths:` — after compaction it reloads only when a matching file is touched again.
- Using `"src/**"` when you meant only migrations — the rule loads for every source file.
- Quoting import paths that contain spaces (they are not imported).
- Forgetting that user rules apply to every project, including client code with different conventions.

## Security Considerations

- External imports and symlinked rules from a repository trigger an approval dialog for a reason: a committed `CLAUDE.md` could otherwise pull any file on your machine into context. Decline unexpected ones.
- Rules are guidance. "Never edit migrations" in a rule is weaker than a PreToolUse hook that blocks it.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Scoped rule never appears | Glob does not match, or YAML invalid | Test the pattern; `claude --debug` for parse errors |
| Scoped rule gone after compaction | Reloads only on a new matching file access | Make it unscoped if it must persist |
| Import not loaded | Path relative to the wrong file, quoted path, or declined external import | Fix the path; re-check the approval |
| Other teams' rules appear | Ancestor `CLAUDE.md` files | `claudeMdExcludes` in local settings |

## Trade-offs

| Approach | Context cost | Reliability |
|----------|--------------|-------------|
| Everything in `CLAUDE.md` | Highest, every session | Always present (until diluted) |
| Imports | Same as inline | Always present; easier to maintain |
| Path-scoped rules | Paid only when relevant | Missing until a matching file is touched |
| Skills (Module 7) | Description only until invoked | Loaded on demand by relevance or `/name` |

## Interview Takeaways

- Imports organize but do not reduce context; path-scoped rules reduce context.
- Rules live in `.claude/rules/`, with `paths` as the only frontmatter field.
- Monorepo hygiene: `claudeMdExcludes`, scoped rules, and starting sessions in the package you work on.

## Key Takeaways

- `@path` imports pull files in at launch — same cost as inline text.
- `.claude/rules/*.md` without `paths` load at launch; with `paths`, only for matching files.
- User rules apply everywhere; keep them consistent with project rules.
- Exclude irrelevant ancestor files in monorepos with `claudeMdExcludes`.
