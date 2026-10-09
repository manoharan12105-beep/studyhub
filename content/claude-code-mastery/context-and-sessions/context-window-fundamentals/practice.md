# What Is a Context Window? — Practice

### P1. Is it in context?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** context vs repository

You start a session in a 400-file repository and ask one question about `PriceCalculator.java`, which Claude reads. Which statement is true?

- A) All 400 files are now in the context window
- B) The files Claude read, your instructions and the conversation are in context; the rest is only on disk
- C) Nothing is in context until you run /context
- D) Only CLAUDE.md is in context

<details>
<summary>Answer</summary>

**Answer:** B) The files Claude read, your instructions and the conversation are in context; the rest is only on disk

Claude finds and reads what a task needs. Startup content (CLAUDE.md, memory, tool and skill listings) plus everything read or said this session make up the context.

</details>

### P2. What loads at startup?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** startup context

Which of these is **not** loaded into context at the start of a session?

- A) The project's root `CLAUDE.md`
- B) The first 200 lines (or 25 KB) of auto memory's `MEMORY.md`
- C) The full body of every installed skill
- D) The names of MCP tools

<details>
<summary>Answer</summary>

**Answer:** C) The full body of every installed skill

Only skill descriptions load at start; a skill's body loads when it is invoked. MCP tool definitions are deferred too — names load first.

</details>

### P3. Measure it

**Difficulty:** Easy · **Type:** Command · **Concepts:** /context

Which command shows what is using your context window, including which CLAUDE.md files loaded?

<details>
<summary>Answer</summary>

`/context` — a breakdown by category with optimization suggestions and the list of memory files. (`/usage` shows cost and plan usage rather than the context breakdown.)

</details>

### P4. Shrink the log

**Difficulty:** Medium · **Type:** Workflow design · **Concepts:** context consumption

Your Maven build prints 3,000 lines. Write a prompt that gets Claude the information it needs with far less context.

<details>
<summary>Answer</summary>

For example: "Run `./mvnw -q test -Dtest=PriceCalculatorTest` and show me only the failing test names and the first stack trace of each." Running one test class quietly and asking for only failures keeps thousands of irrelevant lines out of context.

</details>

### P5. The repeated suggestion

**Difficulty:** Medium · **Type:** Failure diagnosis · **Concepts:** long sessions

After 90 minutes of debugging in one session, Claude proposes the same fix you rejected an hour ago. What is the most likely cause and the best response?

<details>
<summary>Answer</summary>

The context is full of earlier attempts and logs; the rejected approach is still there and may have been summarized imprecisely. Start fresh with `/clear` and a prompt that states the symptom, the reproduction and what has already been ruled out (and why). The docs recommend this once you have corrected Claude more than twice on the same issue.

</details>

### P6. Where should this fact live?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** durable facts

"Never edit an applied Flyway migration; add a new V<n>__ file." You told Claude this at the start of today's session. Where should it live so every session respects it, and why is chat not enough?

<details>
<summary>Answer</summary>

In the project's `CLAUDE.md` (or a rule file), which loads every session and is re-injected from disk after compaction. A chat message exists only in this session's context and can be diluted or summarized away. For a hard guarantee, add a PreToolUse hook that blocks edits to existing migration files (Module 5).

</details>

### P7. Edited behind Claude's back

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** stale context

Claude read `Order.java` ten minutes ago. You edit it in your IDE. Then you ask Claude to add a field. What risk exists, and what reduces it?

<details>
<summary>Answer</summary>

Claude's context holds the old version, so it might plan the edit against stale content. Claude Code adds a note to the conversation when a file Claude read earlier changes on disk, so Claude can re-read it. To be safe, say "I changed Order.java — re-read it before editing."

</details>

### P8. Context and secrets

**Difficulty:** Hard · **Type:** Security · **Concepts:** data in context

A developer asks Claude to "print the values in .env so we can debug the datasource". Explain why this is a bad idea and give a safer alternative.

<details>
<summary>Answer</summary>

Printing secrets puts them into the context, which is sent to the model provider, stored in the local session transcript, and may appear in later summaries or shared logs. Safer: deny `Read(./.env)`; ask Claude to check *which keys are set* (for example by comparing `.env.example` against variable names) or to read the Spring property names from `application.yml`, and inspect actual values yourself outside the session.

</details>
