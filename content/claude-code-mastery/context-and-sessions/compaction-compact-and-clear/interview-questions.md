# Context Compaction, /compact and /clear — Interview Questions

## Beginner

### Q1. What is compaction?

**Style:** What

<details>
<summary>Answer</summary>

When the context window nears its limit, Claude Code clears older tool outputs and then replaces the conversation with a structured summary so the session can continue. It happens automatically, or on demand with `/compact`.

</details>

### Q2. What is the difference between /compact and /clear?

**Style:** Comparison

<details>
<summary>Answer</summary>

`/compact` keeps the same conversation but summarizes it, optionally with focus instructions. `/clear` starts a new conversation with empty context; the old one is saved and resumable. Compact to continue the same task with more room; clear when switching to unrelated work or when the context is polluted with failed attempts.

</details>

## Intermediate

### Q3. What survives compaction?

**Style:** What

<details>
<summary>Answer</summary>

System prompt and output style still apply; project-root CLAUDE.md, unscoped rules, auto memory and the plan-mode plan are re-read from disk; a fresh git status is taken; up to five recent files are re-read; invoked skill bodies are re-attached within a budget. Path-scoped rules and nested CLAUDE.md reload only when matching files are touched again. Instructions typed in chat survive only if the summary keeps them.

</details>

### Q4. How do you make sure an important decision survives a long session?

**Style:** How

<details>
<summary>Answer</summary>

Write it to a file that is re-read: CLAUDE.md or a rule for project-wide rules, the plan or a notes file for task decisions, small commits for progress. Use `/compact` with explicit focus before a new phase, and a "Compact instructions" section in CLAUDE.md for what every summary must keep.

</details>

## Advanced

### Q5. When is starting fresh better than compacting?

**Style:** Trade-off

<details>
<summary>Answer</summary>

When the context is polluted — several wrong approaches, repeated corrections — compaction preserves the confusion in summary form. A new session with a precise prompt (symptom, reproduction, what's ruled out) is cleaner and cheaper. The docs suggest clearing after correcting Claude more than twice on the same issue. Compaction is better when the thread of a single task is still valuable.

</details>

### Q6. Why are chat-stated boundaries risky in auto mode over long sessions?

**Style:** Security

<details>
<summary>Answer</summary>

The classifier treats boundaries you state ("don't push") as block signals by re-reading the transcript, but compaction can remove the message that stated them. They are not stored as rules. Use deny or ask rules for anything that must hold.

</details>
