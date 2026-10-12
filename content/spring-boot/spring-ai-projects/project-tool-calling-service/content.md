# Project 3: Tool-Calling Enrolment Service

**Module:** Spring AI: Projects · **Interview priority:** Portfolio · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Build an assistant that reads and changes data through tools, with identity, validation and auditing in code.
- Keep tools as thin adapters over a normal service that can be tested without a model.
- Combine tools with chat memory, and know exactly what memory stores.

## Definition

The **enrolment service** lets a learner say "enrol me in Java 101" or "which courses am I in?". The model chooses the tool and its arguments. Spring AI runs the tool loop. Your code decides what is allowed.

| Layer | Responsibility |
|-------|----------------|
| `EnrolmentService` | Business rules, validation and audit, in plain Java |
| `EnrolmentTools` | `@Tool` methods; identity from `ToolContext`; delegates to the service |
| `ChatClient` | System prompt, default tools, `MessageChatMemoryAdvisor` |
| Controller | Passes the authenticated learner id as `toolContext` and conversation id |

It applies these lessons:

- [Tool Calling](../../spring-ai-tools-and-advisors/tool-calling-fundamentals/content.md)
- [Tool Validation and Authorization](../../spring-ai-tools-and-advisors/tool-validation-and-authorization/content.md)
- [Chat Memory Advisors](../../spring-ai-tools-and-advisors/chat-memory-advisors/content.md)

## Why It Matters

Tools turn a chatbot into something that acts, and that is where the real risks are: wrong arguments, actions for the wrong user, repeated actions and invented ids. This project shows the safe structure interviewers expect.

## How It Works

```text
"Enrol me in Java 101"
   │
ChatClient ── MessageChatMemoryAdvisor (+200, outside the tool loop)
   │          ToolCallingAdvisor (+300) ── model asks enrol({"courseId":"java-101"})
   │                                       └─ EnrolmentTools.enrol(courseId, ToolContext{learnerId})
   │                                            └─ EnrolmentService.enrol: validate, add, audit
   └─ final answer ◀── model phrases the tool result
```

Steps:

1. **Write the service first.** Build and unit-test `EnrolmentService` with no AI involved.
2. **Add the tools.** Write `EnrolmentTools` with precise descriptions, such as "only use when the learner explicitly asks to enrol".
3. **Pass identity separately.** Send the learner id through `toolContext`; it never appears in the prompt.
4. **Help the model recover.** Return helpful error text for invalid arguments.
5. **Add memory.** Key it by learner. It stores the user message and the final answer of each turn.

## Configuration

```properties
spring.ai.openai.api-key=${OPENAI_API_KEY}
spring.ai.openai.chat.model=gpt-5-mini
spring.ai.openai.chat.max-completion-tokens=400
```

## Example

```java
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;

public class ToolServiceProject {

    static final Set<String> COURSES = Set.of("java-101", "db-201", "sec-301");

    /** Business logic stays in a normal service: validated, authorised, testable without a model. */
    static class EnrolmentService {
        final Map<String, Set<String>> enrolments = new ConcurrentHashMap<>();
        final List<String> audit = new ArrayList<>();

        List<String> myCourses(String learnerId) {
            return enrolments.getOrDefault(learnerId, Set.of()).stream().sorted().toList();
        }

        String enrol(String learnerId, String courseId) {
            if (courseId == null || !COURSES.contains(courseId)) {
                return "Unknown course: " + courseId + ". Available: " + COURSES.stream().sorted().toList();
            }
            boolean added = enrolments.computeIfAbsent(learnerId, k -> ConcurrentHashMap.newKeySet()).add(courseId);
            audit.add(learnerId + " enrol " + courseId + (added ? " OK" : " ALREADY"));
            return added ? "Enrolled in " + courseId : "Already enrolled in " + courseId;
        }
    }

    /** Thin tool adapter: identity from ToolContext, everything else delegated. */
    static class EnrolmentTools {
        private final EnrolmentService service;

        EnrolmentTools(EnrolmentService service) { this.service = service; }

        @Tool(description = "List the courses the current learner is enrolled in")
        List<String> myCourses(ToolContext ctx) {
            return service.myCourses(learner(ctx));
        }

        @Tool(description = "Enrol the current learner in a course. Only use when the learner explicitly asks to enrol.")
        String enrol(@ToolParam(description = "Course id such as java-101") String courseId, ToolContext ctx) {
            return service.enrol(learner(ctx), courseId);
        }

        private static String learner(ToolContext ctx) {
            return (String) ctx.getContext().get("learnerId");
        }
    }

    public static void main(String[] args) {
        EnrolmentService service = new EnrolmentService();
        ScriptedChatModel model = new ScriptedChatModel()
                .replyWithToolCall("enrol", "{\"courseId\":\"java-101\"}").reply("Done, you are enrolled in java-101.")
                .replyWithToolCall("enrol", "{\"courseId\":\"ml-999\"}").reply("ml-999 does not exist. Try db-201 or sec-301.")
                .replyWithToolCall("myCourses", "{}").reply("You are enrolled in java-101.");
        ChatMemory memory = MessageWindowChatMemory.builder().build();
        ChatClient client = ChatClient.builder(model)
                .defaultSystem("You help learners manage enrolments. Use the tools; never invent course ids.")
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(memory).build())
                .defaultTools(new EnrolmentTools(service))
                .build();

        for (String q : List.of("Enrol me in Java 101", "Also enrol me in ml-999", "Which courses am I in?")) {
            String answer = client.prompt().user(q)
                    .toolContext(Map.of("learnerId", "s-42"))   // from the authenticated principal
                    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, "s-42"))
                    .call().content();
            System.out.println(q + " -> " + answer);
        }
        System.out.println("audit: " + service.audit);
        System.out.println("model calls: " + model.prompts().size() + ", memory messages: " + memory.get("s-42").size());
    }
}
```

**Output:**

```text
Enrol me in Java 101 -> Done, you are enrolled in java-101.
Also enrol me in ml-999 -> ml-999 does not exist. Try db-201 or sec-301.
Which courses am I in? -> You are enrolled in java-101.
audit: [s-42 enrol java-101 OK]
model calls: 6, memory messages: 6
```

### Code walkthrough

- **Two calls per question.** One model call requested the tool and one phrased the result, so 3 questions made 6 calls.
- **Rejection happens in code.** `EnrolmentService` rejected `ml-999`, not the model. The tool returned the list of valid ids, so the model could give a useful answer. Only the real enrolment appears in the audit.
- **Identity.** The learner id `s-42` reached the tools through `ToolContext`; the model never chose whose data to change.
- **Memory contents.** Memory holds 6 messages: the user message and the final answer of each turn. The memory advisor runs outside the tool loop, so tool requests and results are not stored.

## Common Mistakes and Troubleshooting

- **Learner id as a tool parameter.** The model, or an injected prompt, could pass someone else's id. Use `ToolContext`.
- **Business logic inside the `@Tool` method.** It cannot be reused, or tested without the AI wiring.
- **Throwing on bad arguments without a message.** Return or throw a clear message so the model can correct itself.
- **Expecting memory to remember tool results.** Only user and final assistant messages are stored. Re-query the data instead of relying on history.
- **Duplicate actions.** Make write tools idempotent. Here, `Set.add` makes a repeat return "Already enrolled".

## Production Considerations

- **Approval.** Irreversible or costly actions need confirmation or approval ([Human Approval](../../spring-ai-advanced/human-approval-for-tools/content.md)).
- **Tracing and audit.** Trace tool calls (`spring.ai.tool` observations), and keep the audit log in the database, not in memory.
- **Tool count.** Expose only the tools the feature needs. Fewer tools mean fewer wrong choices and fewer tokens.

## Project Checklist

- [ ] The service layer is tested without a model.
- [ ] Each tool description says when to use the tool and when not to.
- [ ] Identity comes only via `ToolContext`, from Spring Security.
- [ ] Every argument is validated; invalid input returns a helpful message.
- [ ] Write tools are idempotent and audited.
- [ ] Memory is keyed by the authenticated user, and retention is configured.
- [ ] An integration test with a scripted model asserts that the tool was called with the expected arguments.

## Key Takeaways

- The model proposes and your code decides: tools are thin adapters over validated, authorised services.
- Identity flows through `ToolContext`, never through the prompt.
- Memory stores conversation turns, not the tool loop.

## Official References

- [Spring AI Tool Calling](https://docs.spring.io/spring-ai/reference/api/tools.html)
- [Spring AI Chat Memory](https://docs.spring.io/spring-ai/reference/api/chat-memory.html)
- Related: [Project 1: Study Assistant](../project-study-assistant/content.md) · [Project 2: Document Q&A](../project-document-qa/content.md) · [Tool-Calling Loop](../../spring-ai-tools-and-advisors/tool-calling-loop/content.md)
