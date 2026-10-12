# Caching, Latency and Streaming

**Module:** Spring AI: Production · **Interview priority:** Sometimes asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Identify where the time goes in an AI request and which levers reduce it.
- Cache answers safely with an advisor and Spring's `Cache` abstraction — and know when not to.
- Distinguish answer caching, semantic caching and provider prompt caching.
- Use streaming to improve perceived latency, with its trade-offs.

## Definition

**Latency** of an AI request = time in your code + retrieval + each model call (time to first token + generation time, which grows with output length) + tool execution. **Caching** avoids repeated work: whole answers (answer cache), similar questions (semantic cache), or the provider's processing of a repeated prompt prefix (prompt caching). **Streaming** sends tokens to the user as they are generated, lowering *perceived* latency without changing total time.

| Technique | Saves | Safe when | Risk |
|-----------|-------|-----------|------|
| Answer cache (exact, normalised key) | Whole model call | Answer depends only on the question and prompt version | Stale or personalised answers served to others |
| Semantic cache (embedding similarity) | Whole model call | High-volume FAQ, strict threshold | Similar ≠ same question ("cancel" vs "don't cancel") |
| Provider prompt caching | Input processing time and price on repeated prefixes | Long stable system prompts/tool definitions first | Provider-specific rules |
| Streaming | Perceived wait | Chat UIs | Harder validation, error handling mid-stream |

## Why It Matters

Users abandon slow assistants; a 10-second spinner feels broken even if the answer is good. Repeated questions (FAQs, popular course topics) waste money when each one calls the model. The right mix of caching, smaller prompts, model choice and streaming makes a feature fast and cheap — the wrong cache leaks one user's answer to another.

## How It Works

Latency levers, roughly in order of impact:

1. **Fewer model calls:** avoid unnecessary query rewriting, tool rounds and retries; cache answers.
2. **Smaller prompts and outputs:** generation time grows with output tokens; input size affects time to first token ([Token Usage](../token-usage-and-cost-control/content.md)).
3. **Faster models** for simple steps ([Model Selection](../model-selection-and-portability/content.md)).
4. **Parallel work:** independent retrievals or tool calls concurrently; virtual threads (`spring.threads.virtual.enabled=true`) make blocking model calls cheap to wait on.
5. **Streaming** for chat UIs ([call() vs stream()](../../spring-ai-chat-client/spring-ai-call-vs-stream/content.md)).

Cache keys must include everything that changes the answer: normalised question, prompt version, model, locale, and the tenant if content differs per tenant. Requests with conversation history or personal data are not cacheable across users.

## Example

An advisor caches answers to stateless questions in a Spring `Cache`, skips requests that carry a conversation id, and stores only completed answers:

```java
import java.util.List;
import java.util.Locale;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.ChatClientRequest;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.chat.client.advisor.api.CallAdvisor;
import org.springframework.ai.chat.client.advisor.api.CallAdvisorChain;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.cache.Cache;
import org.springframework.cache.concurrent.ConcurrentMapCache;
import org.springframework.core.Ordered;

public class AnswerCacheDemo {

    /** Caches answers to stateless FAQ-style questions; never caches conversational requests. */
    static class AnswerCacheAdvisor implements CallAdvisor {
        private final Cache cache;
        private final String promptVersion;

        AnswerCacheAdvisor(Cache cache, String promptVersion) {
            this.cache = cache;
            this.promptVersion = promptVersion;
        }

        static String normalise(String question) {
            return question.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9 ]", "").replaceAll("\\s+", " ").strip();
        }

        @Override
        public ChatClientResponse adviseCall(ChatClientRequest request, CallAdvisorChain chain) {
            if (request.context().containsKey(ChatMemory.CONVERSATION_ID)) {
                return chain.nextCall(request);                       // personal context: don't cache
            }
            String key = promptVersion + ":" + normalise(request.prompt().getUserMessage().getText());
            String cached = cache.get(key, String.class);
            if (cached != null) {
                System.out.println("  cache hit  [" + key + "]");
                var response = new ChatResponse(List.of(new Generation(new AssistantMessage(cached))));
                return ChatClientResponse.builder().chatResponse(response).context(request.context()).build();
            }
            ChatClientResponse response = chain.nextCall(request);
            var result = response.chatResponse().getResult();
            if ("STOP".equalsIgnoreCase(result.getMetadata().getFinishReason()) || result.getMetadata().getFinishReason() == null) {
                cache.put(key, result.getOutput().getText());        // only complete answers
                System.out.println("  cache miss [" + key + "] -> stored");
            }
            return response;
        }

        @Override
        public String getName() {
            return "AnswerCacheAdvisor";
        }

        @Override
        public int getOrder() {
            return Ordered.HIGHEST_PRECEDENCE + 120;
        }
    }

    public static void main(String[] args) {
        ScriptedChatModel model = new ScriptedChatModel()
                .reply("A HashMap stores key-value pairs in buckets.")
                .reply("Based on what you told me, start with HashMap resizing.");
        ChatClient client = ChatClient.builder(model)
                .defaultAdvisors(new AnswerCacheAdvisor(new ConcurrentMapCache("faq"), "tutor-v3"))
                .build();

        for (String q : List.of("What is a HashMap?", "what is a hashmap", "  What is a HASHMAP?? ")) {
            System.out.println(q.strip() + " -> " + client.prompt().user(q).call().content());
        }
        String personal = client.prompt().user("What is a HashMap?")
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, "asha:c-9"))
                .call().content();
        System.out.println("with conversation id -> " + personal);
        System.out.println("Model calls: " + model.prompts().size());
    }
}
```

**Output:**

```text
  cache miss [tutor-v3:what is a hashmap] -> stored
What is a HashMap? -> A HashMap stores key-value pairs in buckets.
  cache hit  [tutor-v3:what is a hashmap]
what is a hashmap -> A HashMap stores key-value pairs in buckets.
  cache hit  [tutor-v3:what is a hashmap]
What is a HASHMAP?? -> A HashMap stores key-value pairs in buckets.
with conversation id -> Based on what you told me, start with HashMap resizing.
Model calls: 2
```

### Code walkthrough

- Three spellings of the same question normalised to one key; only the first called the model.
- The key starts with the prompt version (`tutor-v3`): changing the system prompt automatically invalidates old answers.
- The request with a conversation id bypassed the cache — its answer depends on that learner's history.
- Only complete answers are stored: a `LENGTH`-truncated answer must not be cached. (The course's test double reports no finish reason, which the condition also accepts; with real providers check for `STOP`.)
- The advisor sits at `HIGHEST_PRECEDENCE + 120`, outside memory, retrieval and the tool loop, so a hit skips all of them.

### Streaming to the browser

```java
// Illustrative fragment — Server-Sent Events with Spring MVC (works with virtual threads) or WebFlux
@GetMapping(value = "/api/tutor/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
Flux<String> stream(@RequestParam String question) {
    return tutorClient.prompt().user(question).stream().content();
}
```

Streaming shows the first words quickly; validation, caching and structured output must then work on the aggregated text, and errors can arrive after part of the answer was shown.

## Common Mistakes and Troubleshooting

- **Caching personalised answers globally.** One user's data appears in another's answer. Key by tenant/user or don't cache.
- **Cache keys without the prompt version or model.** Prompt changes don't take effect for cached questions.
- **Semantic cache with a loose threshold.** "How do I cancel my order?" and "How do I not cancel my order?" can be very similar vectors.
- **Caching truncated or failed answers.** Store only `STOP` results that passed validation.
- **Streaming everything.** Batch jobs, structured output and tool-heavy back-office flows gain nothing from streaming.

## Production Considerations

- Use a shared cache (Redis) with TTLs for multi-instance deployments ([Caching and Redis](../../production/caching-and-redis/content.md)); measure hit rate.
- Put stable content (system prompt, tool definitions) first to benefit from provider prompt caching where it exists.
- Track time to first token and total latency separately; set SLOs per feature.
- Pre-compute answers for known popular questions (for example during content publishing).

## Common Interview Traps

- **"Streaming makes the model faster."** It reduces perceived latency; total generation time is the same.
- **"Cache every answer to save money."** Only stateless, non-personal, validated answers with a versioned key.
- **"Prompt caching and answer caching are the same."** Prompt caching is a provider optimisation of input processing; answer caching skips the call entirely.

## Key Takeaways

- Latency: fewer calls, smaller prompts/outputs, faster models, parallelism, streaming.
- Answer cache: normalised question + prompt version (+ tenant), stateless requests only, complete answers only.
- Semantic caches need strict thresholds; provider prompt caching rewards stable prefixes.
- Streaming improves perceived latency but complicates validation and errors.

## Official References

- [ChatClient: streaming responses](https://docs.spring.io/spring-ai/reference/api/chatclient.html)
- [Spring Framework: Cache Abstraction](https://docs.spring.io/spring-framework/reference/integration/cache.html)
- Related: [Spring Cache Abstraction](../../advanced/spring-cache-abstraction/content.md) · [call() vs stream()](../../spring-ai-chat-client/spring-ai-call-vs-stream/content.md) · [Token Usage and Cost Control](../token-usage-and-cost-control/content.md)
