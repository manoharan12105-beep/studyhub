# Context Compaction, /compact and /clear — Practice

### P1. /compact or /clear?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** compact vs clear

You finished fixing a bug and now want to work on an unrelated documentation task. Which is the better choice?

- A) `/compact`
- B) `/clear`
- C) Keep going in the same conversation
- D) `/rewind` to the start

<details>
<summary>Answer</summary>

**Answer:** B) `/clear`

Unrelated work does not benefit from the old conversation, which would only cost tokens and distract. `/clear` starts fresh; the old conversation remains resumable.

</details>

### P2. Does /clear delete history?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** /clear

After `/clear`, what happens to the previous conversation?

- A) It is permanently deleted
- B) It is saved and can be resumed with `/resume`
- C) It is merged into CLAUDE.md
- D) It becomes auto memory

<details>
<summary>Answer</summary>

**Answer:** B) It is saved and can be resumed with `/resume`

`/clear name` labels it in the picker, and until you exit, the rewind menu offers it as `(previous session)`.

</details>

### P3. What survives?

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** compaction

After auto-compaction, which of these is **re-read from disk** rather than depending on the summary? (Choose all that apply.) a) project-root CLAUDE.md · b) an instruction you typed 2 hours ago · c) auto memory · d) the plan from plan mode · e) a rule with `paths: src/main/resources/db/**`

<details>
<summary>Answer</summary>

a, c and d are re-injected from disk. b depends entirely on the summary. e reloads only when Claude touches a matching file again — until then it is gone.

</details>

### P4. Write the focus

**Difficulty:** Medium · **Type:** Command · **Concepts:** /compact

Your session is nearly full after diagnosing a Flyway startup failure. Write a `/compact` command that keeps what you need to implement the fix.

<details>
<summary>Answer</summary>

```text
/compact keep: the error "Schema validation: missing column [paid_at] in table [orders]", the cause (Order.paidAt added without a migration), the plan to add V2__add_paid_at.sql, and the verify command ./mvnw -B verify
```

Name the symptom, cause, plan and verification command; let the logs go.

</details>

### P5. The lost boundary

**Difficulty:** Medium · **Type:** Security · **Concepts:** auto mode, compaction

In auto mode you said early on "never run database migrations against staging". Three hours later, after compactions, Claude prepares to run one. Why could this happen, and what would have prevented it?

<details>
<summary>Answer</summary>

Auto mode reads conversational boundaries from the transcript on each check; compaction can remove the message that stated it. A hard guarantee needs a **deny rule** (for the exact command) or a **PreToolUse hook**; durable guidance belongs in CLAUDE.md. Conversation boundaries are signals, not rules.

</details>

### P6. Summarize the detour

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** /rewind summarize

You spent 30 messages chasing a false lead, then found the real cause. You want to keep your original task description intact but compress the detour. What do you use?

<details>
<summary>Answer</summary>

`/rewind` (or `Esc` twice on an empty prompt), select the first message of the detour, and choose **Summarize from here**. Earlier messages, including your original task, stay intact; the detour becomes a summary. You can type optional guidance for the summary on that option.

</details>

### P7. Make it persistent

**Difficulty:** Hard · **Type:** Configuration · **Concepts:** compact instructions, hooks

You want every compaction in the orderdesk repository to preserve the list of modified files and the test command, and you want a reminder of the current branch re-added after each compaction. Write the CLAUDE.md section and describe the hook.

<details>
<summary>Answer</summary>

```markdown
# Compact instructions
When compacting, keep the list of modified files, the exact test commands used and decisions about database migrations.
```

Plus a `SessionStart` hook with the `compact` matcher whose command prints the branch (for example `git branch --show-current`); its stdout is added to the compacted context. (Module 5 shows the full configuration.)

</details>

### P8. Diagnose a thrashing session

**Difficulty:** Hard · **Type:** Failure diagnosis · **Concepts:** auto-compaction

Claude Code reports that auto-compaction stopped with a thrashing error right after Claude read a 40 MB application log. Explain and fix.

<details>
<summary>Answer</summary>

The log is so large that the context refills immediately after each summary, so compaction cannot free enough space; Claude Code stops after a few attempts instead of looping. Fix: never read the whole log into the main context — filter it first (`grep ERROR` or the last N lines), ask a subagent to analyze it and return a summary, or give Claude a time window and the exception name.

</details>
