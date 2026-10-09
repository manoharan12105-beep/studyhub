# What Is a Context Window? — Interview Questions

## Beginner

### Q1. What is the context window?

**Style:** What

<details>
<summary>Answer</summary>

Everything the model can see at once, measured in tokens: system instructions, CLAUDE.md files, auto memory, the listing of skills and MCP tools, the conversation, and all file contents and command output read in the session. What is not in it, the model doesn't know.

</details>

### Q2. Is the whole repository in context?

**Style:** Misconception

<details>
<summary>Answer</summary>

No. The repository is on disk; Claude searches and reads the files a task needs. Only those reads, plus startup instructions and the conversation, are in context. Git history is also on disk and enters context only when Claude runs a command like `git log`.

</details>

## Intermediate

### Q3. Why do long sessions get worse?

**Style:** Why

<details>
<summary>Answer</summary>

Performance degrades as context fills: important instructions are diluted among thousands of lines of output, failed attempts remain and pull the model back, and near the limit compaction summarizes the conversation, which can drop detailed early instructions. Focused sessions, `/clear` between tasks and durable facts in CLAUDE.md counter this.

</details>

### Q4. What consumes the most context in a typical Java debugging session, and how do you reduce it?

**Style:** How

<details>
<summary>Answer</summary>

Full Maven/Gradle output, whole large files, repeated reads and verbose MCP results. Reduce it by running a single test class quietly, asking for only failing tests and the first stack trace, @-mentioning specific files, delegating broad searches to a subagent that returns a summary, and clearing between unrelated tasks.

</details>

### Q5. How do you check context usage?

**Style:** How

<details>
<summary>Answer</summary>

`/context` shows usage by category, which memory files loaded and optimization suggestions; `/usage` shows cost and plan usage. A custom status line can display context usage continuously.

</details>

## Advanced

### Q6. A team says "Claude ignores our CLAUDE.md rules in long sessions." Diagnose.

**Style:** Debugging

<details>
<summary>Answer</summary>

First check the file actually loads (`/context` → memory files). If it does, the likely causes are dilution in very long sessions, rules that are vague or contradictory, or a CLAUDE.md so long that individual rules get lost. Project-root CLAUDE.md is re-read after compaction, so it is not "lost" there, but path-scoped rules and nested files reload only on demand. Fixes: shorter, specific rules; shorter sessions; and hooks for anything that must always hold.

</details>

### Q7. How does context relate to cost and security?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Cost: each message sends the accumulated context (cached parts are cheaper, but size still matters), so bloated sessions cost more. Security: everything in context goes to the model provider and the local transcript, so secrets must not be read in; and untrusted text read into context is the channel for prompt injection.

</details>
