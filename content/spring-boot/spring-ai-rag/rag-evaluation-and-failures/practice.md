# RAG Evaluation and Failure Modes — Practice

### P1. Parse the verdict

**Difficulty:** Easy · **Type:** Behavior

The judge model replies `Yes.` to a `RelevancyEvaluator` request. What is `isPass()`?

<details>
<summary>Answer</summary>

`false` — the evaluator only passes when the trimmed reply equals "yes" (any case); the full stop makes it fail.

</details>

### P2. Classify the failure

**Difficulty:** Easy · **Type:** MCQ

The right passage is in the store, but for "How do I reset MFA?" the retriever returns chunks about passwords. Which stage failed?

- A) Ingestion
- B) Retrieval
- C) Generation
- D) Security

<details>
<summary>Answer</summary>

**Answer:** B) Retrieval

</details>

### P3. Write a fact check

**Difficulty:** Medium · **Type:** Coding

Write code that checks the claim "Refresh tokens last 30 days" against retrieved documents `docs` using a judge `ChatClient.Builder judgeBuilder`.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
FactCheckingEvaluator factCheck = FactCheckingEvaluator.builder(judgeBuilder).build();
EvaluationResponse result = factCheck.evaluate(new EvaluationRequest(docs, "Refresh tokens last 30 days"));
if (!result.isPass()) {
    log.warn("Unsupported claim: {}", result.getFeedback());
}
```

</details>

### P4. Quality dropped after a release

**Difficulty:** Medium · **Type:** Debugging

After a release that changed the chunk size, the nightly relevancy pass rate dropped from 91% to 74%. How do you find the cause?

<details>
<summary>Answer</summary>

Compare retrieval metrics (hit rate, MRR) for the old and new indexes on the same labelled set; if retrieval dropped, inspect failing questions' chunks (conditions split, mixed topics) and adjust chunking. If retrieval is unchanged, compare final prompts — larger chunks may push out relevant passages or exceed context budgets. Also check that the judge model and prompt were unchanged, so the drop is real.

</details>

### P5. Must-refuse cases

**Difficulty:** Hard · **Type:** Scenario

Product asks for proof that the assistant never answers from another tenant's documents and refuses off-topic questions. What evaluation cases and checks do you add?

<details>
<summary>Answer</summary>

Cases: questions whose only matching documents belong to another tenant (expected: no retrieval, refusal), off-topic questions (expected: refusal), documents containing injected instructions (expected: instructions ignored). Checks: assert retrieved document metadata contains only the caller's tenant (deterministic, no judge needed); assert the response is a refusal (phrase check or judge); run as part of CI for every retrieval or filter change and include them in release gates.

</details>
