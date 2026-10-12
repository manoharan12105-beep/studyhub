# The Document Ingestion Pipeline (ETL) — Practice

### P1. Which interface?

**Difficulty:** Easy · **Type:** MCQ

Which interface does `VectorStore` extend so it can be the last stage of an ETL pipeline?

- A) `DocumentReader`
- B) `DocumentTransformer`
- C) `DocumentWriter`
- D) `EmbeddingModel`

<details>
<summary>Answer</summary>

**Answer:** C) `DocumentWriter`

</details>

### P2. Count after re-runs

**Difficulty:** Easy · **Type:** Behavior

A job produces 3 chunks from one file and calls only `vectorStore.add(chunks)` (random ids). It runs three times. How many chunks are stored? What if it first calls `vectorStore.delete("source == 'notes.md'")` each time?

<details>
<summary>Answer</summary>

9 without the delete; 3 with it.

</details>

### P3. Write a PDF pipeline

**Difficulty:** Medium · **Type:** Coding

Write the code that reads `handbook.pdf` page by page, adds `department=hr` metadata, splits into 400-token chunks and stores them.

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
var reader = new PagePdfDocumentReader(new FileSystemResource("handbook.pdf"));
List<Document> pages = reader.get().stream()
        .map(page -> page.mutate().metadata("department", "hr").metadata("source", "handbook.pdf").build())
        .toList();
List<Document> chunks = TokenTextSplitter.builder().withChunkSize(400).build().apply(pages);
vectorStore.delete("source == 'handbook.pdf'");
vectorStore.add(chunks);
```

`PagePdfDocumentReader` records `page_number` and `file_name`; the splitter copies all metadata to each chunk. Requires `spring-ai-pdf-document-reader`.

Note: in 2.0.1 the builder from `mutate()` shares the original document's metadata map — a check showed that `d.mutate().metadata("department", "hr").build()` also added `department` to `d`. Harmless here, but surprising if you keep the original documents. `page.getMetadata().put("department", "hr")` states the same effect honestly.

</details>

### P4. Answers quote page footers

**Difficulty:** Medium · **Type:** Debugging

Retrieved chunks often contain "Confidential — Page 12 of 80 — ACME Corp". Answers cite it as content. Where do you fix this?

<details>
<summary>Answer</summary>

In the transform stage: remove repeated headers/footers before splitting — for PDFs, configure the reader's `ExtractedTextFormatter` (for example deleting the top/bottom lines of each page) or add a cleaning `DocumentTransformer`. Re-ingest the affected sources and re-check retrieval.

</details>

### P5. Permissions

**Difficulty:** Hard · **Type:** Scenario

HR documents are now in the same vector store as public FAQs. A regular employee asks about salaries and the assistant quotes an HR-only document. What went wrong in ingestion and retrieval, and how do you fix both?

<details>
<summary>Answer</summary>

Ingestion stored HR chunks without access metadata (or retrieval ignored it), so similarity search returned them to everyone. Add an access label (for example `visibility=hr`) to every chunk at ingestion — re-ingesting existing sources — and apply a filter built from the authenticated user's groups on every search (`visibility in ['public', ...userGroups]`). Add tests that a regular user can never retrieve HR chunks.

</details>
