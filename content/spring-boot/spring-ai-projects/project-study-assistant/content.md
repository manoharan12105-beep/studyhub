# Project 1: Study Assistant

**Module:** Spring AI: Projects · **Interview priority:** Portfolio · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Build a small study assistant service that explains topics with per-learner memory and writes quiz questions as structured output.
- Keep all AI access behind one service with input validation and output checks.
- Expose it through a REST controller and test it without a provider.

## Definition

The **study assistant** is a Spring Boot service with two features:

| Feature | Spring AI pieces | Guarantees in code |
|---------|------------------|--------------------|
| `explain(conversationId, question)` | `ChatClient`, default system prompt, `MessageChatMemoryAdvisor` | Input length check, one conversation per learner |
| `quiz(topic)` | Prompt template parameter, `.entity(QuizQuestion.class)` | Exactly four options and a valid answer index, or an error |

It combines [ChatClient](../../spring-ai-chat-client/chatclient-builder-and-defaults/content.md), [Structured Output](../../spring-ai-chat-client/spring-ai-structured-output/content.md) and [Chat Memory](../../spring-ai-prompts-and-memory/spring-ai-chat-memory/content.md).

## Why It Matters

This is the smallest "real" AI feature: a system prompt, conversation state, typed output and validation. Interviewers ask you to walk through exactly this shape — where the prompt lives, how memory is keyed, what happens when the model returns bad JSON.

## How It Works

```text
POST /api/tutor/explain {question}          POST /api/tutor/quiz {topic}
        │                                           │
 TutorController (learner id from Security)  TutorController
        │                                           │
 StudyAssistant.explain ── validate ──▶ ChatClient ─┼─ MessageChatMemoryAdvisor (conversationId)
 StudyAssistant.quiz ──── validate ──▶ ChatClient ──┘─ .entity(QuizQuestion) ─▶ check invariants
```

Steps:

1. Create the project from the [Practice Lab](../../spring-ai-foundations/spring-ai-practice-lab/content.md) (`spring-ai-starter-model-openai` or any provider starter).
2. Write `StudyAssistant` with the system prompt and memory advisor as builder defaults.
3. Key memory by the authenticated learner (never a client-supplied id for someone else).
4. Return quiz questions as a record and validate them before use.
5. Add a controller, error handling and tests with `ScriptedChatModel`.

## Configuration

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-openai</artifactId>
</dependency>
```

```properties
spring.ai.openai.api-key=${OPENAI_API_KEY}
spring.ai.openai.chat.model=gpt-5-mini
spring.ai.openai.chat.max-completion-tokens=600
```

The model name is an example; pin whichever model your provider account offers ([Models and Providers](../../spring-ai-foundations/spring-ai-models-and-providers/content.md)).

## Example

The service and a run against the Practice Lab's `ScriptedChatModel`:

```java
import java.util.List;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;

public class StudyAssistantProject {

    /** Structured output: the model fills this record from JSON. */
    record QuizQuestion(String question, List<String> options, int answerIndex) {}

    /** The service a controller would call; all AI access goes through it. */
    static class StudyAssistant {

        private static final int MAX_QUESTION_CHARS = 500;
        private final ChatClient client;

        StudyAssistant(ChatClient.Builder builder, ChatMemory memory) {
            this.client = builder
                    .defaultSystem("You are a patient study tutor for Java and Spring. Explain simply, "
                            + "use short examples, and say when you are not sure.")
                    .defaultAdvisors(MessageChatMemoryAdvisor.builder(memory).build())
                    .build();
        }

        String explain(String conversationId, String question) {
            validate(question);
            return client.prompt().user(question)
                    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                    .call().content();
        }

        QuizQuestion quiz(String topic) {
            validate(topic);
            QuizQuestion q = client.prompt()
                    .user(u -> u.text("Write one multiple-choice question about {topic} with four options.")
                            .param("topic", topic))
                    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, "quiz-" + topic))
                    .call().entity(QuizQuestion.class);
            // Never trust structured output blindly: check the invariants in code
            if (q == null || q.options() == null || q.options().size() != 4
                    || q.answerIndex() < 0 || q.answerIndex() > 3) {
                throw new IllegalStateException("Model returned an invalid quiz question");
            }
            return q;
        }

        private static void validate(String text) {
            if (text == null || text.isBlank() || text.length() > MAX_QUESTION_CHARS) {
                throw new IllegalArgumentException("Question must be 1-" + MAX_QUESTION_CHARS + " characters");
            }
        }
    }

    public static void main(String[] args) {
        ScriptedChatModel model = new ScriptedChatModel()
                .reply("A bean is an object that Spring creates and manages for you.")
                .reply("Sure: a @Service class such as GradeService becomes a bean when the app starts.")
                .reply("""
                        {"question":"Which annotation marks a service bean?",
                         "options":["@Entity","@Service","@Table","@Id"],"answerIndex":1}""")
                .reply("""
                        {"question":"Broken","options":["only one"],"answerIndex":7}""");
        ChatMemory memory = MessageWindowChatMemory.builder().maxMessages(20).build();
        StudyAssistant assistant = new StudyAssistant(ChatClient.builder(model), memory);

        System.out.println("A1: " + assistant.explain("learner-1", "What is a Spring bean?"));
        System.out.println("A2: " + assistant.explain("learner-1", "Give me an example."));
        System.out.println("messages sent with the follow-up: " + model.prompts().get(1).getInstructions().size());
        System.out.println("memory for learner-1: " + memory.get("learner-1").size() + " messages");

        QuizQuestion q = assistant.quiz("Spring beans");
        System.out.println("Quiz: " + q.question() + " " + q.options() + " answer=" + q.options().get(q.answerIndex()));
        try {
            assistant.quiz("Spring beans");
        } catch (IllegalStateException e) {
            System.out.println("Rejected: " + e.getMessage());
        }
        try {
            assistant.explain("learner-1", " ");
        } catch (IllegalArgumentException e) {
            System.out.println("Rejected: " + e.getMessage() + " (model calls so far: " + model.prompts().size() + ")");
        }
    }
}
```

**Output:**

```text
A1: A bean is an object that Spring creates and manages for you.
A2: Sure: a @Service class such as GradeService becomes a bean when the app starts.
messages sent with the follow-up: 4
memory for learner-1: 4 messages
Quiz: Which annotation marks a service bean? [@Entity, @Service, @Table, @Id] answer=@Service
Rejected: Model returned an invalid quiz question
Rejected: Question must be 1-500 characters (model calls so far: 4)
```

### Code walkthrough

- The follow-up request carried four messages: system, first question, first answer, follow-up. That is the memory advisor at work, keyed by `learner-1`.
- `quiz` uses a separate conversation id so quiz generation does not pollute the tutoring history.
- The second quiz reply parsed as JSON but broke the invariants (one option, index 7) — the code rejected it. Parsing is not validation.
- The blank question was rejected before any model call (still 4 calls).

### The controller

```java
// Illustrative fragment
@RestController
@RequestMapping("/api/tutor")
class TutorController {

    private final StudyAssistant assistant;

    TutorController(StudyAssistant assistant) {
        this.assistant = assistant;
    }

    record ExplainRequest(@NotBlank @Size(max = 500) String question) {}

    @PostMapping("/explain")
    Map<String, String> explain(@Valid @RequestBody ExplainRequest request, Principal principal) {
        return Map.of("answer", assistant.explain(principal.getName(), request.question()));
    }
}
```

**Expected behaviour with a real model:** answers vary in wording; quiz questions usually parse, and the invariant check catches the occasional malformed one. Map `IllegalStateException` to a 502-style "try again" response and `IllegalArgumentException` to 400.

## Common Mistakes and Troubleshooting

- **Conversation id from the request body.** A learner could read another learner's history. Use the authenticated principal.
- **Unbounded memory.** Use `MessageWindowChatMemory` with `maxMessages`, or a JDBC repository with retention ([Memory Storage](../../spring-ai-prompts-and-memory/chat-memory-storage/content.md)).
- **Trusting `.entity(...)`.** It guarantees a parse, not correct content.
- **Prompt text scattered across controllers.** Keep prompts in the service (or resource files) so they are versioned and tested.

## Production Considerations

- Set an output token limit and a timeout; return a friendly error on provider failure ([Resilience](../../spring-ai-production/ai-resilience-and-provider-errors/content.md)).
- Log conversation ids and token usage, not the learner's text ([Logging](../../spring-ai-production/ai-logging-and-sensitive-data/content.md)).
- Rate-limit per learner; quizzes are cheap to cache by topic.

## Project Checklist

- [ ] One `StudyAssistant` service; no `ChatClient` in controllers.
- [ ] System prompt and memory advisor set as defaults.
- [ ] Conversation id comes from the authenticated user.
- [ ] Input validated (`@Valid`, length limits) before any model call.
- [ ] Quiz output validated after parsing.
- [ ] Unit tests with a scripted `ChatModel`; no API key needed in CI.
- [ ] API key from an environment variable; token limit configured.

## Key Takeaways

- A small AI feature = system prompt + memory keyed by user + typed output + validation on both sides.
- Keep the model behind a service so it can be tested, swapped and observed.

## Official References

- [Spring AI ChatClient API](https://docs.spring.io/spring-ai/reference/api/chatclient.html)
- [Spring AI Chat Memory](https://docs.spring.io/spring-ai/reference/api/chat-memory.html)
- [Spring AI Structured Output](https://docs.spring.io/spring-ai/reference/api/structured-output.html)
- Related: [Project 2: Document Q&A](../project-document-qa/content.md) · [Project 3: Tool-Calling Service](../project-tool-calling-service/content.md) · [Testing AI Services](../../spring-ai-production/testing-ai-services/content.md)
