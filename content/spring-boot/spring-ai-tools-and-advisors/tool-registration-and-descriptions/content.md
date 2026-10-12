# Registering Tools: Per-Call, Defaults, Beans and Functions

**Module:** Spring AI: Tools and Advisors · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Register tools per call with `.tools(...)` and per client with `.defaultTools(...)`, and predict the tool list sent.
- Build function-backed tools with `FunctionToolCallback` and method tools with `MethodToolCallback`.
- Define `ToolCallback` beans and understand the 2.0 resolution rules.
- Decide which tools belong in defaults and which only on specific requests.

## Definition

**Tool registration** decides which tool definitions travel with a request. `ChatClient` accepts `@Tool` objects, `ToolCallback`s, `ToolCallbackProvider`s, and arrays or collections of them in `.tools(...)` (one request) and `.defaultTools(...)` (every request from a client). The model can only call tools whose definitions it received.

| Style | Use when | Example |
|-------|----------|---------|
| `@Tool` object | You own the class | `.tools(new CatalogTools())` |
| `MethodToolCallback` | Build a tool from a `Method` at runtime | `MethodToolCallback.builder().toolDefinition(...).toolMethod(m).toolObject(o)` |
| `FunctionToolCallback` | Expose a `Function`, `Supplier`, `Consumer` or `BiFunction` | `FunctionToolCallback.builder("enrol", fn).inputType(EnrolRequest.class)` |
| `ToolCallback` bean | Define once, inject where needed | `@Bean ToolCallback currentWeather(...)` |
| `ToolCallbackProvider` | A source of many tools (for example MCP servers) | `.tools(mcpToolCallbackProvider)` |

## Why It Matters

Every offered tool costs input tokens on every model call and widens what the model can do. A "god client" with every tool as a default is both expensive and dangerous: a prompt injection in any feature can reach every action. Registration is where least privilege starts.

## How It Works

- **Defaults + per-call are combined.** The final list is the union of `.defaultTools(...)` and `.tools(...)`; per-call tools do not replace the defaults.
- **Names must be unique** within one request, or the call fails.
- **Tools set on the `ChatModel`'s own options** (`ToolCallingChatOptions.toolCallbacks(...)`) are overridden by the request-level list built by `ChatClient`.
- **Name-based resolution is off by default in 2.0.** `ToolCallback` beans are registered with the `ToolCallbackResolver`, but a tool the model names that was **not attached to the request** is executed only if `spring.ai.tools.resolution.fallback.enabled=true`. Leave it off unless you fully control every resolvable tool.

> [!NOTE]
> **Version note:** Spring AI 1.x let you register plain `Function` beans and refer to them by bean name with `toolNames("...")`. 2.0 removed `toolNames(...)` and `SpringBeanToolCallbackResolver`; register `ToolCallback` beans and pass them with `.tools(...)`.

## Example

A function-backed tool, a default tool and a per-call tool, with the tool names actually offered to the model:

```java
import java.util.function.Function;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.model.tool.ToolCallingChatOptions;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.function.FunctionToolCallback;

public class ToolRegistrationDemo {

    static class CatalogTools {
        @Tool(description = "List the courses available for a topic")
        String listCourses(String topic) {
            return "java-101, java-collections";
        }
    }

    record EnrolRequest(String courseId, boolean waitlistIfFull) {
    }

    public static void main(String[] args) {
        // A function-backed tool, built programmatically (for example in a @Bean method)
        Function<EnrolRequest, String> enrol = request -> "Enrolled in " + request.courseId();
        ToolCallback enrolTool = FunctionToolCallback.builder("enrol", enrol)
                .description("Enrol the current learner in a course. Only call after the learner confirms.")
                .inputType(EnrolRequest.class)
                .build();
        System.out.println("enrol schema: " + enrolTool.getToolDefinition().inputSchema().replaceAll("\\s+", " "));

        ScriptedChatModel model = new ScriptedChatModel().reply("Here are the courses.").reply("Done.");
        ChatClient client = ChatClient.builder(model)
                .defaultTools(new CatalogTools())          // offered on every request from this client
                .build();

        client.prompt().user("Which Java courses exist?").call().content();
        System.out.println("Default only: " + offered(model));

        client.prompt().user("Enrol me in java-101").tools(enrolTool).call().content();
        System.out.println("Default + per-call: " + offered(model));
    }

    static Object offered(ScriptedChatModel model) {
        return ((ToolCallingChatOptions) model.lastPrompt().getOptions()).getToolCallbacks().stream()
                .map(callback -> callback.getToolDefinition().name()).sorted().toList();
    }
}
```

**Output:**

```text
enrol schema: { "$schema" : "https://json-schema.org/draft/2020-12/schema", "type" : "object", "properties" : { "courseId" : { "type" : "string" }, "waitlistIfFull" : { "type" : "boolean" } }, "required" : [ "courseId", "waitlistIfFull" ], "additionalProperties" : false }
Default only: [listCourses]
Default + per-call: [enrol, listCourses]
```

### Code walkthrough

- `FunctionToolCallback` generated the schema from the `EnrolRequest` record. Record components have no descriptions here; add `@ToolParam` (or Jackson/Swagger description annotations) on the components so the model knows what to send.
- Both record fields became required, including `waitlistIfFull` — the model must decide it. Mark it `@ToolParam(required = false)` if a default is acceptable.
- The risky `enrol` tool is attached only on the request that needs it; the harmless catalogue tool is a default.

### Tool beans in Spring Boot

```java
// Illustrative fragment
@Configuration(proxyBeanMethods = false)
class StudyToolsConfig {

    @Bean
    ToolCallback enrolTool(EnrolmentService enrolmentService) {
        return FunctionToolCallback.builder("enrol", enrolmentService::enrol)
                .description("Enrol the current learner in a course. Only call after the learner confirms.")
                .inputType(EnrolRequest.class)
                .build();
    }
}

@Service
class EnrolmentAssistant {
    private final ChatClient chatClient;
    private final ToolCallback enrolTool;

    EnrolmentAssistant(ChatClient.Builder builder, ToolCallback enrolTool, CatalogTools catalogTools) {
        this.chatClient = builder.defaultTools(catalogTools).build();
        this.enrolTool = enrolTool;
    }

    String handle(String learnerId, String message) {
        return chatClient.prompt().user(message)
                .tools(enrolTool)
                .toolContext(Map.of("learnerId", learnerId))
                .call().content();
    }
}
```

## Common Mistakes and Troubleshooting

- **`toolNames(...)` does not compile after upgrading.** Removed in 2.0; inject the `ToolCallback` bean and pass it to `.tools(...)`.
- **Expecting `.tools(...)` to replace defaults.** It adds to them.
- **`Multiple tools with the same name`.** Two sources define the same tool name; rename one.
- **`IllegalStateException: No ToolCallback found for tool name: ...`.** The model asked for a tool that this request did not offer (a hallucinated name, or a name it saw in history or the system prompt). The whole call fails, so map it to a clear error and fix the cause.
- **Enabling `spring.ai.tools.resolution.fallback.enabled` to "fix" a missing tool.** It makes every resolvable tool executable whenever the model names it — attach the tool to the request instead.
- **Too many tools.** Selection accuracy drops and token cost rises; split features, or use `ToolSearchToolCallingAdvisor` (`spring.ai.chat.client.tool-search-advisor.enabled=true`) for very large tool sets.

## Production Considerations

- Defaults only for read-only, low-risk tools that every request of that client needs.
- One `ChatClient` per feature with its own tool set is easier to secure and test than one shared client.
- Review tool descriptions like code; they change model behaviour.
- Measure the tokens tool definitions add to each request.

## Common Interview Traps

- **"Per-call tools override defaults."** They are merged.
- **"A `ToolCallback` bean is automatically available to every request."** Not in 2.0 — attach it, or deliberately enable resolution fallback.
- **"More tools make the assistant smarter."** More tools add cost and confusion.

## Key Takeaways

- `.defaultTools(...)` + `.tools(...)` = the tools offered; names must be unique.
- `FunctionToolCallback`, `MethodToolCallback` and `ToolCallback` beans cover programmatic registration.
- 2.0 removed `toolNames(...)`; resolution fallback is off by default — keep it off.
- Register the fewest, narrowest tools each request needs.

## Official References

- [Tool Calling: Defining Tools and Passing Tools to ChatClient](https://docs.spring.io/spring-ai/reference/api/tools.html)
- [Upgrading tool calling from 1.x to 2.0](https://docs.spring.io/spring-ai/reference/api/tools-migration.html)
- Related: [The @Tool Annotation](../spring-ai-tool-annotation/content.md) · [The Tool-Calling Loop](../tool-calling-loop/content.md) · [MCP with Spring AI](../../spring-ai-advanced/mcp-with-spring-ai/content.md)
