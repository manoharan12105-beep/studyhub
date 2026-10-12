# Advisor Ordering and Transformations — Interview Questions

## Beginner

### Q1. Advisors A (order 10) and B (order 20) are registered as `defaultAdvisors(B, A)`. In what order do their `before` and `after` methods run?

**Style:** Behavior

<details>
<summary>Answer</summary>

`A.before`, `B.before`, model, `B.after`, `A.after`. Registration order does not matter; the chain is a stack sorted by `getOrder()`.

</details>

### Q2. What are the default orders of the memory advisors and the tool-calling advisor?

**Style:** Direct

<details>
<summary>Answer</summary>

`MessageChatMemoryAdvisor` and `VectorStoreChatMemoryAdvisor`: `HIGHEST_PRECEDENCE + 200`. `ToolCallingAdvisor`: `HIGHEST_PRECEDENCE + 300`. So memory runs outside (before) the tool loop, and both run before advisors with order 0 such as `QuestionAnswerAdvisor` and `SafeGuardAdvisor` — which therefore sit inside the loop and run on every model round.

</details>

## Intermediate

### Q3. How do you add a sentence to the system message inside an advisor?

**Style:** How

<details>
<summary>Answer</summary>

In `before`, return `request.mutate().prompt(request.prompt().augmentSystemMessage(system -> system.mutate().text(system.getText() + "\n...").build())).build()`. `augmentSystemMessage` returns a new `Prompt` (creating a system message if none exists), so the original request is not modified.

</details>

### Q4. A content-safety advisor and a logging advisor must cooperate: logs must never contain the raw answer. Which needs the lower order?

**Style:** Scenario

<details>
<summary>Answer</summary>

The logger. On the response path, higher orders run first: the redaction advisor (higher order) cleans the answer, then the logger (lower order) sees the cleaned version. But on the request path the logger also runs first, so if it logs requests, sensitive input must be handled separately (or log only metadata).

</details>

## Advanced

### Q5. Design the advisor stack for a tutoring client with a guardrail, memory, RAG, tools and per-call audit logging.

**Style:** Design

<details>
<summary>Answer</summary>

Guardrail outermost (for example `HIGHEST_PRECEDENCE + 100`) so blocked requests reach neither memory nor the model. Memory at +200 (default), so history is loaded once and the final exchange stored. Retrieval (`QuestionAnswerAdvisor` or `RetrievalAugmentationAdvisor`) after memory but before the loop, for example `HIGHEST_PRECEDENCE + 250`, so it searches once per request — at its default order 0 it would search again on every tool round. `ToolCallingAdvisor` at +300. Per-call audit logging above +300 so it records each model round including tool calls. Keep the orders as named constants and test the final prompt with a fake model.

</details>
