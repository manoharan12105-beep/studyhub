# Grounding and Citations — Interview Questions

## Beginner

### Q1. What does "grounded" mean for a RAG answer?

**Style:** Direct

<details>
<summary>Answer</summary>

Every claim in the answer is supported by the context that was provided to the model. An answer that adds facts from the model's general knowledge — even true ones — is not grounded in the sources.

</details>

### Q2. Why can a RAG system still hallucinate?

**Style:** Why

<details>
<summary>Answer</summary>

Retrieval may miss the relevant passage, retrieved passages may be partial or contradictory, and the model can blend context with prior knowledge, misread a passage or invent details and sources. The prompt asks for grounding; nothing in the model enforces it.

</details>

## Intermediate

### Q3. How do you get citations from a Spring AI RAG pipeline?

**Style:** How

<details>
<summary>Answer</summary>

Give each passage a stable label with a custom `documentFormatter` on `ContextualQueryAugmenter` (for example `[pol-4] (title) text`), instruct the model in the system message to cite ids, then parse the answer's ids and compare them with `RetrievalAugmentationAdvisor.DOCUMENT_CONTEXT`. Render titles and links in the UI from the retrieved documents' metadata.

</details>

### Q4. A citation check passes. Is the answer correct?

**Style:** Scenario

<details>
<summary>Answer</summary>

Not necessarily. The check only proves the cited ids were provided. The claim might still misstate the passage or cite the wrong one. For important answers, check each claim against its cited passage (for example with `FactCheckingEvaluator` or a structured second pass), and collect user feedback.

</details>

## Advanced

### Q5. Design citation handling for a compliance assistant where unsupported statements are unacceptable.

**Style:** Design

<details>
<summary>Answer</summary>

Request structured output: a list of statements, each with source ids. Validate that ids exist in the retrieved set and run a claim-level fact check per statement against its sources; drop or flag unsupported statements, and return a fixed "no reliable answer" if nothing survives. Show quotes and links from metadata, never model-written URLs. Log question, sources, statements, check results and reviewer decisions; sample answers for human review and track unsupported-claim rates as a release metric.

</details>
