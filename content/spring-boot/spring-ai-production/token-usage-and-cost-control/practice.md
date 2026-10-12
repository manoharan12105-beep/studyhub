# Token Usage and Cost Control — Practice

### P1. Compute a cost

**Difficulty:** Easy · **Type:** Conceptual

Example prices (not real ones): input $0.50 per million tokens, output $2.00 per million. A request uses 3,000 input and 500 output tokens. What does it cost, and what do 100,000 such requests cost?

<details>
<summary>Answer</summary>

3,000 × 0.50/1,000,000 = $0.0015; 500 × 2.00/1,000,000 = $0.0010; total $0.0025 per request. 100,000 requests ≈ $250.

</details>

### P2. Biggest driver

**Difficulty:** Easy · **Type:** MCQ

In a long tool-using chat, which usually contributes most input tokens per call?

- A) The user's latest question
- B) History, retrieved context and tool definitions resent on every call
- C) The model name
- D) The output limit setting

<details>
<summary>Answer</summary>

**Answer:** B) History, retrieved context and tool definitions resent on every call

</details>

### P3. Cap the output

**Difficulty:** Easy · **Type:** Coding

Limit one request's answer to 200 tokens and detect truncation.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
ChatResponse response = chatClient.prompt()
        .user(question)
        .options(ChatOptions.builder().maxTokens(200))
        .call().chatResponse();
String finish = response.getResult().getMetadata().getFinishReason();
if ("LENGTH".equalsIgnoreCase(finish)) {
    // tell the user the answer was cut, or ask for a shorter answer
}
```

</details>

### P4. Budget advisor bug

**Difficulty:** Medium · **Type:** Debugging

A budget advisor uses order 0 and records usage after `chain.nextCall(request)`. In a feature where the model calls two tools in sequence before answering, the logs show three budget checks and three usage records per user request. Explain, and say where the advisor should sit.

<details>
<summary>Answer</summary>

Order 0 is inside the tool loop (`ToolCallingAdvisor` is at `HIGHEST_PRECEDENCE + 300`), so the advisor runs once per model round: three checks and three records (one per call). Totals are still right, but the budget check can refuse in the middle of a turn, leaving a half-finished tool sequence. Place it outside the loop (for example `HIGHEST_PRECEDENCE + 100`): it then runs once per request, and the response it receives carries the usage accumulated over all rounds.

</details>

### P5. Cut the bill

**Difficulty:** Hard · **Type:** Scenario

A study assistant sends: a 1,500-token system prompt, 20 history messages (≈3,000 tokens), 6 chunks of 700 tokens, and 25 tool definitions (≈2,500 tokens) on every call. Propose four changes and estimate the effect.

<details>
<summary>Answer</summary>

Total ≈ 1,500 + 3,000 + 4,200 + 2,500 = 11,200 input tokens. (1) Shorten the system prompt to ≈600 tokens, moving reference material to RAG (−900). (2) Window of 10 messages plus a summary (≈−1,500). (3) Retrieval threshold and topK 3 with 400-token chunks (4,200 → 1,200, −3,000). (4) Attach only the 3–4 tools a feature needs (≈−2,100). New total ≈ 3,700 tokens — about a third — then verify answer quality with the evaluation set and enable prompt caching for the stable prefix.

</details>
