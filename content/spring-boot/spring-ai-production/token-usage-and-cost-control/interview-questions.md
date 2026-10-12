# Token Usage and Cost Control — Interview Questions

## Beginner

### Q1. How do you read token usage in Spring AI?

**Style:** How

<details>
<summary>Answer</summary>

From the full response: `chatClient.prompt()...call().chatResponse().getMetadata().getUsage()`, which gives prompt (input), completion (output) and total tokens as reported by the provider. Spring AI's observations also export them as the `gen_ai.client.token.usage` metric.

</details>

### Q2. Why is input usually the bigger cost in chat applications?

**Style:** Why

<details>
<summary>Answer</summary>

Every call resends the system prompt, the conversation history, retrieved context, tool definitions and previous tool results; these grow with conversation length and features, while answers are usually short. Each tool round resends everything again.

</details>

## Intermediate

### Q3. How would you enforce a per-tenant monthly token budget?

**Style:** Design

<details>
<summary>Answer</summary>

An advisor near the start of the chain reads the tenant from the advisor context (set from the authenticated user), checks the remaining budget in a shared store (Redis/DB) using a local token estimate of the prompt, and short-circuits with a clear message when exhausted. After the call it atomically adds the provider-reported usage. Account for tool rounds, stream completions and concurrent requests (a request may overshoot slightly), and expose remaining budget to admins.

</details>

### Q4. A response ends mid-sentence. What do you check?

**Style:** Debugging

<details>
<summary>Answer</summary>

The finish reason: `LENGTH` means the output limit (`maxTokens` / `max-completion-tokens`) was reached. For reasoning models, reasoning tokens consume the same limit. Raise the limit, ask for shorter answers, or continue the answer — and never show a truncated answer as complete.

</details>

## Advanced

### Q5. Your AI feature's monthly cost tripled with flat traffic. How do you investigate and fix it?

**Style:** Scenario

<details>
<summary>Answer</summary>

Break down token metrics by feature, model, tenant and input vs output. Typical causes: longer histories (memory window raised or summaries disabled), larger RAG context (topK/chunk size changes), new tools added to defaults, more tool rounds (looping), a switch to a pricier or reasoning model, retries multiplying calls, or abuse. Fix the specific driver — window and summaries, retrieval threshold, per-request tools, call limits, model routing, output caps, prompt caching of stable prefixes — and add cost alerts and per-tenant budgets.

</details>
