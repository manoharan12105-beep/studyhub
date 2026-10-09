# Auto Memory and Instruction Hygiene — Practice

### P1. Who writes what

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** auto memory vs CLAUDE.md

Which statement is true?

- A) Auto memory is written by you and shared through Git
- B) Auto memory is written by Claude and stays on your machine
- C) CLAUDE.md is written by Claude after each session
- D) Auto memory replaces CLAUDE.md

<details>
<summary>Answer</summary>

**Answer:** B) Auto memory is written by Claude and stays on your machine

It is stored under `~/.claude/projects/<project>/memory/`, shared across worktrees of the same repository on that machine, but not with teammates or cloud sessions. It complements CLAUDE.md.

</details>

### P2. What loads?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** load limits

What part of auto memory loads at the start of every session?

- A) Every memory file in full
- B) The first 200 lines or 25 KB of `MEMORY.md`, whichever comes first
- C) Nothing; Claude must be asked
- D) Only `feedback` memories

<details>
<summary>Answer</summary>

**Answer:** B) The first 200 lines or 25 KB of `MEMORY.md`, whichever comes first

Topic files are read on demand with Claude's normal file tools.

</details>

### P3. Remember vs CLAUDE.md

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** sharing

You type "remember that integration tests need Docker running." A teammate's sessions still forget it. Why, and what should you do?

<details>
<summary>Answer</summary>

"Remember" saves to your auto memory, which is machine-local. A fact the whole team needs belongs in the project's `CLAUDE.md` — ask "add this to CLAUDE.md" or edit it, and commit.

</details>

### P4. Stale memory

**Difficulty:** Medium · **Type:** Failure diagnosis · **Concepts:** memory quality

After upgrading to Java 21, Claude keeps avoiding records and `switch` patterns in your sessions only. CLAUDE.md says Java 21. What do you check?

<details>
<summary>Answer</summary>

Your auto memory: `/memory` → open the folder and look for a stale note like "project targets Java 17". Delete or correct it. Conflicting sources (CLAUDE.md says 21, memory says 17) produce unpredictable behaviour; each fact should live in one place.

</details>

### P5. One home per rule

**Difficulty:** Medium · **Type:** Workflow design · **Concepts:** duplication

"Run the single test class while iterating" appears in CLAUDE.md, in a skill and in your auto memory, with three slightly different commands. How do you clean this up?

<details>
<summary>Answer</summary>

Decide the correct command, keep it in one home — the project CLAUDE.md, since it applies to all work — delete the memory entry, and make the skill refer to the CLAUDE.md command (or omit it) rather than restating a different one. Then verify behaviour in a new session.

</details>

### P6. Disable for a project

**Difficulty:** Easy · **Type:** Configuration · **Concepts:** autoMemoryEnabled

Write the settings that turn auto memory off for one project only.

<details>
<summary>Answer</summary>

In that project's `.claude/settings.json` (or `settings.local.json` for just you):

```json
{
  "autoMemoryEnabled": false
}
```

</details>

### P7. Memory and privacy

**Difficulty:** Hard · **Type:** Security · **Concepts:** sensitive data

While debugging a customer complaint, Claude saved a memory: "customer jane.doe@example.com reported the bug; account id 88213." What is the problem and what do you do?

<details>
<summary>Answer</summary>

Personal data now lives in a plain-text file that loads into future contexts and is sent to the model in later sessions — unrelated to its original purpose. Delete the memory file and its `MEMORY.md` line, keep personal data out of prompts where possible, and refer to cases by ticket id instead.

</details>

### P8. Audit routine

**Difficulty:** Hard · **Type:** Workflow design · **Concepts:** hygiene

Design a 15-minute monthly instruction review for a team of six using Claude Code on orderdesk.

<details>
<summary>Answer</summary>

1. Each developer reviews their auto memory (`/memory`), deletes stale or sensitive entries, and proposes team-relevant ones for CLAUDE.md.
2. One person runs `/doctor prompt-audit` (v2.1.283+) or a manual review across CLAUDE.md, rules and skills for conflicts and dead references.
3. Remove lines Claude could derive from code; check sizes with `/context`.
4. Verify every command in CLAUDE.md still runs.
5. Merge changes through a pull request so the team reviews instruction changes like code.

</details>
