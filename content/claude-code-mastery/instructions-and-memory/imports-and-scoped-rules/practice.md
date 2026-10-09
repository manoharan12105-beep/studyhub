# Imports and Scoped Rules — Practice

### P1. Do imports save context?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** imports

Your 300-line CLAUDE.md is split into a 30-line CLAUDE.md that imports three 90-line files. How much context does it use at launch compared with before?

- A) About 10%
- B) About the same
- C) Nothing until Claude asks for the files
- D) Double

<details>
<summary>Answer</summary>

**Answer:** B) About the same

Imported files are expanded and loaded at launch alongside the importing file. Imports help organization, not context size.

</details>

### P2. Write a scoped rule

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** paths frontmatter

Write a rule file that applies only when Claude works on Spring controllers in orderdesk and says: return 404 with `ResponseStatusException` for unknown ids.

<details>
<summary>Answer</summary>

`.claude/rules/controllers.md`:

```markdown
---
paths:
  - "src/main/java/**/*Controller.java"
---

# Controller rules

- Unknown ids: throw `ResponseStatusException(HttpStatus.NOT_FOUND, ...)`.
- Invalid state changes: 409 CONFLICT.
```

</details>

### P3. When does it load?

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** path-scoped loading

The rule from P2 exists. In a new session you ask "what does PriceCalculator do?" and Claude reads only `PriceCalculator.java`. Is the controller rule in context?

<details>
<summary>Answer</summary>

No. A path-scoped rule loads when Claude reads, writes or edits a matching file (or views one with a single-file Bash read). `PriceCalculator.java` does not match `*Controller.java`.

</details>

### P4. Lost after compaction

**Difficulty:** Medium · **Type:** Failure diagnosis · **Concepts:** compaction and rules

During a long migration task, Claude follows `.claude/rules/migrations.md` until auto-compaction; afterwards it writes a migration that violates the rule. Why, and how do you prevent it?

<details>
<summary>Answer</summary>

Path-scoped rules are loaded into message history and summarized away by compaction; they reload only when a matching file is accessed again. Claude may write a new migration before touching an existing one. Options: make the essential lines unscoped (or put them in the root CLAUDE.md, which is re-read after compaction), re-read a migration file to reload the rule, and enforce the critical part with a hook.

</details>

### P5. Spaces in a path

**Difficulty:** Easy · **Type:** Debugging · **Concepts:** import syntax

`- API conventions @"Design Docs/api.md"` does not import the file. Fix it.

<details>
<summary>Answer</summary>

`- API conventions @Design\ Docs/api.md` — escape each space with a backslash. Quoted paths are not imported at all.

</details>

### P6. Monorepo noise

**Difficulty:** Hard · **Type:** Configuration · **Concepts:** claudeMdExcludes

You start Claude in `/home/user/monorepo/services/orders`. The monorepo root `CLAUDE.md` contains 150 lines about the mobile app. Exclude it for yourself only.

<details>
<summary>Answer</summary>

In `.claude/settings.local.json` (personal, not committed):

```json
{
  "claudeMdExcludes": ["/home/user/monorepo/CLAUDE.md"]
}
```

Patterns match absolute paths with glob syntax. If the root file also has rules your team needs, ask the owners to move the mobile section into a path-scoped rule instead.

</details>

### P7. Unexpected approval dialog

**Difficulty:** Hard · **Type:** Security · **Concepts:** external imports

Opening a freshly cloned repository, Claude Code asks you to approve external imports listing `~/.ssh/config`. What does it mean and what do you do?

<details>
<summary>Answer</summary>

The repository's CLAUDE.md (or a symlinked rule) imports a file outside the working directory — here your SSH configuration — which would load into context and be sent to the model. Decline; the imports stay disabled. Inspect the repository's CLAUDE.md and `.claude/rules/` and do not trust it until you understand why it does this.

</details>

### P8. Choose the mechanism

**Difficulty:** Hard · **Type:** Trade-off · **Concepts:** CLAUDE.md vs rules vs skills

Assign each to CLAUDE.md, an unscoped rule, a path-scoped rule or a skill: (a) the build command; (b) PostgreSQL compatibility rules for migrations; (c) a 120-line release checklist used weekly; (d) the team's code style summary (20 lines).

<details>
<summary>Answer</summary>

(a) CLAUDE.md — needed every session.
(b) Path-scoped rule on `src/main/resources/db/migration/**` — relevant only there.
(c) Skill, invoked when releasing; probably `disable-model-invocation: true`.
(d) CLAUDE.md or an unscoped rule file (`code-style.md`) — both load at launch; a separate file is easier to maintain.

</details>
