# RAG vs Memory vs Tools vs Fine-Tuning — Interview Questions

## Beginner

### Q1. What is the difference between chat memory and RAG?

**Style:** Compare

<details>
<summary>Answer</summary>

Chat memory stores and replays what was said in one conversation (keyed by conversation id). RAG retrieves passages from a shared document collection relevant to the current question. Memory answers "what did we discuss?"; RAG answers "what do our documents say?".

</details>

### Q2. When would you use a tool instead of RAG?

**Style:** Scenario

<details>
<summary>Answer</summary>

When the data is live or per-user (order status, account balance, inventory) or when the model must perform an action (book, cancel, send). Tools query the source system at request time with proper authorisation; RAG would serve stale indexed copies.

</details>

## Intermediate

### Q3. A manager asks to fine-tune a model on the company wiki so it "knows" it. What do you answer?

**Style:** Scenario

<details>
<summary>Answer</summary>

Fine-tuning mainly changes behaviour and style; it stores facts unreliably, can't cite sources, goes stale with every wiki edit, offers no per-user access control and costs retraining. RAG over the wiki gives current, citable, filterable answers. Fine-tuning becomes worth considering only for a persistent behaviour gap (format, tone, task skill) that prompting and examples cannot close, proven on an evaluation set.

</details>

### Q4. How do memory, RAG and tools fit in one `ChatClient`?

**Style:** How

<details>
<summary>Answer</summary>

Memory advisor (order +200) loads the conversation; a RAG advisor (for example at +250) retrieves documents once per request; tools are registered with `defaultTools`/`tools` and run in the tool loop (+300). The system prompt states the rules. Each keeps its own concern: history, shared knowledge, live data/actions.

</details>

## Advanced

### Q5. Design the knowledge strategy for a banking support assistant.

**Style:** Design

<details>
<summary>Answer</summary>

System prompt: tone, scope, refusal rules. RAG: product terms, fee schedules, FAQs, with version and region metadata and citations. Tools: balances, transactions, card status — read tools with strict per-customer authorisation via `ToolContext`; write actions (block card, dispute) behind explicit confirmation or human approval. Memory: short window per session, retention limited by policy, no sensitive data stored unnecessarily. No fine-tuning initially; evaluate tone and accuracy, and consider fine-tuning only for a measured behaviour gap. Evaluation, audit logging and redaction across all layers.

</details>
