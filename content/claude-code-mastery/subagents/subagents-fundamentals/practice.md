# What Are Subagents? Delegation and Context Isolation — Practice

### P1. What does a subagent see?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** context isolation

You spent 30 minutes agreeing with Claude that discounts round down. Claude then delegates "check the discount code" to a custom (non-fork) subagent. What does the subagent know about your rounding decision?

- A) Everything — subagents share the conversation
- B) Only what the delegation message says, plus CLAUDE.md
- C) Nothing, and it also can't read CLAUDE.md
- D) Whatever is in auto memory

<details>
<summary>Answer</summary>

**Answer:** B) Only what the delegation message says, plus CLAUDE.md

A non-fork subagent starts fresh with its own system prompt, the task message, CLAUDE.md files and a Git status snapshot. Auto memory isn't loaded. If the decision isn't in the task or CLAUDE.md, the subagent doesn't know it.

</details>

### P2. Pick the built-in agent

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** built-in subagents

Which built-in subagent is read-only and skips CLAUDE.md?

- A) general-purpose
- B) Explore
- C) claude-code-guide
- D) fork

<details>
<summary>Answer</summary>

**Answer:** B) Explore

Explore (and Plan) are read-only and skip CLAUDE.md and the Git status snapshot to stay fast and cheap.

</details>

### P3. Delegate or not?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** when to delegate

For each task, choose main conversation or subagent: (a) rename one method used in three files; (b) summarize which of 200 test classes use `@Transactional`; (c) iterate with you on the wording of an error message; (d) run the full test suite and report only failures.

<details>
<summary>Answer</summary>

(a) Main — small, targeted. (b) Subagent — wide, verbose search with a short answer. (c) Main — back-and-forth. (d) Subagent — verbose output, short summary.

</details>

### P4. Rewrite the delegation

**Difficulty:** Medium · **Type:** Prompt design · **Concepts:** delegation prompts

Improve this delegation: "Look into the order bug."

<details>
<summary>Answer</summary>

```text
Use a subagent: GET /api/orders/{id} returns 500 for orders created without a discount code
(docs/issues/BUG-101.md). Read only src/main/java and src/test/java. Find where the response
is built and where the discount is applied. Report: the likely failing line as file:line,
the evidence, and any test that already covers this case. Don't edit files.
```

Goal, scope, evidence and output format are explicit, because the subagent can't ask you.

</details>

### P5. Fork or subagent?

**Difficulty:** Medium · **Type:** Trade-off · **Concepts:** forks

You have a long conversation about the payment design and want a side worker to draft tests "for what we agreed". Fork or ordinary subagent? Why?

<details>
<summary>Answer</summary>

A fork (`/subtask draft tests for the payment rules we agreed`). It inherits the full conversation, so "what we agreed" means something, and its tool calls still stay out of your context. An ordinary subagent would need the whole agreement restated in its task.

</details>

### P6. The context still grew

**Difficulty:** Hard · **Type:** Failure diagnosis · **Concepts:** report size

You asked for five parallel subagents to "review everything in detail". The main context jumped by tens of thousands of tokens. Why, and how do you fix it next time?

<details>
<summary>Answer</summary>

Each subagent's final report is added to your conversation. Five detailed reports cost five times as much context. Ask for short, structured output ("at most 10 findings, one line each, file:line + problem"), fewer subagents, or let one coordinating step merge them before reporting.

</details>

### P7. Instruction or control?

**Difficulty:** Hard · **Type:** Security · **Concepts:** tool restriction

A teammate's reviewer subagent has no `tools` field and a system prompt saying "Never edit files." Is it read-only? What would you change?

<details>
<summary>Answer</summary>

No. Without `tools`, it inherits every tool available to subagents, including Edit, Write and Bash; the sentence is only an instruction. Set `tools: Read, Grep, Glob` (or `disallowedTools: Write, Edit` plus Bash deny rules) so the restriction is enforced by Claude Code, and keep the sentence as explanation.

</details>
