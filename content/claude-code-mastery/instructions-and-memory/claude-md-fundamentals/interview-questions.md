# What Is CLAUDE.md? — Interview Questions

## Beginner

### Q1. What is CLAUDE.md?

**Style:** What

<details>
<summary>Answer</summary>

A Markdown file of persistent instructions that Claude Code loads into context at the start of every session — build commands, conventions, architecture notes, rules. It can exist at managed, user (`~/.claude/CLAUDE.md`), project (`./CLAUDE.md` or `./.claude/CLAUDE.md`) and local (`./CLAUDE.local.md`) scope; all applicable files load together.

</details>

### Q2. User-level vs project-level CLAUDE.md?

**Style:** Comparison

<details>
<summary>Answer</summary>

User level (`~/.claude/CLAUDE.md`) holds personal preferences across all your projects and is not shared. Project level is committed to the repository and shared with the team: commands, conventions, gotchas. Local (`CLAUDE.local.md`) is personal and project-specific, kept out of Git.

</details>

## Intermediate

### Q3. How do multiple CLAUDE.md files combine?

**Style:** How

<details>
<summary>Answer</summary>

They are concatenated, not overridden: managed and user files, then files from the filesystem root down to the working directory, with `CLAUDE.local.md` after `CLAUDE.md` in each directory, so closer instructions are read last. Subdirectory files load on demand when Claude works in them. If two instructions conflict, Claude may follow either — so remove conflicts.

</details>

### Q4. Does CLAUDE.md enforce rules?

**Style:** Misconception

<details>
<summary>Answer</summary>

No. It is context delivered after the system prompt; Claude tries to follow it but compliance isn't guaranteed. Enforcement comes from permission rules (deny/ask/allow), hooks, the sandbox and managed settings. Use CLAUDE.md for guidance and those for guarantees.

</details>

### Q5. How does AGENTS.md interact with CLAUDE.md?

**Style:** How

<details>
<summary>Answer</summary>

From v2.1.277, Claude Code reads `AGENTS.md` when no `CLAUDE.md` or `CLAUDE.local.md` exists on the path; if one exists, it reads CLAUDE.md only by default. You can import it (`@AGENTS.md`) or set Project instructions to read both.

</details>

## Advanced

### Q6. How would you roll out CLAUDE.md across a 30-person team?

**Style:** Workflow design

<details>
<summary>Answer</summary>

Start with `/init`, prune to commands, non-default conventions and gotchas, keep it under ~200 lines, and commit it with code review like any code. Add to it when Claude repeats a mistake or a review comment recurs. Keep personal preferences in user files, area-specific rules in `.claude/rules/` with `paths`, procedures in skills, and non-negotiables in settings or hooks. Audit periodically (`/doctor prompt-audit` on recent versions) for stale or conflicting content.

</details>

### Q7. Why is a repository's CLAUDE.md a security consideration?

**Style:** Security

<details>
<summary>Answer</summary>

It is text controlled by whoever writes to the repository, and Claude treats it as instructions. In an untrusted repository it can try to steer Claude into running commands or reading files. It cannot grant permissions, so permission prompts, deny rules and the trust decision remain the defence; read it before trusting a repository.

</details>
