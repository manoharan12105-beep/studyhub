# Retrieval Quality: Measuring and Improving Search — Interview Questions

## Beginner

### Q1. How do you measure retrieval quality?

**Style:** How

<details>
<summary>Answer</summary>

With a labelled set of realistic questions and the chunk ids that answer each. For each setting, compute hit rate (recall@k: share of questions with a relevant chunk in the top k), MRR (average 1/rank of the first relevant chunk) and the average context size sent. Compare settings on these numbers.

</details>

### Q2. What is the trade-off when increasing `topK`?

**Style:** Compare

<details>
<summary>Answer</summary>

Higher topK raises the chance that a relevant chunk is included (recall) but adds tokens, cost and irrelevant distractors that can worsen answers. A similarity threshold limits the noise; tune both together.

</details>

## Intermediate

### Q3. What do `RewriteQueryTransformer`, `CompressionQueryTransformer` and `MultiQueryExpander` do?

**Style:** Compare

<details>
<summary>Answer</summary>

`RewriteQueryTransformer` asks a chat model to rewrite a vague or verbose query for search. `CompressionQueryTransformer` combines conversation history and a follow-up ("and the other one?") into a standalone query. `MultiQueryExpander` generates several query variants (default 3, plus the original) whose results are joined. Each costs an extra model call per request.

</details>

### Q4. When would you add hybrid search?

**Style:** Scenario

<details>
<summary>Answer</summary>

When questions contain exact tokens embeddings handle poorly — product codes, error codes, names, version numbers — or rare jargon. Combining keyword (full-text/BM25) results with vector results, then joining and re-ranking, catches both exact matches and paraphrases.

</details>

## Advanced

### Q5. Users report that answers are often incomplete. Walk through your investigation.

**Style:** Debugging

<details>
<summary>Answer</summary>

Collect failing questions and log what was retrieved (ids, scores). Classify: relevant chunk not retrieved at all (vocabulary gap, bad chunking, missing document, wrong filter), retrieved but ranked too low (topK/threshold, need re-ranking), retrieved but answer still wrong (prompt/generation problem). Add the questions to the labelled set, then try targeted fixes — chunking changes with re-ingestion, query rewriting for follow-ups, hybrid search for identifiers, re-ranking — measuring hit rate/MRR before and after, and checking for regressions.

</details>
