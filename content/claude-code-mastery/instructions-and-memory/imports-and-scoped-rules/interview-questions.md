# Imports and Scoped Rules — Interview Questions

## Beginner

### Q1. What does `@path` do in CLAUDE.md?

**Style:** What

<details>
<summary>Answer</summary>

It imports another file: the file is expanded and loaded into context at launch with the CLAUDE.md that references it. Paths are relative to the importing file, imports can nest four hops deep, and files outside the working directory need a one-time approval.

</details>

### Q2. What is `.claude/rules/`?

**Style:** What

<details>
<summary>Answer</summary>

A directory of topic-specific instruction files. Rules without frontmatter load at launch like CLAUDE.md; rules with `paths` frontmatter load only when Claude works with matching files. User-level rules live in `~/.claude/rules/`.

</details>

## Intermediate

### Q3. Imports vs path-scoped rules — which saves context?

**Style:** Comparison

<details>
<summary>Answer</summary>

Only path-scoped rules. Imports are loaded at launch, so they cost the same as inline text; they help organize. Path-scoped rules load only when a matching file is read, written or edited.

</details>

### Q4. What are the risks of path-scoped rules?

**Style:** Trade-off

<details>
<summary>Answer</summary>

They're absent until a matching file is touched, so Claude may act before seeing them (writing a new migration before opening an existing one), and they're summarized away by compaction and only reload on another match. Critical rules should be unscoped or enforced by hooks.

</details>

## Advanced

### Q5. How would you structure instructions in a monorepo with five teams?

**Style:** Workflow design

<details>
<summary>Answer</summary>

A short root CLAUDE.md with repo-wide commands and policies; each package's own CLAUDE.md (loaded when working there); path-scoped rules for cross-cutting areas like migrations or API contracts; skills for procedures; `claudeMdExcludes` for developers who never touch certain areas; and starting sessions in the package being changed. Review instruction files like code to keep them consistent.

</details>

### Q6. Why does Claude Code ask before loading external imports?

**Style:** Security

<details>
<summary>Answer</summary>

Project CLAUDE.md files come from the repository, i.e. from other people. An import outside the working directory could pull private files — SSH config, credentials, other repositories — into context and send them to the model. The one-time approval lets you see and refuse that. User-level files you wrote yourself don't need the dialog.

</details>
