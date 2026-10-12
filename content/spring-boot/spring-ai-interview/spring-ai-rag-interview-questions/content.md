# Spring AI RAG Interview Questions

**Module:** Spring AI: Interview Preparation · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

> [!NOTE]
> **Reference topic.** The questions are in the Interview Questions tab. This page lists what they cover.

## Learning Objectives

- Answer questions on embeddings, vector stores, chunking, filters, retrieval quality, the RAG advisors, grounding and evaluation.
- Explain RAG failures and how you would diagnose them.
- Compare RAG with memory, tools and fine-tuning.

## Definition

This bank covers Module E:

| Area | Lessons to revise |
|------|-------------------|
| Embeddings and stores | [Embeddings](../../spring-ai-rag/embeddings-and-semantic-similarity/content.md), [VectorStore](../../spring-ai-rag/vectorstore-abstraction/content.md), [pgvector](../../spring-ai-rag/pgvector-with-spring-ai/content.md) |
| Ingestion and chunking | [Ingestion Pipeline](../../spring-ai-rag/document-ingestion-pipeline/content.md), [Chunking](../../spring-ai-rag/text-splitting-and-chunking/content.md) |
| Retrieval | [Metadata Filtering](../../spring-ai-rag/vector-metadata-filtering/content.md), [Retrieval Quality](../../spring-ai-rag/retrieval-quality/content.md) |
| Generation and evaluation | [RAG Architecture](../../spring-ai-rag/rag-architecture/content.md), [Grounding](../../spring-ai-rag/rag-grounding-and-citations/content.md), [RAG Evaluation](../../spring-ai-rag/rag-evaluation-and-failures/content.md) |

## How It Works

For a RAG question, locate the problem in the pipeline: ingestion → chunking → embedding → retrieval (threshold, topK, filters) → augmentation → generation → evaluation. Most failures happen in retrieval, not in the model.

## Key Takeaways

- Know the defaults:
  - `SearchRequest`: topK 4, threshold 0.0.
  - `TokenTextSplitter`: chunk size 800 tokens, no overlap.
  - `ContextualQueryAugmenter`: `allowEmptyContext` false.
- Diagnose retrieval first, generation second.

## Official References

- [Spring AI Retrieval Augmented Generation](https://docs.spring.io/spring-ai/reference/api/retrieval-augmented-generation.html)
- Related: [Core Interview Questions](../spring-ai-core-interview-questions/content.md) · [Production Interview Questions](../spring-ai-production-interview-questions/content.md)
