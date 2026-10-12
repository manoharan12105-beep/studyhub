# The Document Ingestion Pipeline (ETL) — Interview Questions

## Beginner

### Q1. Name the three stages of Spring AI's ETL pipeline and their interfaces.

**Style:** Direct

<details>
<summary>Answer</summary>

Extract with a `DocumentReader` (for example `MarkdownDocumentReader`, `PagePdfDocumentReader`, `TikaDocumentReader`), transform with a `DocumentTransformer` (for example `TokenTextSplitter`), load with a `DocumentWriter` — every `VectorStore` is one. They are `Supplier`, `Function` and `Consumer` respectively, so they compose: `vectorStore.accept(splitter.apply(reader.get()))`.

</details>

### Q2. Why add metadata during ingestion?

**Style:** Why

<details>
<summary>Answer</summary>

Metadata such as `source`, `tenant`, `course`, `version` and access labels is copied to every chunk and enables filtering (per tenant or permission), citations (which document and section), and updates/deletion by source. It cannot be used later if it was never stored.

</details>

## Intermediate

### Q3. How do you make an ingestion job safe to run twice?

**Style:** How

<details>
<summary>Answer</summary>

Either delete the existing chunks of a source before adding new ones (`vectorStore.delete("source == 'x.md'")`), or give chunks deterministic ids (hash of source + chunk index) so re-adding replaces them in stores that upsert. Add content hashes so unchanged sources are skipped, and remove chunks whose source was deleted.

</details>

### Q4. What does `MarkdownDocumentReaderConfig.withIncludeCodeBlock(false)` do?

**Style:** Behavior

<details>
<summary>Answer</summary>

It puts each fenced code block in its own `Document` with `category=code_block` (and the code language as metadata) instead of including the code in the surrounding section's document. It does not drop code blocks.

</details>

## Advanced

### Q5. Design ingestion for 50,000 company PDFs with department-level permissions.

**Style:** Design

<details>
<summary>Answer</summary>

A scheduled or event-driven batch job (not in the request path) that: detects new/changed/deleted files by content hash; extracts with `PagePdfDocumentReader` (OCR first for scanned files), stripping headers and footers; attaches metadata — source path, page, department/permission labels, version, ingestion date; splits into chunks sized for the embedding model; replaces each source's chunks; batches embedding calls within rate limits; records runs and failures for retry. Query time filters by the user's departments. Re-ingest everything into a new index when the splitter or embedding model changes, compare retrieval metrics, then switch.

</details>
