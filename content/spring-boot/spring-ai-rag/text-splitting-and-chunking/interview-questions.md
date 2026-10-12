# Text Splitting and Chunking — Interview Questions

## Beginner

### Q1. Why split documents before embedding them?

**Style:** Why

<details>
<summary>Answer</summary>

One vector cannot represent many topics precisely, embedding models have input limits, and the prompt can only hold a few passages. Chunks make each vector specific to one idea and let retrieval send only the relevant parts.

</details>

### Q2. How does `TokenTextSplitter` decide where a chunk ends?

**Style:** How

<details>
<summary>Answer</summary>

It takes up to `chunkSize` tokens (default 800), then cuts back to the last `.`, `?`, `!` or newline — but only if the shortened chunk still has at least `minChunkSizeChars` characters (default 350). The next chunk starts where the previous one ended; there is no overlap.

</details>

## Intermediate

### Q3. What goes wrong with very small chunks?

**Style:** Scenario

<details>
<summary>Answer</summary>

Facts lose their conditions and subjects ("After 14 days, refunds are not available" without saying for whom), pronouns lose their antecedents, and more chunks must be retrieved to cover one answer. Retrieval may return a misleading fragment that the model then states confidently.

</details>

### Q4. A chunk-size change improved answers in a demo. How do you roll it out?

**Style:** How

<details>
<summary>Answer</summary>

Re-ingest all sources with the new settings into a new index (old and new chunks must not mix), run the labelled retrieval test set against both indexes, compare hit rate/MRR and answer quality, then switch the application to the new index and delete the old one. Record the splitter settings with the index.

</details>

## Advanced

### Q5. Design chunking for API reference documentation with prose, tables and code samples.

**Style:** Design

<details>
<summary>Answer</summary>

Split by structure first: one document per endpoint or heading section (Markdown reader or HTML sections), code samples as separate documents with the endpoint name in metadata, tables kept whole or converted to one row per line with header labels. Then apply a token splitter only to oversized sections, with the section title prepended to each chunk's text so fragments keep context. Metadata: product, version, endpoint, section. Evaluate with real developer questions and tune sizes per document type.

</details>
