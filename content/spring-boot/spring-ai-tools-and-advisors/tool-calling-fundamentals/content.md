# Tool Calling Fundamentals

**Module:** Spring AI: Tools and Advisors · **Interview priority:** Core · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Explain what tool calling (function calling) is and who does what: the model requests, the application executes.
- Trace the messages exchanged in one tool-calling round trip.
- Recognise when a tool is the right design and when plain prompting or RAG is enough.
- Name the Spring AI 2.0 pieces: `@Tool`, `ToolCallback`, `ToolCallingManager` and the auto-registered `ToolCallingAdvisor`.

## Definition

**Tool calling** lets a model ask the application to run a function and use the result. The application sends tool **definitions** (name, description, JSON Schema of the input) with the request; the model may reply with a **tool call** (tool name + JSON arguments) instead of text; the application executes the tool and sends the result back as a `TOOL` message; the model then answers, or calls another tool.

> [!IMPORTANT]
> The model never executes anything and never reaches your APIs directly. It only produces a request. Your code decides whether and how to run it — which is where validation and authorisation belong.

## Why It Matters

A model's knowledge is frozen at training time and it cannot act. Tools give it **live information** (a learner's progress, today's timetable, an order's status) and **actions** (enrol, book, send). Tool calling is the building block of assistants and agents, and one of the most asked Spring AI interview topics because it mixes AI behaviour with ordinary security and reliability concerns.

## How It Works

```text
Application                              Model provider
-----------                              --------------
1. user message + tool definitions  -->
                                    <--  2. ASSISTANT: tool call courseProgress({"courseId":"java-101"})
3. run courseProgress("java-101") = 72
4. USER + ASSISTANT(tool call) + TOOL("72")  -->
                                    <--  5. ASSISTANT: "You have completed 72% of Java 101."
```

In Spring AI 2.0 the loop belongs to **`ToolCallingAdvisor`**, which `ChatClient` registers automatically:

| Piece | Role |
|-------|------|
| `@Tool` / `@ToolParam` | Declare a Java method as a tool and describe it |
| `ToolCallback` | The runtime tool: definition + `call(String jsonInput)` |
| `ToolCallingChatOptions` | Carries the tool callbacks with the request |
| `ToolCallingAdvisor` | Runs the loop: send, detect tool calls, execute, resend, until a text answer |
| `ToolCallingManager` | Finds the matching callback, executes it, applies call limits |

> [!NOTE]
> **Version note:** in Spring AI 1.x each `ChatModel` ran the tool loop internally. In 2.0 `ChatModel.call(...)` returns the tool-call request and stops; `ChatClient` runs the loop through the advisor chain. Code calling `ChatModel` directly must drive the loop itself ([The Tool-Calling Loop](../tool-calling-loop/content.md)).

### When to use a tool

| Need | Use |
|------|-----|
| Data that changes or is private to the user (grades, orders) | Tool |
| An action with side effects (enrol, book) | Tool, with confirmation for risky actions |
| Knowledge in your documents | RAG ([RAG Architecture](../../spring-ai-rag/rag-architecture/content.md)) — or a search tool |
| A fixed calculation your code can do directly | Plain code, no model needed |

Provider support matters: the chosen model must support tool calling (most current chat models from OpenAI, Anthropic, Google and many Ollama models do; check the provider's comparison page).

## Example

`ScriptedChatModel` plays the model: its first reply is a tool call, its second the final answer. The program prints what was sent on each request:

```java
import java.util.List;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.ToolResponseMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.model.tool.ToolCallingChatOptions;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;

public class ToolCallingTour {

    static class StudyTools {
        @Tool(description = "Get the learner's progress in a course as a percentage")
        int courseProgress(@ToolParam(description = "Course id, for example java-101") String courseId) {
            System.out.println("  [application runs tool] courseProgress(" + courseId + ")");
            return "java-101".equals(courseId) ? 72 : 0;
        }
    }

    public static void main(String[] args) {
        ScriptedChatModel model = new ScriptedChatModel()
                .replyWithToolCall("courseProgress", "{\"courseId\":\"java-101\"}")
                .reply("You have completed 72% of Java 101.");

        String answer = ChatClient.create(model).prompt()
                .user("How far am I in Java 101?")
                .tools(new StudyTools())
                .call()
                .content();

        System.out.println("Model calls: " + model.prompts().size());
        for (int i = 0; i < model.prompts().size(); i++) {
            Prompt prompt = model.prompts().get(i);
            var tools = ((ToolCallingChatOptions) prompt.getOptions()).getToolCallbacks().stream()
                    .map(callback -> callback.getToolDefinition().name()).toList();
            System.out.println("Request " + (i + 1) + " messages: "
                    + prompt.getInstructions().stream().map(m -> m.getMessageType().toString()).toList()
                    + " tools offered: " + tools);
        }
        var toolMessage = (ToolResponseMessage) model.lastPrompt().getInstructions().get(2);
        System.out.println("Tool result sent back: " + toolMessage.getResponses().get(0).responseData());
        System.out.println("Answer: " + answer);
    }
}
```

**Output:**

```text
  [application runs tool] courseProgress(java-101)
Model calls: 2
Request 1 messages: [USER] tools offered: [courseProgress]
Request 2 messages: [USER, ASSISTANT, TOOL] tools offered: [courseProgress]
Tool result sent back: 72
Answer: You have completed 72% of Java 101.
```

### Code walkthrough

- One `.call().content()` produced **two** model calls: `ToolCallingAdvisor` saw the tool call in the first reply, ran the method, and sent the history plus the `TOOL` message back.
- The tool definitions travel with every request in the loop — they cost input tokens each time.
- The `int` result was serialised to the string `72` (results are converted to JSON text by the default `ToolCallResultConverter`).
- With a real provider the model decides whether to call the tool, from the tool's description and the question; the scripted model only replays that decision.

## Common Mistakes and Troubleshooting

- **The model never calls the tool.** The description does not say when to use it, the model does not support tools, or the tool was not passed (`.tools(...)` / `.defaultTools(...)`).
- **Calling `chatModel.call(prompt)` and expecting the tool to run.** In 2.0 only `ChatClient` runs the loop automatically.
- **Exposing a powerful generic tool** ("run SQL", "call URL"). The model's arguments are untrusted; give narrow, purpose-built tools.
- **Assuming the model's arguments are correct.** Validate them like request parameters ([Tool Validation and Authorization](../tool-validation-and-authorization/content.md)).

## Production Considerations

- Each loop iteration is a model call: latency and cost grow with the number of tool rounds; Spring AI caps calls per turn (40 per tool and 150 in total by default).
- Tool definitions are input tokens on every request; offer only the tools a feature needs.
- Log tool name, duration and outcome; tool calls are observed under the `spring.ai.tool` observation name ([Observability](../../spring-ai-production/spring-ai-observability/content.md)).

## Common Interview Traps

- **"The LLM calls my API."** The application calls it; the model only asks.
- **"Tool calling is a Spring AI feature."** The capability belongs to the model/provider; Spring AI supplies the portable definitions and the execution loop.
- **"`ChatModel` executes tools in 2.0."** It does not; `ToolCallingAdvisor` in `ChatClient` does.

## Key Takeaways

- Model requests, application executes, result goes back as a `TOOL` message, model answers.
- `ChatClient` auto-registers `ToolCallingAdvisor`, which loops until the model returns text.
- Tools give live data and actions; every argument is untrusted input.

## Official References

- [Tool Calling](https://docs.spring.io/spring-ai/reference/api/tools.html)
- [ToolCallingAdvisor](https://docs.spring.io/spring-ai/reference/api/tools/tool-calling-advisor.html)
- [Chat model comparison (tool support)](https://docs.spring.io/spring-ai/reference/api/chat/comparison.html)
- Related: [The @Tool Annotation](../spring-ai-tool-annotation/content.md) · [The Tool-Calling Loop](../tool-calling-loop/content.md) · [System, User, Assistant and Tool Messages](../../spring-ai-chat-client/spring-ai-messages-and-roles/content.md)
