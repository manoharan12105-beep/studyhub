# Token Usage and Cost Control

**Module:** Spring AI: Production · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Explain where tokens come from in a Spring AI request and which parts grow over time.
- Read token usage from responses and estimate tokens before a call.
- Enforce per-user or per-tenant budgets with an advisor and cap output with options.
- Reduce cost without reducing quality: context trimming, model choice, caching.

## Definition

Model providers bill per **token** — roughly ¾ of an English word — separately for **input** (prompt) and **output** (completion) tokens, with output usually priced higher. Reasoning models also bill hidden reasoning tokens as output. Spring AI reports usage in `ChatResponse.getMetadata().getUsage()` (`getPromptTokens()`, `getCompletionTokens()`, `getTotalTokens()`) and provides `TokenCountEstimator` (`JTokkitTokenCountEstimator`) to estimate counts locally.

```text
cost of one call = input tokens × input price + output tokens × output price
                   (prices per million tokens, from the provider's price list)
```

## Why It Matters

AI cost scales with traffic *and* with prompt size, which grows silently: longer chat history, more retrieved chunks, more tool definitions, bigger system prompts. A feature that costs cents in testing can cost thousands a month in production. Budgets, limits and measurement are part of the design, not an afterthought.

## How It Works

What makes up the input of one request:

| Part | Grows with | Control |
|------|-----------|---------|
| System prompt | Rules you add | Keep it short; move reference text to RAG |
| Chat history | Conversation length | Window size, summaries ([Long Conversations](../../spring-ai-prompts-and-memory/long-conversation-management/content.md)) |
| Retrieved context | topK × chunk size | Threshold, fewer/smaller chunks ([Chunking](../../spring-ai-rag/text-splitting-and-chunking/content.md)) |
| Tool definitions | Number of tools | Attach only needed tools ([Registering Tools](../../spring-ai-tools-and-advisors/tool-registration-and-descriptions/content.md)) |
| Tool results and rounds | Each tool round resends the whole history | Concise tool results, call limits |
| Structured-output schema | Size of the target type | Small DTOs |

Output is bounded by options:

```properties
# OpenAI: output limit (reasoning models use max-completion-tokens, which also covers reasoning tokens)
spring.ai.openai.chat.max-completion-tokens=800
# Anthropic requires a max-tokens value for every request
spring.ai.anthropic.chat.max-tokens=800
```

Per client or request: `ChatOptions.builder().maxTokens(150)`. A response cut off by the limit has finish reason `LENGTH` — check it ([Responses and Errors](../../spring-ai-chat-client/spring-ai-responses-and-errors/content.md)).

**Framework vs provider:** Spring AI reports what the provider returns and estimates with a local tokenizer (`CL100K_BASE` by default; `O200K_BASE` is available). Exact counts, prices, prompt-caching discounts and reasoning-token rules are provider- and model-specific.

## Example

A budget advisor estimates the prompt before calling the model, refuses when the user's daily budget would be exceeded, and records reported usage afterwards:

```java
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.ChatClientRequest;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.chat.client.advisor.api.CallAdvisor;
import org.springframework.ai.chat.client.advisor.api.CallAdvisorChain;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.tokenizer.JTokkitTokenCountEstimator;
import org.springframework.ai.tokenizer.TokenCountEstimator;
import org.springframework.core.Ordered;

public class TokenBudgetDemo {

    /** Per-user daily token budget: estimate before the call, record real usage after it. */
    static class TokenBudgetAdvisor implements CallAdvisor {
        private final Map<String, Integer> usedToday = new ConcurrentHashMap<>();
        private final TokenCountEstimator estimator = new JTokkitTokenCountEstimator();
        private final int dailyLimit;

        TokenBudgetAdvisor(int dailyLimit) {
            this.dailyLimit = dailyLimit;
        }

        @Override
        public ChatClientResponse adviseCall(ChatClientRequest request, CallAdvisorChain chain) {
            String user = (String) request.context().get("userId");
            int estimate = estimator.estimate(request.prompt().getContents());
            int used = usedToday.getOrDefault(user, 0);
            if (used + estimate > dailyLimit) {
                var refusal = new ChatResponse(List.of(new Generation(
                        new AssistantMessage("Daily AI budget reached. Try again tomorrow."))));
                return ChatClientResponse.builder().chatResponse(refusal).context(request.context()).build();
            }
            ChatClientResponse response = chain.nextCall(request);
            Usage usage = response.chatResponse().getMetadata().getUsage();
            usedToday.merge(user, usage.getTotalTokens(), Integer::sum);
            System.out.printf("  %s: prompt estimate=%d, usage reported: prompt=%d completion=%d, used today=%d/%d%n",
                    user, estimate, usage.getPromptTokens(), usage.getCompletionTokens(), usedToday.get(user), dailyLimit);
            return response;
        }

        @Override
        public String getName() {
            return "TokenBudgetAdvisor";
        }

        @Override
        public int getOrder() {
            return Ordered.HIGHEST_PRECEDENCE + 100;
        }
    }

    public static void main(String[] args) {
        String longNotes = "A HashMap stores entries in buckets chosen by the key's hash code. ".repeat(20);
        ScriptedChatModel model = new ScriptedChatModel()
                .reply("A HashMap maps keys to values.")
                .reply("Buckets hold entries with the same hash index; collisions form lists or trees.")
                .reply("Use a TreeMap when you need sorted keys.");   // for ravi
        ChatClient client = ChatClient.builder(model)
                .defaultSystem("You are a concise Java tutor.")
                .defaultOptions(ChatOptions.builder().maxTokens(150))       // cap every answer
                .defaultAdvisors(new TokenBudgetAdvisor(330))
                .build();

        String[][] requests = {
                {"asha", "What is a HashMap?"},
                {"asha", "Summarise my notes: " + longNotes},
                {"asha", "When should I use a TreeMap?"},
                {"ravi", "When should I use a TreeMap?"}};
        for (String[] r : requests) {
            String answer = client.prompt().user(r[1])
                    .advisors(a -> a.param("userId", r[0]))
                    .call().content();
            System.out.println(r[0] + " -> " + answer);
        }
        System.out.println("Model calls: " + model.prompts().size()
                + ", maxTokens sent: " + model.lastPrompt().getOptions().getMaxTokens());
    }
}
```

**Output:**

```text
  asha: prompt estimate=11, usage reported: prompt=11 completion=7, used today=18/330
asha -> A HashMap maps keys to values.
  asha: prompt estimate=293, usage reported: prompt=293 completion=16, used today=327/330
asha -> Buckets hold entries with the same hash index; collisions form lists or trees.
asha -> Daily AI budget reached. Try again tomorrow.
  ravi: prompt estimate=13, usage reported: prompt=13 completion=9, used today=22/330
ravi -> Use a TreeMap when you need sorted keys.
Model calls: 3, maxTokens sent: 150
```

The course's `ScriptedChatModel` reports usage with the same local tokenizer, so estimate and usage match here. Real providers count differently (message framing, system prompt handling, their own tokenizers) — treat local estimates as approximate and record the provider's numbers.

### Code walkthrough

- One "summarise my notes" request used 293 prompt tokens — 26 times the short question. Pasted documents and long history dominate input cost.
- The third request would have exceeded the 330-token budget, so the advisor answered without calling the model (3 model calls for 4 requests); another user was unaffected.
- The advisor runs at `HIGHEST_PRECEDENCE + 100` so refused requests never reach memory, retrieval or the tool loop. It sits outside the tool loop, which is also the right place to read usage: in a separate check with one tool round, an advisor outside the loop saw the **accumulated** usage of both model calls (total 15 = 5 + 10), while an advisor at order 0 (inside the loop) saw each round separately.
- `defaultOptions(ChatOptions.builder().maxTokens(150))` capped output for every request; the model received `maxTokens=150`.

## Common Mistakes and Troubleshooting

- **No output limit.** One verbose answer (or a reasoning model thinking at length) costs more than many short ones.
- **Ignoring tool rounds.** Every round resends system prompt, history, tool definitions and previous tool results.
- **Budgets in memory.** The demo's map is per instance and resets on restart; production budgets live in Redis or a database with atomic increments.
- **Estimating with the wrong tokenizer.** Use the encoding closest to your model, and add a safety margin.
- **Truncated answers shown as complete.** Check finish reason `LENGTH` when a limit is set.

## Production Considerations

- Track tokens per feature, user/tenant and model; Spring AI's observations export `gen_ai.client.token.usage` metrics ([Observability](../spring-ai-observability/content.md)).
- Route by difficulty: a small, cheap model for classification, extraction and query rewriting; a larger model only where quality needs it ([Model Selection](../model-selection-and-portability/content.md)).
- Use provider prompt caching for long, stable prefixes (system prompt, tool definitions) where available — keep the stable part first. Spring AI exposes provider options such as `spring.ai.anthropic.chat.cache-options` and `spring.ai.openai.chat.prompt-cache-key`.
- Cache whole answers for repeated questions only when they are not personalised ([Caching, Latency and Streaming](../ai-caching-latency-streaming/content.md)).
- Alert on cost anomalies (a prompt-injection loop or a bug can multiply calls).

## Common Interview Traps

- **"Cost depends on the length of the answer."** Input usually dominates: history, context and tool definitions are resent on every call.
- **"Token = word."** Tokens are sub-word pieces; code and non-English text often use more tokens per character.
- **"The local estimate is the bill."** The provider's reported usage is the bill.

## Key Takeaways

- Usage: `ChatResponse.getMetadata().getUsage()`; estimate locally with `JTokkitTokenCountEstimator`.
- Input grows with history, retrieval, tools and rounds — control each.
- Cap output (`maxTokens` / `max-completion-tokens`) and check for `LENGTH`.
- Enforce budgets early in the advisor chain; store them durably; monitor by feature and tenant.

## Official References

- [Chat Model API: Usage metadata](https://docs.spring.io/spring-ai/reference/api/chatmodel.html)
- [OpenAI Chat properties](https://docs.spring.io/spring-ai/reference/api/chat/openai-chat.html)
- [Observability](https://docs.spring.io/spring-ai/reference/observability/index.html)
- Related: [LLM Fundamentals for Developers](../../spring-ai-foundations/llm-fundamentals-for-developers/content.md) · [The Advisors API](../../spring-ai-tools-and-advisors/spring-ai-advisors-api/content.md)
