# Testing AI Services

**Module:** Spring AI: Production · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21 · JUnit 6.0.3

## Learning Objectives

- Separate what can be tested deterministically from what needs evaluation.
- Unit-test AI services with a stub `ChatModel`: prompts, fallbacks, structured-output handling.
- Test tools and advisors without any model.
- Plan integration tests (local model, stub HTTP server, Testcontainers) and evaluation tests.

## Definition

An AI service is ordinary Java code around a non-deterministic dependency. **Testing AI services** means testing *your* code deterministically — prompt construction, parsing, validation, fallbacks, tools, advisors, error handling — by replacing the model with a stub, and testing *model behaviour* separately with evaluations that measure rates rather than exact strings.

| Layer | Model | Runs | Checks |
|-------|-------|------|--------|
| Unit | Stub `ChatModel` (records prompts, returns fixed replies) | Every build | Prompt content, parsing, validation, fallbacks, tools, advisors |
| Integration | Local stub HTTP server, or a local model (Ollama via Testcontainers) | Every build or CI | Wiring, configuration, serialization, error mapping, timeouts |
| Evaluation | Real model | Nightly / before release | Relevance, groundedness, refusal behaviour, regressions ([AI Evaluation](../ai-evaluation-and-regression/content.md)) |

## Why It Matters

Calling a real model in unit tests makes builds slow, flaky and costly, and assertions on exact model text break with every model update. Without tests, prompts and parsing code regress silently. The split above gives fast, reliable feedback on your code and honest, statistical feedback on model quality.

## How It Works

- `ChatModel` has a single abstract method, `call(Prompt)`, so a stub is a few lines. Capture the `Prompt` to assert on system text, user text, options and tool definitions.
- `ChatClient.builder(stubModel)` gives the real ChatClient behaviour — templates, advisors, structured-output conversion, tool loop — against the stub.
- Tools are plain methods: call them directly with a `ToolContext`.
- Advisors are plain objects: run them in a `ChatClient` over a stub, or call `before`/`after` directly.
- For HTTP-level tests, point the provider module at a local stub (`spring.ai.openai.base-url=http://localhost:<port>`) to test timeouts, retries and error mapping — the [Responses and Errors](../../spring-ai-chat-client/spring-ai-responses-and-errors/content.md) lesson used this technique.

## Example

A JUnit 6 test class for a small tutor service and a grade tool:

```java
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.tool.annotation.Tool;

class TutorServiceTest {

    // ---- code under test ---------------------------------------------------------------

    record QuizQuestion(String question, List<String> options, int answerIndex) {
    }

    static class TutorService {
        private final ChatClient chatClient;

        TutorService(ChatClient.Builder builder) {
            this.chatClient = builder.defaultSystem("You are a Java tutor. Never reveal exam answers.").build();
        }

        String explain(String topic) {
            String answer = chatClient.prompt()
                    .user(u -> u.text("Explain {topic} in two sentences.").param("topic", topic))
                    .call().content();
            return (answer == null || answer.isBlank()) ? "Sorry, I couldn't produce an explanation." : answer;
        }

        QuizQuestion quiz(String topic) {
            QuizQuestion q = chatClient.prompt().user("One quiz question about " + topic).call().entity(QuizQuestion.class);
            if (q.answerIndex() < 0 || q.answerIndex() >= q.options().size()) {
                throw new IllegalStateException("Model returned an invalid answer index: " + q.answerIndex());
            }
            return q;
        }
    }

    static class GradeTools {
        @Tool(description = "Get the current learner's grade for a course")
        String myGrade(String courseId, ToolContext context) {
            String learner = (String) context.getContext().get("learnerId");
            if (!"s-42".equals(learner) || !"java-101".equals(courseId)) {
                throw new IllegalArgumentException("You are not enrolled in " + courseId);
            }
            return "A";
        }
    }

    // ---- test support: a ChatModel that records prompts and returns fixed replies -----

    static class StubChatModel implements ChatModel {
        final List<Prompt> prompts = new ArrayList<>();
        private final List<String> replies;

        StubChatModel(String... replies) {
            this.replies = new ArrayList<>(List.of(replies));
        }

        @Override
        public ChatResponse call(Prompt prompt) {
            prompts.add(prompt);
            return new ChatResponse(List.of(new Generation(new AssistantMessage(replies.remove(0)))));
        }
    }

    // ---- tests -------------------------------------------------------------------------

    @Test
    void sendsSystemRulesAndRendersTheTopic() {
        var model = new StubChatModel("Records are immutable data carriers.");
        new TutorService(ChatClient.builder(model)).explain("records");

        Prompt sent = model.prompts.get(0);
        assertThat(sent.getSystemMessage().getText()).contains("Never reveal exam answers");
        assertThat(sent.getUserMessage().getText()).isEqualTo("Explain records in two sentences.");
    }

    @Test
    void blankModelAnswerFallsBackToAFriendlyMessage() {
        var model = new StubChatModel("   ");
        assertThat(new TutorService(ChatClient.builder(model)).explain("records"))
                .isEqualTo("Sorry, I couldn't produce an explanation.");
    }

    @Test
    void parsesStructuredOutputAndRejectsInvalidAnswers() {
        var good = new StubChatModel("""
                {"question": "Which keyword declares a record?", "options": ["class", "record"], "answerIndex": 1}""");
        assertThat(new TutorService(ChatClient.builder(good)).quiz("records").options()).containsExactly("class", "record");

        var bad = new StubChatModel("""
                {"question": "Which keyword declares a record?", "options": ["class", "record"], "answerIndex": 5}""");
        assertThatThrownBy(() -> new TutorService(ChatClient.builder(bad)).quiz("records"))
                .hasMessageContaining("invalid answer index: 5");
    }

    @Test
    void toolRefusesOtherLearnersCoursesWithoutAnyModel() {
        var tools = new GradeTools();
        assertThat(tools.myGrade("java-101", new ToolContext(Map.of("learnerId", "s-42")))).isEqualTo("A");
        assertThatThrownBy(() -> tools.myGrade("db-201", new ToolContext(Map.of("learnerId", "s-42"))))
                .hasMessage("You are not enrolled in db-201");
    }
}
```

**Test result:** run for this lesson with the JUnit Platform 6.0.3 launcher — 4 tests found, 4 succeeded, 0 failed, without any network access.

### Code walkthrough

- `StubChatModel` captures each `Prompt`, so the first test checks what the model would have received: the system rule and the rendered template. Prompts are code; test them like code.
- The fallback test proves the service never shows a blank answer — behaviour you cannot reliably trigger with a real model.
- The structured-output test uses the real `entity(QuizQuestion.class)` conversion on canned JSON, including the invalid case your validation must catch.
- The tool test needs no model at all: authorisation is ordinary Java.
- Nothing asserts on wording the model chose — those checks belong in evaluations.

### Integration tests with a local model

```java
// Illustrative fragment — Ollama in a container; slow, so tag it and run it separately
@SpringBootTest
@Testcontainers
@Tag("integration")
class TutorServiceOllamaIT {

    static final String OLLAMA_TAG = "...";            // pin the image tag your team has tested

    @Container
    @ServiceConnection
    static OllamaContainer ollama = new OllamaContainer("ollama/ollama:" + OLLAMA_TAG);

    @Autowired
    TutorService tutorService;

    @Test
    void answersWithSomething() {
        assertThat(tutorService.explain("records")).isNotBlank();     // property, not exact text
    }
}
```

`spring-ai-spring-boot-testcontainers` provides service connections for supported containers (for example Ollama and pgvector-enabled PostgreSQL) so the auto-configured beans connect to them. Pull the model in the container (or use an image that contains it) and keep assertions to properties such as "not blank", "valid JSON", "mentions the course id".

## Common Mistakes and Troubleshooting

- **Unit tests that call the real provider.** Slow, flaky, costly and they need secrets in CI. Use a stub `ChatModel`.
- **Mocking `ChatClient`'s fluent chain with Mockito.** Deep stubbing of `prompt().user().call().content()` is brittle and skips real template, advisor and conversion logic; stub the `ChatModel` instead.
- **Asserting exact model text** in integration or evaluation tests. Assert properties and use evaluators.
- **Ignoring the tool loop in tests.** Script tool-call replies (as the course's `ScriptedChatModel` does) to test multi-step flows deterministically.
- **No test for provider errors.** Use a stub HTTP server returning 429/500/timeouts to test retries and error mapping.

## Production Considerations

- Keep a library of canned model replies (normal, empty, truncated, malformed JSON, tool calls) for unit tests.
- Run integration tests against a pinned local model version; record which model and version the CI used.
- Separate test tags: `unit` (every build), `integration` (CI), `ai-eval` (nightly, needs keys and budget).
- Test advisor order and the final prompt for every feature — order bugs are invisible in production.

## Common Interview Traps

- **"LLM apps can't be unit-tested."** Your code around the model can, deterministically.
- **"Mock the ChatClient."** Stub the `ChatModel`; keep real ChatClient behaviour in the test.
- **"Integration tests should check the exact answer."** They check wiring and properties; quality belongs to evaluations.

## Key Takeaways

- Unit tests: stub `ChatModel`, assert prompts, parsing, validation, fallbacks; test tools and advisors directly.
- Integration tests: local stub server or local model via Testcontainers; assert properties.
- Evaluations: real model, statistical, scheduled.
- Never let unit tests depend on a provider, a key or the network.

## Official References

- [Spring AI Testcontainers support](https://docs.spring.io/spring-ai/reference/api/testcontainers.html)
- [Evaluation Testing](https://docs.spring.io/spring-ai/reference/api/testing.html)
- [Spring Boot: Testing](https://docs.spring.io/spring-boot/reference/testing/index.html)
- Related: [The Practice Lab](../../spring-ai-foundations/spring-ai-practice-lab/content.md) · [AI Evaluation and Regression](../ai-evaluation-and-regression/content.md) · [Validating AI Output](../../spring-ai-chat-client/ai-output-validation/content.md)
