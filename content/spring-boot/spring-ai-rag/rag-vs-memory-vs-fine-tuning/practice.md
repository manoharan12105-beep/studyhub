# RAG vs Memory vs Tools vs Fine-Tuning — Practice

### P1. Pick the mechanism

**Difficulty:** Easy · **Type:** MCQ

"Which of my orders shipped today?" Which mechanism fits best?

- A) Chat memory
- B) RAG over exported order PDFs
- C) A read tool calling the order service
- D) Fine-tuning

<details>
<summary>Answer</summary>

**Answer:** C) A read tool calling the order service

</details>

### P2. Match requirements

**Difficulty:** Easy · **Type:** Conceptual

Match each requirement to memory, RAG, tool, prompt or fine-tuning: (a) "Use British spelling", (b) "Remember that I'm a beginner during this chat", (c) "Answer from the 2026 course catalogue", (d) "Enrol me in Java 101".

<details>
<summary>Answer</summary>

(a) prompt, (b) memory, (c) RAG, (d) write tool with confirmation.

</details>

### P3. Stale answers

**Difficulty:** Medium · **Type:** Debugging

An assistant fine-tuned on last quarter's price list quotes old prices. What do you change?

<details>
<summary>Answer</summary>

Move prices out of the model: retrieve them with RAG from the current price list (re-ingested when it changes) or, better for exact live values, a pricing tool. Keep fine-tuning only for behaviour, if at all, and add evaluation cases with recently changed prices.

</details>

### P4. Order the advisors

**Difficulty:** Medium · **Type:** Behavior

A client has `MessageChatMemoryAdvisor` (default order), a `RetrievalAugmentationAdvisor` at `HIGHEST_PRECEDENCE + 250` and tools. In what order do they act on a request, and how often does retrieval run if the model calls two tools in sequence?

<details>
<summary>Answer</summary>

Memory (+200), then retrieval (+250), then the tool loop (+300). Retrieval runs once per request, because it is outside the tool loop; the three model calls inside the loop reuse the augmented prompt.

</details>

### P5. Justify a design

**Difficulty:** Hard · **Type:** Design

A legal team wants an assistant that drafts contract clauses in the firm's house style and cites the firm's precedent clauses. Propose a design and say whether fine-tuning is justified.

<details>
<summary>Answer</summary>

RAG over the precedent library (clause type, jurisdiction, date, approval status metadata; citations validated in code) supplies content. House style first via system prompt, few-shot examples and structured output; measure style adherence with an evaluation set reviewed by lawyers. Fine-tuning is justified only if, after that, style errors remain frequent and costly — and even then it supplements RAG, never replaces it, because precedents change and must be cited. Drafts are reviewed by a lawyer before use.

</details>
