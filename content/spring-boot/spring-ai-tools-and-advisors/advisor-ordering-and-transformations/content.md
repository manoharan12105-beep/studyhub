# Advisor Ordering and Transformations

**Module:** Spring AI: Tools and Advisors · **Interview priority:** Sometimes asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Predict the execution order of several advisors on the request and on the response.
- Choose orders for your own advisors relative to the built-in ones.
- Transform a request (system message, user message, context) and a response (answer text) without mutating shared objects.

## Definition

Each advisor has an **order** (`getOrder()`, lower = higher priority). The chain behaves like a **stack**: the advisor with the lowest order runs first on the request and last on the response. Registration order is irrelevant; only `getOrder()` counts. **Transformations** create modified copies of the request or response with `mutate()` builders rather than changing them in place.

## Why It Matters

Order decides real behaviour: whether a guardrail runs before memory is loaded, whether redaction happens before or after logging, whether memory sees tool calls. Ordering bugs are silent — every advisor runs, just in the wrong sequence.

## How It Works

```text
request ──▶ order 10 ──▶ order 20 ──▶ ... ──▶ ChatModel
response ◀── order 10 ◀── order 20 ◀── ... ◀──┘
```

Default orders of built-in advisors (2.0.1), in execution order:

| Advisor | Default order | Position |
|---------|---------------|----------|
| `MessageChatMemoryAdvisor`, `VectorStoreChatMemoryAdvisor` | `HIGHEST_PRECEDENCE + 200` | Outside the tool loop — once per request |
| `ToolCallingAdvisor` (auto-registered) | `HIGHEST_PRECEDENCE + 300` | The loop |
| `SafeGuardAdvisor`, `QuestionAnswerAdvisor` | 0 | **Inside** the loop — every model round |
| The final model call | Always last | |

`HIGHEST_PRECEDENCE` is `Integer.MIN_VALUE`, so +200 and +300 are large negative numbers that run **before** anything with order 0 — and every advisor with an ordinary order such as 0, 10 or 100 sits inside the tool loop. Checked: with one tool round, a `QuestionAnswerAdvisor` at its default order searched the vector store twice (once per model call); at `HIGHEST_PRECEDENCE + 250` it searched once and the same context stayed in the user message for both calls.

Rules of thumb:

- **Guardrails and input limits:** very low order (for example `HIGHEST_PRECEDENCE + 100`), outermost, so blocked requests reach neither memory nor the model.
- **Memory:** default +200 — before retrieval and outside the tool loop.
- **Once-per-request work** (retrieval, request rewriting): between +200 and +300, for example `HIGHEST_PRECEDENCE + 250`.
- **Per-round behaviour** (logging every model call, memory that must store tool steps): above +300 — inside the loop.
- **Response redaction:** lower order than any logger that must see only redacted text — on the way back, lower orders run later.

Transformation helpers:

| Goal | API |
|------|-----|
| Change the system message | `request.prompt().augmentSystemMessage(system -> ...)` |
| Change the user message | `request.prompt().augmentUserMessage(user -> ...)` |
| Replace the prompt | `request.mutate().prompt(newPrompt).build()` |
| Add a context value | `request.mutate().context("key", value).build()` |
| Replace the answer | `ChatResponse.builder().from(old).generations(...)`, then `response.mutate().chatResponse(...).build()` |

## Example

A request transformer (order 10) adds a rule to the system message; a response transformer (order 20) masks e-mail addresses. They are registered in the "wrong" order on purpose:

```java
import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.ChatClientRequest;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.chat.client.advisor.api.AdvisorChain;
import org.springframework.ai.chat.client.advisor.api.BaseAdvisor;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;

public class AdvisorOrderDemo {

    /** Request transformation: adds a rule to the system message. */
    static class HouseRulesAdvisor implements BaseAdvisor {
        @Override
        public ChatClientRequest before(ChatClientRequest request, AdvisorChain chain) {
            System.out.println("HouseRules.before   (order 10)");
            return request.mutate()
                    .prompt(request.prompt().augmentSystemMessage(system ->
                            system.mutate().text(system.getText() + "\nAnswer in at most two sentences.").build()))
                    .build();
        }

        @Override
        public ChatClientResponse after(ChatClientResponse response, AdvisorChain chain) {
            System.out.println("HouseRules.after    (order 10)");
            return response;
        }

        @Override
        public int getOrder() {
            return 10;
        }
    }

    /** Response transformation: masks e-mail addresses before the caller sees the answer. */
    static class RedactionAdvisor implements BaseAdvisor {
        @Override
        public ChatClientRequest before(ChatClientRequest request, AdvisorChain chain) {
            System.out.println("Redaction.before    (order 20)");
            return request;
        }

        @Override
        public ChatClientResponse after(ChatClientResponse response, AdvisorChain chain) {
            System.out.println("Redaction.after     (order 20)");
            String text = response.chatResponse().getResult().getOutput().getText();
            String masked = text.replaceAll("[\\w.+-]+@[\\w-]+\\.[\\w.]+", "[email]");
            var chatResponse = ChatResponse.builder()
                    .from(response.chatResponse())
                    .generations(java.util.List.of(new Generation(new AssistantMessage(masked))))
                    .build();
            return response.mutate().chatResponse(chatResponse).build();
        }

        @Override
        public int getOrder() {
            return 20;
        }
    }

    public static void main(String[] args) {
        ScriptedChatModel model = new ScriptedChatModel().reply("Ask your tutor at maria.lopez@example.edu for help.");
        ChatClient client = ChatClient.builder(model)
                .defaultSystem("You are a study assistant.")
                .defaultAdvisors(new RedactionAdvisor(), new HouseRulesAdvisor())   // registration order does not matter
                .build();

        String answer = client.prompt().user("Who can help me with recursion?").call().content();
        System.out.println("System message the model saw: " + model.lastPrompt().getSystemMessage().getText().replace("\n", " / "));
        System.out.println("Answer: " + answer);
    }
}
```

**Output:**

```text
HouseRules.before   (order 10)
Redaction.before    (order 20)
Redaction.after     (order 20)
HouseRules.after    (order 10)
System message the model saw: You are a study assistant. / Answer in at most two sentences.
Answer: Ask your tutor at [email] for help.
```

### Code walkthrough

- Although `RedactionAdvisor` was registered first, `HouseRulesAdvisor` (order 10) ran first on the request and last on the response — the stack shape.
- `augmentSystemMessage` returned a new `Prompt` whose system message has the extra rule; `request.mutate().prompt(...)` produced a new request. Nothing shared was modified.
- The redaction rebuilt the `ChatResponse` with `from(...)`, keeping its metadata (usage, model id) and replacing only the generation. Note that building a fresh `AssistantMessage` drops any tool calls or message metadata on the original output — copy them if a later step needs them.
- Any advisor with an order **below** 20 (for example a logger at order 15) would see the redacted text on the way back; one above 20 would see the raw e-mail address.
- Orders 10 and 20 are inside the tool loop. This request used no tools; with tools, both advisors would run on every round and the redaction would also see the intermediate tool-call responses (see P5 in the practice).

## Common Mistakes and Troubleshooting

- **Two advisors with the same order.** Their relative order is not something to rely on; give each a distinct order.
- **A guardrail at order 0 running after memory.** Memory (+200) runs first, so it records the blocked exchange. Checked with `SafeGuardAdvisor` and `MessageChatMemoryAdvisor`: with the guard at order 0, memory held `[USER: Send me the leaked paper, ASSISTANT: I can't help with that request.]`; with the guard at `Ordered.HIGHEST_PRECEDENCE + 100`, memory stayed empty. In both cases the model was not called.
- **Expecting a logger at `HIGHEST_PRECEDENCE` to log once per tool round.** It is outside the loop and logs once per request.
- **Mutating the incoming `Prompt`'s message list.** Build new objects with the `mutate()`/`augment*` helpers.
- **Rewriting a streaming response.** For `.stream()`, each chunk must be transformed — or the aggregated response only (see [The Advisors API](../spring-ai-advisors-api/content.md)); masking across chunk boundaries needs buffering.

## Production Considerations

- Document the order of every advisor in one place (constants such as `Orders.GUARDRAIL = HIGHEST_PRECEDENCE + 100`).
- Test the final prompt and the final answer with a fake model, as in the example — order bugs show up as wrong prompts.
- Redaction of model output is a safety net, not a guarantee; prevent sensitive data from reaching the prompt in the first place ([AI Logging and Sensitive Data](../../spring-ai-production/ai-logging-and-sensitive-data/content.md)).

## Common Interview Traps

- **"Advisors run in registration order."** They run by `getOrder()`.
- **"The lowest order also handles the response first."** It handles the response last.
- **"Order 0 is the first advisor."** Memory (+200 above `Integer.MIN_VALUE`) and the tool loop run before order 0, so an order-0 advisor runs on every tool round.

## Key Takeaways

- Lower order = earlier on the request, later on the response.
- Built-in defaults: memory at +200, tool loop at +300, safeguard and QA at 0.
- Above +300 — including plain orders like 0 — means inside the tool loop: runs every round.
- Transform with `augmentSystemMessage`, `augmentUserMessage`, `mutate()` and `ChatResponse.builder().from(...)`.

## Official References

- [Advisors API: Advisor Order](https://docs.spring.io/spring-ai/reference/api/advisors.html)
- [Tool Calling: ToolCallingAdvisor and advisor placement](https://docs.spring.io/spring-ai/reference/api/tools.html)
- Related: [The Advisors API](../spring-ai-advisors-api/content.md) · [Chat Memory Advisors](../chat-memory-advisors/content.md) · [Reusable AI Behaviours](../reusable-ai-behaviours/content.md)
