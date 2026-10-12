# The Tool-Calling Loop: Errors, Limits and Direct Returns

**Module:** Spring AI: Tools and Advisors · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Explain who runs the tool loop in Spring AI 2.0 (`ToolCallingAdvisor`) and where it sits in the advisor chain.
- Predict what happens when a tool throws, when a tool is called too often and when a tool uses `returnDirect`.
- Configure tool-call limits and exception handling with properties or a custom `ToolCallingManager`.
- Write a user-controlled loop with `ChatModel` and `ToolCallingManager` when you need full control.

## Definition

The **tool-calling loop** repeats "call the model → execute the requested tools → send the results back" until the model answers without tool calls. In Spring AI 2.0 the loop lives in **`ToolCallingAdvisor`**, which `ChatClient` registers automatically at order `HIGHEST_PRECEDENCE + 300`. The advisor delegates the actual execution to a **`ToolCallingManager`**. A `ChatModel` called directly never executes tools; it only returns the tool calls the provider asked for.

## Why It Matters

The loop is where tool calling goes wrong in production: a tool throws and the whole request fails, the model calls `search` forty times, or a tool's result reaches the user in a format nobody expected. Knowing the defaults — and where to change them — is the difference between a demo and a service.

## How It Works

```text
ChatClient.call()
  └─ advisors with order < +300   (run once per user request)
      └─ ToolCallingAdvisor (+300)
          loop:
            ├─ advisors with order > +300, including plain orders such as 0  (run on every round)
            ├─ ChatModel.call(prompt)
            ├─ no tool calls?            → return the response
            ├─ ToolCallingManager.executeToolCalls(...)
            │    ├─ limit exceeded?      → THROW or RETURN_ERROR_RESPONSE
            │    ├─ tool throws?         → message sent back, or rethrown
            │    └─ all tools returnDirect? → return the tool result to the caller
            └─ prompt = history + ASSISTANT(tool calls) + TOOL(results); repeat
```

| Situation | Default behaviour | Change it with |
|-----------|-------------------|----------------|
| Tool throws a `RuntimeException` | The exception message is sent to the model as the tool result | `spring.ai.tools.throw-exception-on-error=true`, or a custom `ToolExecutionExceptionProcessor` bean |
| Tool throws a checked exception or an `Error` | Rethrown to the caller | — |
| Same tool called too often | Stops after 40 calls per tool (150 in total per turn) | `spring.ai.tools.limits.*`, or `ToolCallingManager.builder().maxCallsPerTool(n)` |
| Tool with `returnDirect = true` | Its result returns to the caller without a second model call | Only applies when **every** tool called in that round is `returnDirect` |

```properties
# Tool loop settings (values shown are the defaults)
spring.ai.tools.throw-exception-on-error=false
spring.ai.tools.limits.max-calls-per-tool-default=40
spring.ai.tools.limits.max-total-tool-calls=150
spring.ai.tools.limits.on-limit-exceeded=THROW
```

`on-limit-exceeded` accepts `THROW` and `RETURN_ERROR_RESPONSE`. With `THROW`, `ToolCallingAdvisor` ends the turn with a final generation whose finish reason is `toolCallLimitExceeded` (see the example); it does not throw out of `call()`.

> [!NOTE]
> **Version note:** In Spring AI 1.x each `ChatModel` ran the loop internally (`internalToolExecutionEnabled`). In 2.0 the loop moved into `ToolCallingAdvisor`, so advisors can sit inside or outside it. To turn the auto-registered loop off for a client, set `spring.ai.chat.client.tool-calling.enabled=false` or use `AdvisorParams.toolCallingAdvisorAutoRegister(false)`.

## Example

A tool that rejects a bad ISBN, a `returnDirect` tool and a runaway search limited to two calls:

```java
import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.ToolCallingAdvisor;
import org.springframework.ai.chat.messages.ToolResponseMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.model.tool.ToolCallLimitBehavior;
import org.springframework.ai.model.tool.ToolCallingManager;
import org.springframework.ai.tool.annotation.Tool;

public class ToolLoopDemo {

    static class LibraryTools {
        int searches = 0;

        @Tool(description = "Look up a book by ISBN")
        String findBook(String isbn) {
            if (!isbn.matches("\\d{13}")) {
                throw new IllegalArgumentException("ISBN must be 13 digits, got '" + isbn + "'");
            }
            return "Effective Java, 3rd edition";
        }

        @Tool(description = "Search the library catalogue")
        String search(String query) {
            searches++;
            return "no results for " + query;
        }

        @Tool(description = "Show the learner's reading list exactly as stored", returnDirect = true)
        String readingList() {
            return "1. Effective Java\n2. Java Concurrency in Practice";
        }
    }

    public static void main(String[] args) {
        // 1. A tool exception becomes a message the model can react to
        ScriptedChatModel model = new ScriptedChatModel()
                .replyWithToolCall("findBook", "{\"isbn\":\"978-0134\"}")
                .replyWithToolCall("findBook", "{\"isbn\":\"9780134685991\"}")
                .reply("That ISBN is Effective Java, 3rd edition.");
        String answer = ChatClient.create(model).prompt().user("What is ISBN 978-0134685991?")
                .tools(new LibraryTools()).call().content();
        var firstToolResult = (ToolResponseMessage) model.prompts().get(1).getInstructions().get(2);
        System.out.println("1) Error sent to model: " + firstToolResult.getResponses().get(0).responseData());
        System.out.println("   Model calls: " + model.prompts().size() + ", answer: " + answer);

        // 2. returnDirect: the tool result goes straight to the caller
        ScriptedChatModel model2 = new ScriptedChatModel().replyWithToolCall("readingList", "{}");
        String list = ChatClient.create(model2).prompt().user("Show my reading list")
                .tools(new LibraryTools()).call().content();
        System.out.println("2) Model calls: " + model2.prompts().size() + ", answer: " + list);

        // 3. A per-tool call limit stops a runaway loop
        ToolCallingManager manager = ToolCallingManager.builder()
                .maxCallsPerTool(2)
                .onLimitExceeded(ToolCallLimitBehavior.THROW)
                .build();
        ScriptedChatModel model3 = new ScriptedChatModel()
                .replyWithToolCall("search", "{\"query\":\"streams\"}")
                .replyWithToolCall("search", "{\"query\":\"java streams\"}")
                .replyWithToolCall("search", "{\"query\":\"java 8 streams\"}")
                .reply("unused");
        LibraryTools tools = new LibraryTools();
        ChatResponse response = ChatClient.builder(model3)
                .defaultAdvisors(ToolCallingAdvisor.builder().toolCallingManager(manager).build())
                .build()
                .prompt().user("Find something about streams").tools(tools)
                .call().chatResponse();
        System.out.println("3) Tool executions: " + tools.searches + ", model calls: " + model3.prompts().size()
                + ", finish reason: " + response.getResult().getMetadata().getFinishReason());
        System.out.println("   Final text: " + response.getResult().getOutput().getText());
    }
}
```

**Output:**

```text
1) Error sent to model: ISBN must be 13 digits, got '978-0134'
   Model calls: 3, answer: That ISBN is Effective Java, 3rd edition.
2) Model calls: 1, answer: "1. Effective Java\n2. Java Concurrency in Practice"
3) Tool executions: 2, model calls: 3, finish reason: toolCallLimitExceeded
   Final text: Tool call limit (2) exceeded for tool 'search'. No further calls to this tool are allowed in this turn.
```

`ScriptedChatModel` is the course's offline test double: it replays scripted replies (including tool calls) and records every prompt it receives, so the loop runs without a provider.

### Code walkthrough

- **Case 1.** `findBook` threw `IllegalArgumentException`. The default `ToolExecutionExceptionProcessor` turned the message into the tool result, the model corrected the ISBN, and a third call produced the answer. Write exception messages for the model: say what was wrong and what is valid.
- **Case 2.** `readingList` is `returnDirect`, so the model was called once. The result is the tool's **JSON-serialised** return value — a `String` comes back in quotes with `\n` escaped. If callers need plain text, give the tool a `resultConverter` that returns `String.valueOf(result)`; with that converter the same call returned the two lines unquoted.
- **Case 3.** The third `search` call exceeded `maxCallsPerTool(2)`. The tool ran twice; the advisor ended the turn with finish reason `toolCallLimitExceeded` and a fixed message instead of calling the model again. Check the finish reason before showing the text to a user.

### A user-controlled loop

When you need to inspect, approve or log every round yourself, call the `ChatModel` directly (it does not execute tools) and drive the loop with `ToolCallingManager`:

```java
// Illustrative fragment (the same loop compiled and ran in the course lab)
ToolCallingManager toolCallingManager = ToolCallingManager.builder().build();
ToolCallingChatOptions options = ToolCallingChatOptions.builder()
        .toolCallbacks(ToolCallbacks.from(new LibraryTools()))
        .build();

Prompt prompt = new Prompt("What is ISBN 9780134685991?", options);
ChatResponse response = chatModel.call(prompt);
int rounds = 0;
while (response.hasToolCalls() && rounds++ < 5) {
    ToolExecutionResult result = toolCallingManager.executeToolCalls(prompt, response);
    prompt = new Prompt(result.conversationHistory(), options);
    response = chatModel.call(prompt);
}
```

`result.conversationHistory()` holds the user message, the assistant's tool-call message and the tool results (three messages after one round). Your own loop needs its own round limit.

## Common Mistakes and Troubleshooting

- **Expecting `chatModel.call(...)` to run tools.** In 2.0 only `ChatClient` (through `ToolCallingAdvisor`) or your own loop executes them.
- **Leaking internals in exception messages.** The message goes to the model provider and may be repeated to the user. Throw short, safe messages; log the details.
- **Showing `toolCallLimitExceeded` text as an answer.** Check `getFinishReason()` and map it to a friendly error or a retry.
- **Surprised by quoted `returnDirect` output.** The default converter serialises to JSON; use a `resultConverter` or return a record the caller parses.
- **Mixing `returnDirect` and normal tools in one round.** Direct return is skipped unless all tools in that round are `returnDirect`.
- **An advisor that should run once per request placed after +300** — which includes any plain order such as 0 or 100, because +300 means `Integer.MIN_VALUE + 300`. It runs on every loop round (see [Chat Memory Advisors](../chat-memory-advisors/content.md)).

## Production Considerations

- Set limits that match the feature: a lookup assistant rarely needs more than a handful of calls. Lower `max-total-tool-calls` to cap cost per turn.
- Tool exceptions are invisible to the user but visible in traces: tool executions are observed under the name `spring.ai.tool`, so alert on error rates.
- `throw-exception-on-error=true` suits back-office jobs where a failed tool must fail the job; keep the default for chat, where the model can recover.
- Each loop round is a full model call with the growing history — latency and tokens grow with every round.

## Common Interview Traps

- **"The LLM runs the tool."** The application runs it; the model only asks.
- **"A tool exception always fails the request."** Runtime exceptions are sent back to the model by default.
- **"`returnDirect` returns the raw string."** It returns the converter's output, JSON by default.
- **"The limit throws an exception out of `call()`."** With `ToolCallingAdvisor` the turn ends with finish reason `toolCallLimitExceeded`.

## Key Takeaways

- 2.0: `ToolCallingAdvisor` (order +300) runs the loop; `ToolCallingManager` executes the tools.
- Runtime exceptions go back to the model; checked exceptions and errors are rethrown.
- Limits: 40 per tool and 150 total by default; check for `toolCallLimitExceeded`.
- `returnDirect` skips the final model call and returns JSON-converted output.
- Drive the loop yourself with `ChatModel` + `ToolCallingManager` when you need per-round control.

## Official References

- [Tool Calling: Tool Execution, Exception Handling and Return Direct](https://docs.spring.io/spring-ai/reference/api/tools.html)
- [Upgrading tool calling from 1.x to 2.0](https://docs.spring.io/spring-ai/reference/api/tools-migration.html)
- [Advisors API](https://docs.spring.io/spring-ai/reference/api/advisors.html)
- Related: [Tool Calling Fundamentals](../tool-calling-fundamentals/content.md) · [Validating and Authorising Tool Calls](../tool-validation-and-authorization/content.md) · [Human Approval for Tools](../../spring-ai-advanced/human-approval-for-tools/content.md)
