# LLMs, Tokens, Context Windows, Temperature and Hallucinations — Practice

### P1. What fills the context window?

**Difficulty:** Easy · **Type:** MCQ

Which parts of a chat request count against the context window?

- A) Only the user's latest question
- B) Only the generated answer
- C) System message, history, retrieved documents, question and the generated answer
- D) Nothing; the window only limits the number of HTTP requests

<details>
<summary>Answer</summary>

**Answer:** C) System message, history, retrieved documents, question and the generated answer

</details>

### P2. Choose the temperature

**Difficulty:** Easy · **Type:** MCQ

You extract invoice numbers and amounts from e-mails into a record. Which temperature setting fits best?

- A) A low value such as 0 or 0.1
- B) A high value such as 1.2
- C) Temperature does not affect extraction
- D) Always the provider maximum

<details>
<summary>Answer</summary>

**Answer:** A) A low value such as 0 or 0.1

**Explanation:** Extraction needs the most likely, consistent answer; randomness only adds errors.

</details>

### P3. Token estimate

**Difficulty:** Medium · **Type:** Conceptual

A support agent pastes a 12,000-character English transcript into a prompt. Roughly how many tokens is that, and why is the number only an estimate?

<details>
<summary>Answer</summary>

About 3,000 tokens (≈ 4 characters per token for typical English). It is an estimate because tokenizers differ by model family, the provider adds formatting tokens per message, and code, names or non-English text change the ratio. Use the usage reported in the response for exact numbers.

</details>

### P4. Diagnose a truncated reply

**Difficulty:** Medium · **Type:** Debugging

Answers in production sometimes stop mid-sentence, and the response metadata shows the finish reason `length`. Give two fixes.

<details>
<summary>Answer</summary>

Increase the output-token limit (within your cost budget) or ask for shorter answers; reduce the input size (trim history, retrieve fewer chunks) so the context window leaves room for the reply.

</details>

### P5. Hallucination plan

**Difficulty:** Hard · **Type:** Design

An internal assistant answers HR policy questions and once invented a non-existent leave policy. Propose four changes, from prompt to process.

<details>
<summary>Answer</summary>

1. Retrieve answers from the official policy documents (RAG) instead of relying on the model's memory.
2. Instruct the model to answer only from the provided context and to say it does not know otherwise; keep the empty-context refusal behaviour.
3. Return source references with each answer so employees can check them.
4. Build an evaluation set of real policy questions with expected answers, and run it before every prompt, model or document change; route low-confidence or unanswerable questions to HR.

</details>

### P6. Read the estimator

**Difficulty:** Easy · **Type:** Behavior

In the lesson's `TokenCounter`, the 30-character JSON string `{"student":"Priya","score":92}` costs 10 tokens, while the 30-character phrase "Spring Boot auto-configuration" costs 5. Why?

<details>
<summary>Answer</summary>

Punctuation such as quotes, braces, colons and commas usually become separate tokens, so JSON and code are token-dense. Common English words are often single tokens.

</details>
