# Context Budgeting, Large Repositories and Progressive Disclosure — Practice

### P1. Where to start

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** working directory

You'll spend the day on the `orders` module of a 12-module Maven repository. Where should you start `claude`?

- A) The repository root, always
- B) The `orders` directory
- C) Your home directory
- D) It makes no difference

<details>
<summary>Answer</summary>

**Answer:** B) The `orders` directory

Claude then loads `orders/CLAUDE.md` plus every ancestor's at launch, and file access is scoped to that subtree until you grant more.

</details>

### P2. Which level?

**Difficulty:** Easy · **Type:** Scenario · **Concepts:** progressive disclosure

Place each item: (a) "Never commit secrets"; (b) "Orders money is long cents"; (c) the 40-step release procedure; (d) a Jira MCP server used once a month.

<details>
<summary>Answer</summary>

(a) Root CLAUDE.md (or managed policy). (b) `orders/CLAUDE.md` or a path-scoped rule. (c) A manual-only skill. (d) Disabled until needed (or configured at local scope), since even deferred tools list names and server instructions.

</details>

### P3. Keep noise out

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** deny rules

Write deny rules so Claude can't open files under any `target/` directory or any `generated-sources/` directory, but can still list those directories.

<details>
<summary>Answer</summary>

```json
{
  "permissions": {
    "deny": [
      "Read(./**/target/**/*)",
      "Read(./**/generated-sources/**/*)"
    ]
  }
}
```

Ending with `/**/*` covers the contents but not the directory itself.

</details>

### P4. Exclusion that didn't work

**Difficulty:** Medium · **Type:** Failure diagnosis · **Concepts:** claudeMdExcludes

`"claudeMdExcludes": ["legacy/CLAUDE.md"]` has no effect. Why?

<details>
<summary>Answer</summary>

Patterns are globs matched against absolute file paths. A relative-looking pattern doesn't match `/home/dev/repo/legacy/CLAUDE.md`. Use `"**/legacy/CLAUDE.md"` (or `"**/legacy/**"` to also skip its rules).

</details>

### P5. Compact or clear?

**Difficulty:** Medium · **Type:** Trade-off · **Concepts:** conversation context

You finished FEAT-7 and start an unrelated logging change. `/compact` or `/clear`?

<details>
<summary>Answer</summary>

`/clear`. The FEAT-7 history is irrelevant to the next task; `/clear` costs nothing and starts fresh (rename the session first if you may return). `/compact` is for continuing the same task with less history, and it is itself a large request.

</details>

### P6. Inherited settings?

**Difficulty:** Hard · **Type:** Misconception · **Concepts:** settings scope

"Our deny rules are in the repository root's `.claude/settings.json`, so they apply when someone starts Claude in `orders/`." True?

<details>
<summary>Answer</summary>

Not necessarily. CLAUDE.md files load from ancestors, but project settings aren't inherited from parent directories the same way; check which `.claude/settings.json` the session reads for its starting directory (the settings documentation lists where Claude Code looks). Put must-hold rules where every starting point picks them up, or in managed settings.

</details>

### P7. Budget plan

**Difficulty:** Hard · **Type:** Workflow design · **Concepts:** context budgeting

`/context` shows: Memory files 18k tokens, MCP 6k, skills 5k, messages 90k. List four changes, biggest saving first.

<details>
<summary>Answer</summary>

1. Messages: `/clear` between unrelated tasks; delegate verbose searches and test runs to subagents; ask for short outputs.
2. Memory files: cut the root CLAUDE.md, move area rules into per-directory files and procedures into skills.
3. MCP: disable servers you don't use this session; prefer `gh`-style CLIs.
4. Skills: `/skill-doctor`, turn off unused ones, shorten descriptions.

</details>
