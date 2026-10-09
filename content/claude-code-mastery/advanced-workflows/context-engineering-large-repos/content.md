# Context Budgeting, Large Repositories and Progressive Disclosure

**Module:** Advanced Context and Workflow Engineering · **Interview priority:** Frequently asked

> [!NOTE]
> **Checked against:** Claude Code v2.1.289, *Set up Claude Code in a monorepo or large codebase* and *Manage costs effectively* (October 2026). Configuration examples follow the documented formats; they were not measured in a large repository for this lesson.

## Definition

**Context engineering** is deciding what enters Claude's context window, when, and at what cost: instructions, file contents, tool definitions and conversation history. **Progressive disclosure** loads detail only when it becomes relevant — names before bodies, summaries before files, a package's rules only when working in that package.

## Why It Matters

- In a large repository, the naive approach — one huge `CLAUDE.md`, start at the root, "look around" — spends most of the context on things irrelevant to the task.
- Everything in context is re-sent with every request; irrelevant tokens cost money, time and attention.
- Instructions buried in a long file are followed less reliably than short, relevant ones.

## How It Works

```text
always loaded         system prompt · CLAUDE.md from working dir + parents · auto memory (first 200 lines/25 KB)
                      skill & subagent descriptions · MCP tool NAMES (definitions deferred)
loaded on demand      subdirectory CLAUDE.md · path-scoped rules · skill bodies · MCP tool definitions
kept out              Read-denied paths (generated, vendored) · excluded CLAUDE.md files
pushed elsewhere      verbose work → subagents · preprocessing → hooks · lookups → code intelligence
```

## Budgeting Context

| Consumer | How to see it | How to shrink it |
|----------|---------------|------------------|
| Instructions | `/context` → Memory files | Root CLAUDE.md under ~200 lines; detail into skills and scoped rules |
| Skills, agents | `/context`, `/skill-doctor` | Trim descriptions; turn off unused; `disable-model-invocation` |
| MCP servers | `/context`, `/mcp` | Disable unused servers; prefer CLI tools like `gh` |
| File reads | Transcript | Specific prompts; Read deny rules; code intelligence |
| Conversation | `/context`, `/usage` | `/clear` between tasks; `/compact <focus>` |

## Large Repositories

**Where you start Claude decides a lot:**

| Start from | File access | CLAUDE.md at launch | Use when |
|------------|-------------|---------------------|----------|
| Repository root | Everything | Root only; subdirectories on demand | Cross-cutting changes |
| A package/subdirectory | That subtree (until you grant more) | That directory's plus every ancestor's | Work within one area |

Project settings (`.claude/settings.json`) are **not** inherited from parent directories the way CLAUDE.md files are — check which settings file applies when you start in a subdirectory.

**Layer instructions:** a short root `CLAUDE.md` with repository-wide rules, and per-directory `CLAUDE.md` files (or path-scoped rules in `.claude/rules/`) for each area. For a Spring Boot monorepo:

```markdown
# CLAUDE.md (root)
Build one module from the root: ./mvnw -B -pl <module> -am verify
Prefix commit subjects with the module name, for example "orders: add pay endpoint".
Never edit files under */target/ or */generated-sources/.
```

```markdown
# orders/CLAUDE.md
Money is long cents; never double or BigDecimal in this module.
Database changes are new Flyway migrations in src/main/resources/db/migration; never edit an applied one.
```

**Keep irrelevant content out:**

```json
{
  "claudeMdExcludes": ["**/legacy-billing/**"],
  "permissions": {
    "deny": [
      "Read(./**/target/**/*)",
      "Read(./**/generated-sources/**/*)",
      "Read(./**/vendor/**/*)"
    ]
  }
}
```

`claudeMdExcludes` stops other teams' or legacy instructions from loading; Read deny rules keep generated and vendored files from being opened (patterns ending `/**/*` still allow listing the directory). Searches already respect `.gitignore`.

## Progressive Disclosure of Instructions and Tools

| Level | Mechanism | Loads |
|-------|-----------|-------|
| 1 | Root CLAUDE.md | Every session |
| 2 | Per-directory CLAUDE.md / `.claude/rules/` with `paths` | When working in that area |
| 3 | Skill description | Every session (short) |
| 4 | Skill body and supporting files | When invoked |
| 5 | MCP tool names → full definitions | Names always; definitions when used (tool search) |
| 6 | Subagent result | Only the summary returns |

Design rule: put a fact at the **lowest level that's always correct**. "Money is long cents" belongs in the orders module's file, not the root. A release checklist belongs in a skill, not CLAUDE.md.

## Syntax and Configuration

```text
/context                       # what is using the window right now
/compact Keep the FEAT-7 plan, failing test names and file paths; drop exploration output.
/clear                         # unrelated next task: start fresh (free; /compact costs a request)
```

## Real-World Example

Picture a root `CLAUDE.md` that has grown to 900 lines covering eight services. A session in the `orders` service carries the billing, search and front-end conventions too, and rules near the bottom compete with hundreds of irrelevant lines. Splitting it — a short root file, one file per service, the release procedure moved into a skill — means an `orders` session loads the root plus one service file. `/context` (Memory files row) is how you confirm the saving in your own repository rather than assuming it.

## Step-by-Step Walkthrough

1. Run `/context` in a typical session; note the biggest consumers.
2. Cut the root CLAUDE.md to rules that apply everywhere; move area rules down, procedures into skills.
3. Start sessions in the package you're working on.
4. Add `claudeMdExcludes` for areas you never touch and Read denies for generated/vendored code.
5. Disable unused MCP servers; trim skill and agent descriptions.
6. Use subagents for broad searches; `/clear` between unrelated tasks.
7. Re-check `/context` and compare.

## Common Mistakes

- One giant root CLAUDE.md "so Claude knows everything".
- Starting at the root for single-package work.
- Expecting `.claude/settings.json` in a parent directory to apply in a subdirectory session.
- Excluding files with patterns that don't start with `**/` (patterns match absolute paths).
- Compacting repeatedly instead of clearing for a new task.

## Security Considerations

- Read deny rules for secrets (`.env`, keys) belong in every repository regardless of size.
- Excluding instructions can also exclude safety rules — managed policy files can't be excluded, so put must-hold organization rules there.
- Deny rules cover Claude's file tools and recognized commands, not every subprocess; sandboxing covers the rest.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Claude ignores a package rule | Its CLAUDE.md hasn't loaded yet (started at root) | Start in the package or read a file there |
| Context fills quickly | Large instructions, many tools, verbose output | `/context`; apply the budget table |
| Exclusion has no effect | Pattern doesn't match absolute paths | Prefix with `**/` |
| Claude reads generated code | Generated files are tracked in Git | Read deny rules |

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| Per-directory CLAUDE.md | Owners maintain it with the code | Scattered; harder to audit centrally |
| `.claude/rules/` with paths | Central, reusable globs | Further from the code |
| Starting in a package | Smaller context | Cross-package work needs `--add-dir` or the root |

## Interview Takeaways

- Context is a budget: instructions, tools, files and history all compete.
- Layer instructions; disclose detail progressively; keep generated and irrelevant content out.
- Measure with `/context` before and after.

## Key Takeaways

- Short root instructions, area rules where the code is, procedures in skills.
- Start Claude where you work.
- Deny reads of noise; delegate verbose work.
