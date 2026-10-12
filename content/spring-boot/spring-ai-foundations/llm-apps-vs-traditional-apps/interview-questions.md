# Traditional Applications vs LLM-Powered Applications — Interview Questions

## Beginner

### Q1. What is the biggest behavioural difference between a normal method call and an LLM call?

**Style:** Comparison

<details>
<summary>Answer</summary>

A method returns the result of explicit, deterministic code. An LLM generates text probabilistically: the same prompt can produce different wording, the answer can be confidently wrong, and the structure is only what you asked for, not what is guaranteed. That is why LLM output is parsed and validated before use.

</details>

### Q2. Which tasks are a good fit for an LLM in a backend service?

**Style:** Direct

<details>
<summary>Answer</summary>

Understanding or classifying free text, summarising, drafting replies, extracting fields from unstructured text (followed by validation) and choosing which application tool to call. Exact calculations, authorization decisions and irreversible actions stay in deterministic code.

</details>

## Intermediate

### Q3. Explain the "deterministic shell around a probabilistic core" design.

**Style:** How

<details>
<summary>Answer</summary>

The model call is surrounded by code that is fully predictable. Before the call: validate and limit input, select only the necessary data, enforce authorization, and set timeouts and token limits. After the call: parse into a type, validate values, apply business rules and only then act. The model influences the outcome but never bypasses the checks.

</details>

### Q4. What new failure modes does an LLM add to a service?

**Style:** Scenario

<details>
<summary>Answer</summary>

Hallucinated facts, output that does not match the requested format, refusals, high and variable latency, provider rate limits and outages, per-token cost spikes, prompt injection through user or document text, and behaviour changes when the provider updates the model. Each needs a handling strategy: validation, retries with limits, timeouts, budgets, fallbacks and evaluation.

</details>

### Q5. How do you unit-test a service whose output comes from a model?

**Style:** How

<details>
<summary>Answer</summary>

Replace the model with a deterministic stand-in (a scripted `ChatModel` or a mocked collaborator) and test your code: prompt construction, parsing, validation, fallbacks and error handling. Quality of the real model is checked separately with evaluation datasets and properties (allowed values, required fields), not exact sentences.

</details>

## Advanced

### Q6. A product owner wants the model to approve refunds automatically. How do you respond?

**Style:** Scenario

<details>
<summary>Answer</summary>

Let the model read the request and suggest a decision with a reason, but keep the approval rules in code: amount limits, order state, customer eligibility and fraud checks. Above a threshold or on uncertainty, route to a human. Log the suggestion and the final decision separately so you can measure how often the model's suggestion was right before widening automation.

</details>
