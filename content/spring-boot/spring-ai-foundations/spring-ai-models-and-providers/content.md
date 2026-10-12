# Chat Models, Embedding Models and Model Providers

**Module:** Spring AI: Foundations · **Interview priority:** Core · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Distinguish chat models from embedding models by input, output and use.
- Pick a provider starter and configure its chat and embedding model.
- Run several providers in one application and choose which one auto-configuration uses.
- Know which capabilities depend on the provider and model rather than on Spring AI.

## Definition

A **chat model** takes a list of messages and generates a message (text, and optionally tool calls). An **embedding model** takes text and returns a fixed-length vector of numbers that represents its meaning, used for similarity search. A **model provider** is the service or runtime that hosts the model — a cloud API (OpenAI, Anthropic, Google, Mistral, Amazon Bedrock …) or a local runtime (Ollama). Spring AI ships one implementation module and one Boot **starter** per provider.

## Why It Matters

Almost every AI feature combines both kinds of model: RAG embeds documents and questions with an embedding model, then answers with a chat model. Choosing providers affects cost, latency, data residency, privacy (cloud vs local) and available features. Knowing the starters and the selection properties avoids the most common startup failures.

## How It Works

| | Chat model | Embedding model |
|--|-----------|-----------------|
| Spring AI interface | `ChatModel` | `EmbeddingModel` |
| Input | Messages (system, user, assistant, tool) | One or more texts |
| Output | `ChatResponse` with an `AssistantMessage` | `float[]` per text (fixed dimensions) |
| Typical size of output | Variable-length text | 384–3,072 numbers depending on the model |
| Used for | Answering, summarising, extracting, tool use | Semantic search, clustering, RAG retrieval, de-duplication |
| Billed by | Input + output tokens | Input tokens |

A starter brings the provider client, the auto-configuration for the model beans and the configuration properties. Adding `spring-ai-starter-model-openai`, for example, can create an `OpenAiChatModel`, an `OpenAiEmbeddingModel`, an image model, audio models and a moderation model — each one can be switched off.

## Provider Starters (Spring AI 2.0.1)

| Provider | Starter | Notes |
|----------|---------|-------|
| OpenAI (and OpenAI-compatible endpoints) | `spring-ai-starter-model-openai` | Chat, embedding, image, speech, transcription, moderation; uses the official `openai-java` SDK in 2.0 |
| Anthropic | `spring-ai-starter-model-anthropic` | Chat (Claude models) |
| Google Gemini | `spring-ai-starter-model-google-genai`, `…-google-genai-embedding` | Chat and embeddings |
| Mistral AI | `spring-ai-starter-model-mistral-ai` | Chat, embedding, moderation |
| Amazon Bedrock | `spring-ai-starter-model-bedrock-converse`, `spring-ai-starter-model-bedrock` | Converse API for chat; Titan/Cohere embeddings |
| DeepSeek | `spring-ai-starter-model-deepseek` | Chat |
| Ollama (local) | `spring-ai-starter-model-ollama` | Chat and embeddings on your machine |
| ONNX Transformers (in-process) | `spring-ai-starter-model-transformers` | Local embeddings without a server |

Many other services expose an **OpenAI-compatible API** (Groq, NVIDIA and others); the OpenAI module can call them by changing `spring.ai.openai.base-url`. Capabilities differ per provider — check the official [chat model comparison](https://docs.spring.io/spring-ai/reference/api/chat/comparison.html) before relying on vision, audio, tool calling or native JSON output.

## Configuring Chat and Embedding Models

Model names are provider-specific strings. Set them explicitly instead of relying on defaults, because defaults can change between releases (in 2.0.1 the OpenAI defaults are `gpt-5-mini` for chat and `text-embedding-ada-002` for embeddings).

```properties
# OpenAI (cloud)
spring.ai.openai.api-key=${OPENAI_API_KEY}
spring.ai.openai.chat.model=gpt-5-mini
spring.ai.openai.embedding.model=text-embedding-3-small
```

```yaml
# Ollama (local): run "ollama pull llama3.2" and "ollama pull nomic-embed-text" first
spring:
  ai:
    ollama:
      base-url: http://localhost:11434
      chat:
        model: llama3.2
        temperature: 0.2
      embedding:
        model: nomic-embed-text
```

In 2.0 the properties are **flat**: `spring.ai.openai.chat.model`, not the 1.x form `spring.ai.openai.chat.options.model`. The old `.options.` keys are still declared in 2.0.1 but marked deprecated; do not rely on them — move every key to the flat form when you upgrade.

## Several Providers in One Application

When two starters are on the classpath, both try to create beans of the same type. Select the active provider per model type with the top-level `spring.ai.model.*` properties:

```properties
# Use Anthropic for chat and OpenAI for embeddings
spring.ai.model.chat=anthropic
spring.ai.model.embedding=openai
spring.ai.anthropic.api-key=${ANTHROPIC_API_KEY}
spring.ai.openai.api-key=${OPENAI_API_KEY}
spring.ai.openai.embedding.model=text-embedding-3-small
```

Setting a type to `none` disables it (`spring.ai.model.image=none`). If you genuinely need two chat models at once — a cheap one for classification and a stronger one for answers — build two `ChatClient` beans from the two concrete model beans ([ChatClient.Builder and Defaults](../../spring-ai-chat-client/chatclient-builder-and-defaults/content.md)).

## Example

A service that uses both model types: the embedding model compares texts, the chat model explains the result.

```java
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.stereotype.Service;

@Service
class SimilarQuestionService {

    private final EmbeddingModel embeddingModel;
    private final ChatClient chatClient;

    SimilarQuestionService(EmbeddingModel embeddingModel, ChatClient.Builder builder) {
        this.embeddingModel = embeddingModel;
        this.chatClient = builder.build();
    }

    double similarity(String a, String b) {
        float[] va = embeddingModel.embed(a);
        float[] vb = embeddingModel.embed(b);
        double dot = 0, na = 0, nb = 0;
        for (int i = 0; i < va.length; i++) {
            dot += va[i] * vb[i];
            na += va[i] * va[i];
            nb += vb[i] * vb[i];
        }
        return dot / (Math.sqrt(na) * Math.sqrt(nb));
    }

    String explainDifference(String a, String b) {
        return chatClient.prompt()
                .user("In one sentence, how do these two questions differ?\n1. " + a + "\n2. " + b)
                .call()
                .content();
    }
}
```

### Code walkthrough

- `EmbeddingModel` and `ChatClient.Builder` are both auto-configured by the active starter(s); the service does not know which provider is behind them.
- `embed(String)` returns a `float[]`; the loop computes **cosine similarity** (explained in [Embeddings and Similarity](../../spring-ai-rag/embeddings-and-semantic-similarity/content.md)).
- The chat model is used only for the human-readable explanation.

**Expected behaviour:** "How do I reset my password?" and "I forgot my login password" score high (close to 1); "How do I reset my password?" and "What is your refund policy?" score clearly lower. Exact numbers depend on the embedding model, so never hard-code a threshold without measuring it on your own data.

## Common Mistakes and Troubleshooting

- **Two starters, ambiguous beans.** Startup fails with *"required a single bean, but 2 were found"* for `ChatModel` or `EmbeddingModel` (this happens, for example, with the OpenAI and Ollama starters together and the pgvector starter needing one `EmbeddingModel`). Set `spring.ai.model.chat` and `spring.ai.model.embedding`.
- **Embedding model disabled but a vector store needs one.** With `spring.ai.model.embedding=none`, a vector store starter fails with *"required a bean of type 'org.springframework.ai.embedding.EmbeddingModel' that could not be found"*.
- **Changing the embedding model after indexing.** Vectors from different embedding models are not comparable, and dimensions often differ; re-embed all documents.
- **Assuming a capability.** A model that does not support tools or images rejects the request or ignores the feature. Check the comparison page and the model card.
- **Ollama model not pulled.** Ollama returns an error until the model is downloaded; Spring AI can pull models on startup with `spring.ai.ollama.init.pull-model-strategy` (default `never`).

## Production Considerations

- **Data handling:** cloud providers receive your prompts; check data-retention terms, regions and contracts. Local models keep data on your infrastructure but need GPU capacity and operations.
- **Cost and latency:** use small, cheap models for classification and routing; reserve large models for hard tasks ([Model Selection](../../spring-ai-production/model-selection-and-portability/content.md)).
- **Pin model versions** where the provider offers dated snapshots, so behaviour does not change silently.

## Common Interview Traps

- **"An embedding model can answer questions."** It only maps text to vectors; a chat model generates answers.
- **"Any two embeddings can be compared."** Only embeddings from the same model (and dimension) are comparable.
- **"Spring AI decides which models support images."** The provider and model do; Spring AI only passes the media.

## Key Takeaways

- Chat models generate messages; embedding models produce vectors for similarity.
- One starter per provider; select providers with `spring.ai.model.chat` / `.embedding` and configure models with flat 2.0 properties.
- Capabilities, limits, prices and data handling are provider decisions — compare before choosing.

## Official References

- [Chat model comparison](https://docs.spring.io/spring-ai/reference/api/chat/comparison.html)
- [Embeddings API](https://docs.spring.io/spring-ai/reference/api/embeddings.html)
- [OpenAI chat](https://docs.spring.io/spring-ai/reference/api/chat/openai-chat.html) · [Ollama chat](https://docs.spring.io/spring-ai/reference/api/chat/ollama-chat.html) · [Anthropic chat](https://docs.spring.io/spring-ai/reference/api/chat/anthropic-chat.html)
- [Upgrade notes: configuration properties flattening](https://docs.spring.io/spring-ai/reference/upgrade-notes.html)
