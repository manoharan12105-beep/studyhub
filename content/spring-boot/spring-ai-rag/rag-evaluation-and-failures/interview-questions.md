# RAG Evaluation and Failure Modes — Interview Questions

## Beginner

### Q1. Name four stages where a RAG answer can go wrong.

**Style:** Direct

<details>
<summary>Answer</summary>

Ingestion (document missing, badly parsed, outdated), chunking (context split or mixed), retrieval (relevant chunk not found or ranked too low, wrong filter), and generation (model ignores context or adds unsupported claims). Augmentation (prompt formatting, too much context) and security (missing filters, injected instructions) are two more.

</details>

### Q2. What does `RelevancyEvaluator` check?

**Style:** Direct

<details>
<summary>Answer</summary>

It asks a judge model whether the response to the query is in line with the provided context, expecting YES or NO, and returns an `EvaluationResponse` with `isPass()` and a score of 1.0 or 0.0.

</details>

## Intermediate

### Q3. How do you tell whether a wrong answer is a retrieval or a generation problem?

**Style:** Debugging

<details>
<summary>Answer</summary>

Look at what was retrieved (log `DOCUMENT_CONTEXT` ids, compare with the labelled relevant ids). If the needed passage was not retrieved, it is an ingestion/chunking/retrieval problem. If it was retrieved and the answer still contradicts it, it is augmentation or generation — check the final prompt, the amount of context and the instructions.

</details>

### Q4. What are the risks of LLM-as-a-judge evaluation?

**Style:** Why

<details>
<summary>Answer</summary>

Judges can be wrong, inconsistent across runs, biased toward their own style or longer answers, and sensitive to prompt wording; they also cost model calls. Spring AI's evaluators parse verdicts strictly (only "yes" passes), so verbose judges look like failures. Mitigate with a low-temperature judge, calibration against human labels, enough cases, and deterministic checks where possible.

</details>

## Advanced

### Q5. Design the evaluation strategy for a RAG feature before launch and after.

**Style:** Design

<details>
<summary>Answer</summary>

Before launch: a versioned set of 50–200 real questions with expected source ids, key facts and must-refuse cases (off-topic, other tenants, injected documents); retrieval metrics in CI on every ingestion/config change; judge-based relevancy and claim-level fact checks before releases with calibrated judges; citation validation as a deterministic gate; human review of a sample. After launch: monitor empty-retrieval, refusal, citation-failure and thumbs-down rates; sample conversations for review; add every confirmed failure to the set; compare metrics before and after any model, prompt, splitter or embedding change.

</details>
