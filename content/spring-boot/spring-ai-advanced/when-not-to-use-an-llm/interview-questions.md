# When Not to Use an LLM — Interview Questions

## Beginner

### Q1. Give three tasks where an LLM is the wrong tool.

**Style:** Direct

<details>
<summary>Answer</summary>

Exact calculations (totals, dates, tax), guaranteed rule enforcement (validation, permissions, eligibility) and lookups of current records by id or filter. Code, databases and search are exact, fast, cheap and testable for these.

</details>

### Q2. What is "deterministic first"?

**Style:** Direct

<details>
<summary>Answer</summary>

Answer everything that can be computed or looked up with code first, and use the model only for what remains genuinely language-shaped — or only for a sub-step such as classifying intent or phrasing the final answer.

</details>

## Intermediate

### Q3. A product manager wants an LLM to decide refund eligibility. What do you propose?

**Style:** Scenario

<details>
<summary>Answer</summary>

Encode eligibility rules in code (purchase date, progress, licence type) so decisions are consistent, auditable and testable. Use the model to understand the customer's free-text request (classify intent, extract the order id) and to explain the decision politely, citing the policy. Escalate unclear cases to a human.

</details>

### Q4. How do you decide whether an AI feature is worth building?

**Style:** How

<details>
<summary>Answer</summary>

Define success metrics, build a simple non-AI baseline (rules, search, form), measure it, then prototype the AI version on the same evaluation set and compare quality, latency, cost, risk and maintenance. Build the AI feature only where it clearly beats the baseline — often as a hybrid.

</details>

## Advanced

### Q5. Redesign an "AI grade calculator" that sometimes reports wrong averages.

**Style:** Design

<details>
<summary>Answer</summary>

Compute grades in Java from stored scores and weighting rules (unit-tested, `BigDecimal` where needed). Expose the computation as a tool (`calculateGrade(courseId)` with identity from `ToolContext`) so the assistant can answer "what's my grade?" by calling it; the model only phrases the answer and explains how weighting works. Remove any path where the model computes numbers itself, and add evaluation cases asserting that answers quote the tool's exact result.

</details>
