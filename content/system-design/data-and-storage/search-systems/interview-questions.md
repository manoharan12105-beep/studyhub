# Search Systems — Interview Questions

## Beginner

### Q1. Why is `LIKE '%term%'` a poor way to implement search?

**Style:** Why

<details>
<summary>Answer</summary>

A leading wildcard prevents use of a normal index, so the database scans every row — slow on large tables. It also does no ranking, stemming, synonym handling or typo tolerance, and cannot compute facets efficiently.

</details>

### Q2. What is an inverted index?

**Style:** Direct

<details>
<summary>Answer</summary>

A mapping from each term (after analysis such as lower-casing and stemming) to the list of documents (and positions) where it appears. A query looks up its terms' lists and combines them, then ranks matching documents by a relevance score.

</details>

## Intermediate

### Q3. How do you keep Elasticsearch in sync with your primary database?

**Style:** How

<details>
<summary>Answer</summary>

Treat the database as the source of truth and propagate changes asynchronously: write an event in the same transaction (transactional outbox) or capture changes from the database log (CDC), publish them to a queue, and have an indexer update documents idempotently by ID and version. Run periodic reconciliation and be able to rebuild the index from scratch.

</details>

### Q4. Why shouldn't a search engine be the primary data store?

**Style:** Why not

<details>
<summary>Answer</summary>

Search engines are optimised for querying derived, denormalised documents; they lack multi-document transactions and relational constraints, may lose recently acknowledged writes in some failure scenarios depending on configuration, and changing mappings often requires reindexing. Keeping authoritative data in a database lets you rebuild the index whenever needed.

</details>

## Advanced

### Q5. How does a search query run across a sharded index, and what affects its latency?

**Style:** How

<details>
<summary>Answer</summary>

A coordinating node sends the query to one copy of every shard; each shard finds and scores its top results; the coordinator merges them and fetches the documents for the final page. Latency depends on the slowest shard (tail latency), the number of shards contacted, deep pagination (each shard must return many results to merge) and expensive aggregations. Replicas spread read load.

</details>

### Q6. A product's price changed, but search results show the old price for a minute. Is that acceptable?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Usually yes for display, because the index is an eventually consistent copy, as long as correctness is enforced at the critical point: the cart and checkout read the current price from the source of truth. If minute-long lag is not acceptable, reduce pipeline lag, refresh the index sooner, or fetch prices for the displayed results from the database or a cache at query time.

</details>
