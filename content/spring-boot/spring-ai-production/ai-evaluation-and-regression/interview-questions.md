# AI Evaluation and Regression Testing — Interview Questions

## Beginner

### Q1. Why can't you test AI answers with exact string assertions?

**Style:** Why

<details>
<summary>Answer</summary>

Generated text varies between runs, model versions and providers, even when the answer is correct. Tests should check properties — contains key facts, valid JSON, within length, refuses, cites retrieved sources — or use evaluators.

</details>

### Q2. What is in a good evaluation set?

**Style:** Direct

<details>
<summary>Answer</summary>

Realistic inputs (from real users and tickets), edge cases, must-refuse and adversarial cases (off-topic, injection, other tenants), each labelled with the property the answer must have, stratified by intent and difficulty, versioned with the prompts, and growing with every confirmed failure.

</details>

## Intermediate

### Q3. How do you decide whether a new system prompt can be released?

**Style:** How

<details>
<summary>Answer</summary>

Run the evaluation set against the current (baseline) and new (candidate) configuration with the same model and settings, several times if outputs vary. Compare per case and per category, plus cost and latency. Block release if any category falls below its threshold or regresses beyond an agreed tolerance; investigate per-case failures before deciding.

</details>

### Q4. When do you use an LLM judge, and how do you trust it?

**Style:** Scenario

<details>
<summary>Answer</summary>

When the property can't be checked in code — relevance, groundedness, tone, correctness of free-form explanations. Trust comes from calibration: compare judge verdicts with human labels on a sample, use a strong low-temperature judge with a clear rubric and strict output format, monitor agreement over time, and keep deterministic checks for everything they can cover.

</details>

## Advanced

### Q5. The provider silently updated the model behind your alias and complaints increased. How should your process have caught it, and what do you change?

**Style:** Design

<details>
<summary>Answer</summary>

Pin explicit model versions instead of aliases where available; schedule the evaluation suite to run regularly (nightly) against the production configuration, not only on code changes; alert when category pass rates drop; monitor production quality signals (thumbs-down, refusals, escalations). After the incident: add the complaint cases to the set, compare the old and new model versions, then either adapt prompts (with evaluation) or pin the previous version until fixed.

</details>
