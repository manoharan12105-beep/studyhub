# The Advisors API

**Module:** Spring AI: Tools and Advisors · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Explain what an advisor is and how the advisor chain wraps a `ChatClient` call.
- Write an advisor with `BaseAdvisor` (`before`/`after`) and with `CallAdvisor` (full control).
- Pass per-request parameters to advisors through the advisor context.
- Short-circuit a request without calling the model.

## Definition

An **advisor** is an interceptor around a `ChatClient` call. It receives a `ChatClientRequest` (the prompt plus a shared context map), can change it, passes it to the next advisor in the chain, and can change the `ChatClientResponse` on the way back. Spring AI's memory, RAG, tool loop and safeguard features are all advisors.

| Interface | Methods you write | Use when |
|-----------|-------------------|----------|
| `BaseAdvisor` | `before(request, chain)`, `after(response, chain)`, `getOrder()` | Changing the request and/or response; works for both `call()` and `stream()` |
| `CallAdvisor` | `adviseCall(request, chain)`, `getName()`, `getOrder()` | Deciding whether to call the chain at all (blocking calls) |
| `StreamAdvisor` | `adviseStream(request, chain)` returning `Flux<ChatClientResponse>` | The same for `stream()` |

## Why It Matters

Cross-cutting AI behaviour — logging, usage tracking, guardrails, memory, retrieval — should not be copied into every service method. Advisors are the Spring AI equivalent of servlet filters or AOP aspects: write the behaviour once and attach it to clients with `.defaultAdvisors(...)` or to single requests with `.advisors(...)`.

## How It Works

```text
client.prompt()...call()
   │ ChatClientRequest (prompt + context)
   ▼
 Advisor order -100 ──▶ Advisor order 0 ──▶ ... ──▶ ChatModel
   ▲                                                  │
   └──────────── ChatClientResponse (chatResponse + context) ◀┘
```

- **Order:** `getOrder()` — lower values run first on the way in and last on the way out (details in [Advisor Ordering and Transformations](../advisor-ordering-and-transformations/content.md)).
- **Context:** `request.context()` is a mutable map shared by all advisors for one call. Set values per request with `.advisors(a -> a.param("feature", "tutor"))`; built-in advisors read keys such as `ChatMemory.CONVERSATION_ID`.
- **Short-circuit:** a `CallAdvisor` that does not call `chain.nextCall(request)` must build and return its own `ChatClientResponse`.
- **Registration:** `.defaultAdvisors(...)` on the builder applies to every request; `.advisors(...)` on a request adds to them.

## Example

An audit advisor built on `BaseAdvisor` and an input-limit advisor that refuses long questions without calling the model:

```java
import java.util.List;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.ChatClientRequest;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.chat.client.advisor.api.AdvisorChain;
import org.springframework.ai.chat.client.advisor.api.BaseAdvisor;
import org.springframework.ai.chat.client.advisor.api.CallAdvisor;
import org.springframework.ai.chat.client.advisor.api.CallAdvisorChain;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;

public class AdvisorApiDemo {

    /** Observes every call: records the feature name and the token usage. */
    static class UsageAuditAdvisor implements BaseAdvisor {

        @Override
        public ChatClientRequest before(ChatClientRequest request, AdvisorChain chain) {
            System.out.println("audit before: feature=" + request.context().get("feature"));
            return request;
        }

        @Override
        public ChatClientResponse after(ChatClientResponse response, AdvisorChain chain) {
            var usage = response.chatResponse().getMetadata().getUsage();
            System.out.println("audit after: promptTokens=" + usage.getPromptTokens()
                    + " completionTokens=" + usage.getCompletionTokens());
            return response;
        }

        @Override
        public int getOrder() {
            return 0;
        }
    }

    /** Short-circuits: answers without calling the model when the question is too long. */
    static class InputLimitAdvisor implements CallAdvisor {
        private final int maxChars;

        InputLimitAdvisor(int maxChars) {
            this.maxChars = maxChars;
        }

        @Override
        public ChatClientResponse adviseCall(ChatClientRequest request, CallAdvisorChain chain) {
            String question = request.prompt().getUserMessage().getText();
            if (question.length() > maxChars) {
                var refusal = new ChatResponse(List.of(new Generation(
                        new AssistantMessage("Please shorten your question to " + maxChars + " characters."))));
                return ChatClientResponse.builder().chatResponse(refusal).context(request.context()).build();
            }
            return chain.nextCall(request);
        }

        @Override
        public String getName() {
            return "InputLimitAdvisor";
        }

        @Override
        public int getOrder() {
            return -100;      // runs before the audit advisor
        }
    }

    public static void main(String[] args) {
        ScriptedChatModel model = new ScriptedChatModel().reply("A HashMap stores key-value pairs.");
        ChatClient client = ChatClient.builder(model)
                .defaultAdvisors(new InputLimitAdvisor(40), new UsageAuditAdvisor())
                .build();

        String ok = client.prompt().user("What is a HashMap?")
                .advisors(a -> a.param("feature", "tutor"))
                .call().content();
        System.out.println("answer: " + ok);

        String blocked = client.prompt().user("Explain every collection class in java.util with examples")
                .call().content();
        System.out.println("answer: " + blocked);
        System.out.println("model calls: " + model.prompts().size());
    }
}
```

**Output:**

```text
audit before: feature=tutor
audit after: promptTokens=5 completionTokens=7
answer: A HashMap stores key-value pairs.
answer: Please shorten your question to 40 characters.
model calls: 1
```

The token numbers come from the course's `ScriptedChatModel`, which reports fixed usage; a real provider reports real counts.

### Code walkthrough

- `UsageAuditAdvisor` only implements `before` and `after`; `BaseAdvisor` supplies the call and stream plumbing that invokes the rest of the chain between them.
- The `feature` parameter set with `.advisors(a -> a.param(...))` arrived in `request.context()`.
- `InputLimitAdvisor` (order -100) ran first. For the long question it returned its own response, so neither the audit advisor nor the model ran — no "audit" lines for the second request, and only one model call in total.
- The short-circuit copies `request.context()` into the response so downstream code still sees the context.

## Common Mistakes and Troubleshooting

- **Forgetting `chain.nextCall(request)`** in a `CallAdvisor` — the rest of the chain and the model never run. Only skip it on purpose.
- **Returning a `ChatClientResponse` without a `chatResponse`** when short-circuiting — callers of `.content()` get nothing useful. Build a `ChatResponse` with a `Generation`.
- **Implementing only `CallAdvisor` and then using `.stream()`.** The advisor is silently skipped for streaming (checked: a `CallAdvisor` printed nothing on a `.stream()` request). Implement `StreamAdvisor` too, or use `BaseAdvisor`.
- **Expecting `BaseAdvisor.after` to see every streamed chunk.** For `.stream()`, `after` runs only for chunks that carry a finish reason (normally the last one), not for each token.
- **Blocking I/O in a stream advisor** on the event-loop thread. Offload it or keep advisors cheap.

## Production Considerations

- Keep advisors stateless; per-call data belongs in the context map.
- Built-in advisors (memory, `QuestionAnswerAdvisor`, `ToolCallingAdvisor`, `SafeGuardAdvisor`) are good references for your own.
- Every advisor runs on every call it is attached to — measure their latency.
- Advisor executions are observed (spans per advisor) when Micrometer observation is enabled ([Observability](../../spring-ai-production/spring-ai-observability/content.md)).

## Common Interview Traps

- **"Advisors are only for RAG."** Memory, the tool loop, guardrails and logging are advisors too.
- **"`.advisors(...)` replaces the default advisors."** It adds to them.
- **"An advisor must call the model."** It can short-circuit with its own response.

## Key Takeaways

- Advisors wrap `ChatClient` calls like filters: change the request, continue the chain, change the response.
- `BaseAdvisor` for before/after logic; `CallAdvisor`/`StreamAdvisor` for full control.
- The context map carries per-request parameters between advisors.
- Order decides who runs first; a short-circuit stops the chain.

## Official References

- [Advisors API](https://docs.spring.io/spring-ai/reference/api/advisors.html)
- [ChatClient: Advisors](https://docs.spring.io/spring-ai/reference/api/chatclient.html)
- Related: [Advisor Ordering and Transformations](../advisor-ordering-and-transformations/content.md) · [Chat Memory Advisors](../chat-memory-advisors/content.md) · [Reusable AI Behaviours](../reusable-ai-behaviours/content.md)
