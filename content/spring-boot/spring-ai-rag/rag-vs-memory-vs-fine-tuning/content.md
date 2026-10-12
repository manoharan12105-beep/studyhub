# RAG vs Memory vs Tools vs Fine-Tuning

**Module:** Spring AI: Embeddings and RAG · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Distinguish the ways an application can give a model knowledge or behaviour: prompt, memory, RAG, tools, fine-tuning.
- Choose the right mechanism for a requirement and justify the choice.
- Combine mechanisms in one Spring AI client without confusing their roles.

## Definition

| Mechanism | What it provides | Where it lives | In Spring AI |
|-----------|------------------|----------------|--------------|
| **System prompt** | Stable instructions, persona, rules | Every request | `defaultSystem(...)` |
| **Chat memory** | What *this conversation* said | Per conversation id | `MessageChatMemoryAdvisor`, `VectorStoreChatMemoryAdvisor` |
| **RAG** | Relevant passages from *your documents* | Vector store, per request | `QuestionAnswerAdvisor`, `RetrievalAugmentationAdvisor` |
| **Tools** | *Live data and actions* from your systems | Your services, called by the application | `@Tool`, `ToolCallback` |
| **Fine-tuning** | Changed model *behaviour* (style, format, domain phrasing) | Model weights at the provider | Outside Spring AI; you call the fine-tuned model by name |

## Why It Matters

"Should we fine-tune the model on our documents?" is one of the most common design questions — and usually the wrong first step. Choosing the wrong mechanism leads to stale answers (fine-tuning facts that change), privacy leaks (shared memory), cost explosions (huge prompts) or unsafe actions (RAG where a tool with authorisation was needed).

## How It Works

Decision guide:

```text
Is the information about this conversation?         → memory
Is it in documents that change or are large?        → RAG
Is it live data (balances, stock, order status)?    → tool (read)
Must something happen (book, cancel, send)?         → tool (write, with confirmation)
Is it a stable rule that fits in a paragraph?       → system prompt
Is the gap in style, format or task skill, not facts → fine-tuning (after prompting and examples fail)
```

| Requirement | Best fit | Why not the others |
|-------------|----------|--------------------|
| "Remember my name for this chat" | Memory | RAG/tools are not per-conversation by default |
| "Answer from our 5,000-page handbook" | RAG | Doesn't fit in a prompt; fine-tuning would go stale and can't cite |
| "What's my order status?" | Tool | Live per-user data; RAG copies would be stale and need per-user filters |
| "Always answer in our support tone with a fixed template" | Prompt (+ few-shot); fine-tune only if that fails at scale | Cheaper and reversible first |
| "Know last week's price changes" | RAG or tool | Fine-tuning needs retraining for every change |

Properties compared:

| | Memory | RAG | Tools | Fine-tuning |
|-|--------|-----|-------|-------------|
| Freshness | Live (conversation) | As fresh as ingestion | Live | Frozen at training |
| Citations | — | Yes | Yes (source system) | No |
| Access control | Conversation id | Metadata filters | Authorisation in the tool | None per user |
| Cost per request | History tokens | Embedding + search + context tokens | Extra model round + tool latency | Often higher per-token price; training cost |
| Change effort | None | Re-ingest | Deploy code | Retrain and re-evaluate |

## Example

One tutoring client combines four mechanisms, each for its own job:

```java
// Illustrative fragment
@Bean
ChatClient tutorClient(ChatClient.Builder builder, ChatMemory chatMemory, VectorStore courseNotes,
                       ProgressTools progressTools, TaskExecutor taskExecutor) {
    return builder
            // Prompt: stable rules
            .defaultSystem("You are a patient Java tutor. Answer from the course notes and cite them.")
            .defaultAdvisors(
                    // Memory: this conversation
                    MessageChatMemoryAdvisor.builder(chatMemory).build(),
                    // RAG: course notes, retrieved once per request
                    RetrievalAugmentationAdvisor.builder()
                            .documentRetriever(VectorStoreDocumentRetriever.builder()
                                    .vectorStore(courseNotes).topK(4).similarityThreshold(0.6).build())
                            .taskExecutor(taskExecutor)
                            .order(Ordered.HIGHEST_PRECEDENCE + 250)
                            .build())
            // Tools: live, per-learner data
            .defaultTools(progressTools)
            .build();
}
```

**Expected behaviour:** "What did I ask you earlier?" is answered from memory; "Explain HashMap resizing" from retrieved course notes; "How far am I in Java 101?" by calling the progress tool with the learner id from `ToolContext`. No fine-tuning is needed for any of them; the model would be fine-tuned only if, after prompt and example work, its explanations consistently missed the required teaching style.

### Code walkthrough

- Advisor order puts memory (+200) before retrieval (+250), and both before the tool loop (+300), so history is loaded once and retrieval runs once per request.
- Facts that change (course notes, progress) stay outside the model — in the vector store and the progress service — so updates need no retraining.
- The learner id for the tool comes from `ToolContext` per request ([Validating and Authorising Tool Calls](../../spring-ai-tools-and-advisors/tool-validation-and-authorization/content.md)).

## Common Mistakes and Troubleshooting

- **Fine-tuning to add facts.** Facts go stale, can't be cited, and may still be hallucinated. Use RAG or tools.
- **Using RAG for live per-user data.** Copies of balances or order status are stale and require careful per-user filtering; call a tool.
- **Using memory as a knowledge base.** Memory is per conversation and grows with every turn; shared knowledge belongs in RAG.
- **Putting the whole handbook in the system prompt.** Expensive, slow, and quality drops with very long prompts; retrieve what's relevant.
- **Expecting RAG to make the model follow a format.** Format and style are prompt, structured-output or fine-tuning concerns.

## Production Considerations

- Start with prompt + RAG + tools; consider fine-tuning only with an evaluation set showing a persistent behaviour gap.
- Each mechanism has its own privacy story: memory retention, vector store contents, tool authorisation, training data sent to a provider.
- Measure per-request cost of each layer (history tokens, retrieved tokens, tool rounds).

## Common Interview Traps

- **"Fine-tuning teaches the model our documents."** It changes behaviour; it is a poor, stale knowledge store.
- **"RAG and memory are the same — both use vectors."** Memory is per conversation; RAG is shared knowledge. Vector-backed memory is still memory.
- **"Tools are just RAG over APIs."** Tools can act and must be authorised; RAG only reads indexed copies.

## Key Takeaways

- Conversation → memory; documents → RAG; live data and actions → tools; stable rules → prompt; behaviour gaps → fine-tuning last.
- Freshness, citations and access control usually decide between RAG and tools.
- Real assistants combine several mechanisms, ordered deliberately.

## Official References

- [Retrieval Augmented Generation](https://docs.spring.io/spring-ai/reference/api/retrieval-augmented-generation.html)
- [Chat Memory](https://docs.spring.io/spring-ai/reference/api/chat-memory.html)
- [Tool Calling](https://docs.spring.io/spring-ai/reference/api/tools.html)
- Related: [Chat Memory Advisors](../../spring-ai-tools-and-advisors/chat-memory-advisors/content.md) · [RAG Architecture](../rag-architecture/content.md) · [When Not to Use an LLM](../../spring-ai-advanced/when-not-to-use-an-llm/content.md)
