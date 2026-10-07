# Search Systems

**Module:** Data and Storage · **Interview priority:** Frequently asked

## What Is It?

A **search system** answers free-text queries ("red running shoes under 3000") quickly across large collections, ranks results by **relevance**, tolerates typos and word forms, and computes **facets** (counts by brand, size, price range). **Elasticsearch** and its open-source fork **OpenSearch**, both built on the Apache Lucene library, are the common choices; Solr and managed services (Algolia) are alternatives.

## Why It Exists

Relational databases are poor at text search:

- `WHERE name LIKE '%shoe%'` cannot use a normal B-tree index (leading wildcard), so it scans every row.
- It cannot rank results by relevance, match "running" to "run", or forgive "sheos".
- Facet counts across many filters on millions of rows are expensive.

(PostgreSQL's built-in full-text search covers simpler needs well; dedicated engines win at scale and for relevance tuning.)

## How It Works

### The inverted index

Instead of "document → words", a search engine stores "word → documents containing it", built after **analysis** (lower-casing, splitting into tokens, removing very common words, reducing words to stems):

```text
Documents                                   Inverted index (after analysis)
1: "Red running shoes"                       red   → 1, 3
2: "Blue trail shoe"                         run   → 1          ("running" stemmed to "run")
3: "Red leather jacket"                      shoe  → 1, 2       ("shoes" stemmed to "shoe")
                                             blue  → 2
                                             trail → 2
                                             leather → 3, jacket → 3
Query "red shoes" → red ∩ shoe → document 1 ranks highest (matches both); 2 and 3 match one term each
```

Lookups become set operations on short lists, and relevance scoring (such as BM25, which favours rare terms that appear often in a document) orders the results.

### Search beside the database, not instead of it

```text
App ──writes──► PostgreSQL (source of truth)
                    │ change events (outbox / change data capture)
                    ▼
              Indexer worker ──► Elasticsearch / OpenSearch ◄── search queries from the app
```

- The database remains the **source of truth**; the search index is a **derived copy**, updated asynchronously, typically seconds behind.
- Results are re-checked against the source where it matters (price and stock at checkout).
- The index can be rebuilt from the database at any time — useful when you change analysis rules.

### Scaling a search cluster (awareness)

An index is split into **shards** spread over nodes (parallel search, more data) with **replica shards** for availability and read throughput. A query fans out to all shards and merges results, so latency depends on the slowest shard — keep shard counts and sizes reasonable.

**Think about it:** a user updates a product's title, then immediately searches for the new title and gets no result. Is the system broken?

<details>
<summary>Answer</summary>

Not necessarily: the search index is updated asynchronously and is eventually consistent with the database (plus the engine's own refresh interval, often about a second). Show the user's own just-edited item from the database (read-your-writes for the editor), and alert only if lag grows beyond the expected seconds.

</details>

## When Not to Use

Exact lookups by ID or key, small datasets, or simple prefix search on a few thousand rows do not need a separate search cluster — a database index or PostgreSQL's full-text search is simpler and avoids synchronisation.

## Common Traps

> [!WARNING]
> **Common trap:** using Elasticsearch as the primary database. It is built for search over derived data; keep authoritative, transactional data in a database and rebuild the index from it.

## Interview Follow-up

- *"How do you keep the search index in sync with the database?"* Publish changes reliably (transactional outbox or change data capture) to a queue; an indexer applies them idempotently (by document ID and version); periodically reconcile or rebuild.

## Key Takeaways

- Search engines use inverted indexes (term → documents) plus text analysis and relevance scoring.
- `LIKE '%term%'` does not scale and cannot rank; dedicated search (Elasticsearch/OpenSearch) or database full-text search can.
- Keep the database as source of truth; feed the search index asynchronously and expect seconds of lag.
- Search clusters scale with shards and replicas; queries fan out across shards.
