# Model Selection, Routing and Portability

**Module:** Spring AI: Production · **Interview priority:** Sometimes asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Choose a model for a task by quality, latency, cost, context size, capabilities and data policy.
- Route tasks to different models behind one application-facing interface.
- Keep code portable across providers — and know where portability ends.
- Predict how per-request options interact with client defaults in Spring AI 2.0.

## Definition

**Model selection** decides which model (and provider) serves each task. **Routing** applies that decision at run time, for example a small model for classification and a larger one for explanations. **Portability** is the ability to switch providers with configuration rather than code changes; Spring AI provides it through common abstractions — `ChatModel`, `ChatClient`, portable `ChatOptions`, `EmbeddingModel`, `VectorStore` — while provider-specific features stay in provider-specific options classes (`OpenAiChatOptions`, `AnthropicChatOptions`, …).

## Why It Matters

No single model is best for every task: the most capable model may be 10–50 times the price and several times the latency of a small one that classifies just as well. Providers change prices, deprecate models and have outages; data-residency rules may require a different provider per region. Teams that hard-wire one provider's SDK into every service pay for it at each change.

## How It Works

Selection criteria:

| Criterion | Question |
|-----------|----------|
| Quality | Does it pass *your* evaluation set for this task? |
| Latency | Time to first token and total time at your prompt size |
| Cost | Input/output price × your token profile ([Token Usage](../token-usage-and-cost-control/content.md)) |
| Context window | Fits system prompt + history + retrieval + output? |
| Capabilities | Tool calling, native structured output, vision, audio, streaming |
| Data policy | Retention, training use, region, on-premises requirement |

What is portable in Spring AI and what is not:

| Portable | Provider-specific |
|----------|-------------------|
| `ChatClient` API, advisors, memory, RAG, tools | Exceptions (for example `com.openai.errors.*` in 2.0) |
| `ChatOptions`: model, temperature, maxTokens, topP, stop sequences… | Reasoning effort, service tier, prompt-cache keys, safety settings |
| `Usage` metadata, finish reason (spelling varies) | Rate-limit headers, extra metadata |
| Structured output via format instructions | Native JSON-schema structured output support differs |

Configuration selects providers:

```properties
spring.ai.model.chat=openai          # or anthropic, ollama, google-genai, none
spring.ai.model.embedding=openai
spring.ai.openai.chat.model=gpt-5-mini
```

Many providers and self-hosted servers expose OpenAI-compatible APIs; the OpenAI module can target them with `spring.ai.openai.base-url` — compatibility of advanced features (tools, structured output) must be tested, not assumed.

When two `ChatModel` beans are needed (for example a cheap and a strong model, or two providers), build one `ChatClient` per model through `ChatClientBuilderConfigurer` so observability and customizers still apply ([ChatClient Builder and Defaults](../../spring-ai-chat-client/chatclient-builder-and-defaults/content.md)).

## Example

An `AiGateway` routes tasks to a "fast" or "strong" client; the last part shows what happens to client defaults when a request sets its own options:

```java
import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.ChatOptions;

public class ModelRoutingDemo {

    enum Task { CLASSIFY, EXPLAIN }

    /** Chooses a client per task; callers never see provider classes. */
    static class AiGateway {
        private final ChatClient fast;
        private final ChatClient strong;

        AiGateway(ChatClient fast, ChatClient strong) {
            this.fast = fast;
            this.strong = strong;
        }

        String run(Task task, String input) {
            ChatClient client = switch (task) {
                case CLASSIFY -> fast;
                case EXPLAIN -> strong;
            };
            return client.prompt().user(input).call().content();
        }
    }

    public static void main(String[] args) {
        ScriptedChatModel smallModel = new ScriptedChatModel().reply("COLLECTIONS");
        ScriptedChatModel largeModel = new ScriptedChatModel()
                .reply("A HashMap stores entries in buckets indexed by the key's hash.")
                .reply("Short answer: buckets indexed by hash.");

        AiGateway gateway = new AiGateway(
                ChatClient.builder(smallModel).defaultOptions(ChatOptions.builder().model("small-model").temperature(0.0)).build(),
                ChatClient.builder(largeModel).defaultOptions(ChatOptions.builder().model("large-model").temperature(0.3)).build());

        System.out.println("classify -> " + gateway.run(Task.CLASSIFY, "Topic of: How does HashMap resize?"));
        System.out.println("explain  -> " + gateway.run(Task.EXPLAIN, "How does a HashMap work?"));
        System.out.println("small model received: model=" + smallModel.lastPrompt().getOptions().getModel()
                + " temperature=" + smallModel.lastPrompt().getOptions().getTemperature());

        // Per-request options replace the client defaults (the ChatModel's own defaults fill the gaps)
        ChatClient strong = ChatClient.builder(largeModel)
                .defaultOptions(ChatOptions.builder().model("large-model").temperature(0.3)).build();
        strong.prompt().user("Explain briefly.").options(ChatOptions.builder().maxTokens(50)).call().content();
        ChatOptions sent = largeModel.lastPrompt().getOptions();
        System.out.println("with .options(maxTokens 50): model=" + sent.getModel() + " temperature=" + sent.getTemperature()
                + " maxTokens=" + sent.getMaxTokens());
    }
}
```

**Output:**

```text
classify -> COLLECTIONS
explain  -> A HashMap stores entries in buckets indexed by the key's hash.
small model received: model=small-model temperature=0.0
with .options(maxTokens 50): model=scripted-model temperature=null maxTokens=50
```

### Code walkthrough

- Services depend on `AiGateway` and a `Task`, not on a provider: swapping the strong model is a configuration change in one place.
- The small model received its client defaults (`small-model`, temperature 0.0) — deterministic, cheap classification.
- **Gotcha:** the last request set only `maxTokens(50)`, and the model received `scripted-model` (the `ChatModel`'s own default) and no temperature: in 2.0.1 per-request options **replace** the client's `defaultOptions` instead of merging with them. In a real application the provider's configured defaults (for example `spring.ai.openai.chat.model`) fill the gaps — so a request override can silently switch a feature back to the globally configured model. Repeat the fields you need, or derive a separate client.

## Common Mistakes and Troubleshooting

- **Choosing by leaderboard.** Public benchmarks don't measure your prompts, data and format; run your evaluation set on candidates.
- **Provider types everywhere.** `OpenAiChatOptions` and `com.openai` exceptions in many services make switching expensive; keep them in one adapter or configuration class.
- **Assuming OpenAI-compatible means identical.** Tool calling, structured output, streaming usage and finish reasons differ; test each feature.
- **Silent model changes via aliases.** A model alias can point to a newer snapshot; pin explicit versions where reproducibility matters.
- **Request options dropping client defaults** (shown above).

## Production Considerations

- Keep a per-task "model card" in configuration: model, options, prompt version, evaluation scores, cost per 1,000 requests.
- Re-run evaluations before switching models or upgrading versions; compare cost and latency, not only quality ([AI Evaluation and Regression](../ai-evaluation-and-regression/content.md)).
- Plan deprecations: providers retire models on announced dates.
- For data-sensitive tenants, route to a self-hosted model (for example via Ollama) by tenant configuration.
- Embedding models are not interchangeable at run time — switching requires re-embedding ([Embeddings](../../spring-ai-rag/embeddings-and-semantic-similarity/content.md)).

## Common Interview Traps

- **"Spring AI makes providers 100% interchangeable."** The core API is portable; options, exceptions, capabilities and output quality are not.
- **"Always use the best model."** Route by task; most traffic can use smaller models.
- **"Changing the chat model is like changing the embedding model."** Chat models can be switched per request; embedding models are tied to stored vectors.

## Key Takeaways

- Select per task with your own evaluation set, plus latency, cost, context, capability and data-policy checks.
- Route behind an application interface; keep provider classes in one place.
- Spring AI's portable layer: `ChatClient`, `ChatOptions`, advisors, memory, RAG, tools.
- In 2.0.1, request `options(...)` replace client `defaultOptions` — repeat what you need.

## Official References

- [Chat Model API](https://docs.spring.io/spring-ai/reference/api/chatmodel.html)
- [ChatClient: multiple chat models](https://docs.spring.io/spring-ai/reference/api/chatclient.html)
- [Chat Models Comparison](https://docs.spring.io/spring-ai/reference/api/chat/comparison.html)
- Related: [Models and Providers](../../spring-ai-foundations/spring-ai-models-and-providers/content.md) · [Resilience](../ai-resilience-and-provider-errors/content.md) · [Token Usage and Cost Control](../token-usage-and-cost-control/content.md)
