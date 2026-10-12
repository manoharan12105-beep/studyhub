# Embeddings and Semantic Similarity — Interview Questions

## Beginner

### Q1. What is an embedding?

**Style:** Direct

<details>
<summary>Answer</summary>

A fixed-length vector of numbers produced by an embedding model for a piece of text, such that texts with similar meaning have vectors pointing in similar directions. It lets software compare meaning numerically, for semantic search and RAG.

</details>

### Q2. How is similarity between two embeddings usually measured?

**Style:** Direct

<details>
<summary>Answer</summary>

Cosine similarity: the dot product divided by the product of the vector lengths, from −1 to 1 (1 = same direction). Vector databases often use cosine distance = 1 − similarity. For unit-length vectors, cosine similarity equals the dot product.

</details>

## Intermediate

### Q3. You switch from one embedding model to another. What must happen to stored documents?

**Style:** Scenario

<details>
<summary>Answer</summary>

They must all be re-embedded with the new model, typically into a new index or table, before queries use the new model. Vectors from different models live in different spaces (often with different dimensions), so mixing them makes similarity meaningless — usually without any error.

</details>

### Q4. Why is a similarity score of 0.8 not "80% relevant"?

**Style:** Why

<details>
<summary>Answer</summary>

Scores are geometric, not probabilities, and their distribution depends on the model and the data: one model's typical "relevant" score may be 0.4, another's 0.85. Thresholds must be calibrated per model on labelled examples.

</details>

## Advanced

### Q5. What affects the cost and latency of embeddings in a RAG system, and how do you control them?

**Style:** Design

<details>
<summary>Answer</summary>

Ingestion embeds every chunk (one-off plus updates); each query embeds the question (per request). Costs grow with chunk count, re-ingestion frequency and model choice; latency adds one embedding call per request. Controls: batch ingestion, only re-embed changed documents (track content hashes), choose a smaller or shorter-dimension model if quality allows, cache frequent query embeddings, or host a local model. Storage and index memory grow with dimensions × chunks.

</details>
