# Response Extraction, Metadata and Error Handling

**Module:** Spring AI: ChatClient · **Interview priority:** Core · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Navigate a `ChatResponse`: generations, the `AssistantMessage`, finish reason, token usage, model id and rate-limit data.
- Detect truncated, empty and filtered answers.
- Know which exceptions reach your code — provider SDK exceptions and Spring AI exceptions — and where they come from.
- Map AI failures to clear HTTP responses with `@RestControllerAdvice`.

## Definition

The result of a `ChatClient` call is either the plain text (`content()`), a typed entity, or the full **`ChatResponse`**: a list of **`Generation`s** (each with an `AssistantMessage` and `ChatGenerationMetadata` such as the **finish reason**) plus **`ChatResponseMetadata`** (id, model, **`Usage`**, **`RateLimit`** and extra keys). **Errors** surface as runtime exceptions: authentication, rate limits, server errors and timeouts from the provider client, and conversion or validation errors from Spring AI.

## Why It Matters

A successful HTTP call can still be a failed answer: cut off at the token limit, blocked by a content filter, empty because the model only requested a tool, or unparseable. And a model call can fail in many ways your users should not see as a generic 500. Reading the response properly and mapping failures well separates a demo from a service.

## How It Works

```text
ChatResponse
├── getResults() : List<Generation>           usually one
│     └── Generation
│           ├── getOutput() : AssistantMessage
│           │      ├── getText()               the answer (may be null/empty)
│           │      └── getToolCalls()          tool requests instead of text
│           └── getMetadata() : ChatGenerationMetadata
│                  ├── getFinishReason()       e.g. STOP, LENGTH (provider-specific spelling)
│                  └── getContentFilters()
└── getMetadata() : ChatResponseMetadata
       ├── getId(), getModel()
       ├── getUsage()  → getPromptTokens(), getCompletionTokens(), getTotalTokens()
       ├── getRateLimit() → requests/tokens limit, remaining, reset (when the provider sends them)
       └── get(key)    → extra keys, e.g. added by advisors
```

`getResult()` is shorthand for the first generation. With the OpenAI module in 2.0.1, finish reasons arrive upper-cased: a normal answer reports `STOP`, an answer cut off by the output limit reports `LENGTH`. Other providers use their own values (for example `end_turn`-style names), so compare case-insensitively and keep provider differences in one place.

## Checking an Answer

| Check | How | Typical action |
|-------|-----|----------------|
| Truncated | finish reason `LENGTH` | Raise the output limit, ask for a shorter answer, or tell the user it was cut |
| Empty | `getText()` null or blank | Inspect tool calls and content filters; return a fallback |
| Tool request left unexecuted | `getToolCalls()` not empty | Ensure the tool loop is enabled (default with `ChatClient`) |
| Filtered | `getContentFilters()` not empty, or a provider-specific finish reason | Return a safe refusal message |
| Expensive | `getUsage().getTotalTokens()` | Record per user/tenant, enforce budgets ([Token Usage](../../spring-ai-production/token-usage-and-cost-control/content.md)) |

## Exceptions You Will Meet

| Situation | OpenAI module (2.0.1, `openai-java` SDK) | Modules using `spring-ai-retry` (e.g. Ollama) |
|-----------|------------------------------------------|-----------------------------------------------|
| Missing key | `IllegalStateException` at **startup** | Depends on the provider |
| 401 invalid key | `com.openai.errors.UnauthorizedException` | `NonTransientAiException` |
| 429 rate limit | `com.openai.errors.RateLimitException` after SDK retries | `NonTransientAiException`, **not retried** by default (4xx codes are non-transient unless you set `spring.ai.retry.on-http-codes=429`) |
| 5xx server error | `com.openai.errors.InternalServerException` after SDK retries | `TransientAiException` |
| Timeout / network | `com.openai.errors.OpenAIIoException` (cause `SocketTimeoutException`) | Underlying I/O exception |
| Unparseable structured output | Jackson exception from `entity(...)` (Jackson 3: `tools.jackson.core.exc.StreamReadException`, …) | Same |
| Missing conversation id | `IllegalArgumentException: conversationId cannot be null` | Same |

The OpenAI exceptions all extend `com.openai.errors.OpenAIException`; service errors (`OpenAIServiceException`) expose `statusCode()`. These classes are **provider-specific**: if your code must stay portable, catch them in one adapter class and translate them to your own exception types, rather than spreading `com.openai` imports across services. Retry behaviour is covered in [Resilience and Provider Errors](../../spring-ai-production/ai-resilience-and-provider-errors/content.md).

## Mapping Failures to HTTP

```java
package com.example.studyai.web;

public class AiUnavailableException extends RuntimeException {

    public AiUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

```java
package com.example.studyai.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
class AiExceptionHandler {

    @ExceptionHandler(AiUnavailableException.class)
    ProblemDetail aiUnavailable(AiUnavailableException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE,
                "The assistant is temporarily unavailable. Please try again.");
        problem.setTitle("AI service unavailable");
        return problem;
    }
}
```

The service catches failures around the model call, logs the real cause (without the prompt text), and throws `AiUnavailableException`. Clients get a stable `503` with a useful message instead of a stack trace. Pattern details: [Global Exception Handling](../../exception-handling/global-exception-handling/content.md).

## Example

A service that turns a raw `ChatResponse` into an application result, flagging truncation and refusing empty answers. A tiny lambda `ChatModel` returns a response that was cut off at the token limit — the same shape the OpenAI module produces for a `length` finish.

```java
import java.util.List;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.metadata.ChatGenerationMetadata;
import org.springframework.ai.chat.metadata.ChatResponseMetadata;
import org.springframework.ai.chat.metadata.DefaultUsage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;

public class ResponseInspection {

    record Answer(String text, boolean truncated, int totalTokens) {}

    static Answer toAnswer(ChatResponse response) {
        Generation generation = response.getResult();
        String text = generation.getOutput().getText();
        if (text == null || text.isBlank()) {
            throw new IllegalStateException("Model returned no text; tool calls: "
                    + generation.getOutput().getToolCalls().size());
        }
        String finish = generation.getMetadata().getFinishReason();
        boolean truncated = finish != null && finish.equalsIgnoreCase("length");
        Integer total = response.getMetadata().getUsage().getTotalTokens();
        return new Answer(text, truncated, total == null ? 0 : total);
    }

    public static void main(String[] args) {
        ChatModel cutOff = prompt -> new ChatResponse(
                List.of(new Generation(new AssistantMessage("Garbage collection is the process by which the JVM"),
                        ChatGenerationMetadata.builder().finishReason("LENGTH").build())),
                ChatResponseMetadata.builder().model("demo-model").usage(new DefaultUsage(42, 12)).build());

        ChatResponse response = ChatClient.create(cutOff).prompt().user("Explain garbage collection").call().chatResponse();
        Answer answer = toAnswer(response);
        System.out.println("Text:      " + answer.text());
        System.out.println("Truncated: " + answer.truncated());
        System.out.println("Tokens:    " + answer.totalTokens() + " (model " + response.getMetadata().getModel() + ")");

        ChatModel silent = prompt -> new ChatResponse(List.of(new Generation(new AssistantMessage(""))));
        try {
            toAnswer(ChatClient.create(silent).prompt().user("Hi").call().chatResponse());
        } catch (IllegalStateException e) {
            System.out.println("Rejected:  " + e.getMessage());
        }
    }
}
```

**Output:**

```text
Text:      Garbage collection is the process by which the JVM
Truncated: true
Tokens:    54 (model demo-model)
Rejected:  Model returned no text; tool calls: 0
```

### Code walkthrough

- `ChatModel` has one abstract method, so a lambda is enough for a test double that returns a hand-made `ChatResponse`.
- `getResult().getMetadata().getFinishReason()` reveals the truncation even though the call "succeeded"; `equalsIgnoreCase` tolerates provider spelling.
- `DefaultUsage(42, 12)` reports prompt and completion tokens; the total (54) is computed from them.
- An empty answer is treated as a failure instead of being shown to the user.

## Common Mistakes and Troubleshooting

- **Using `content()` everywhere.** You lose the finish reason and usage; use `chatResponse()` where they matter.
- **Assuming `getUsage()` is always complete.** Some providers or streaming modes omit it; null-check and fall back to estimates.
- **Comparing finish reasons with `==` or exact case.** Spelling differs by provider; normalise.
- **Leaking provider errors to clients.** Map them to your own error types and HTTP statuses; never echo raw provider messages that may contain account details.
- **Catching `Exception` and returning a fake answer.** Make failures visible (status, metrics, logs) even when you show a friendly fallback.

## Production Considerations

- Record finish reasons, token usage and error types as metrics; alert on rising `LENGTH` rates, 429s and 5xx rates.
- Decide per endpoint which failures get a fallback (cached or rule-based answer) and which return an error.
- Keep provider-specific exception handling in one adapter so switching providers does not touch business code.

## Common Interview Traps

- **"A 200 response means a good answer."** It may be truncated, filtered, empty or a tool request.
- **"Spring AI wraps every provider error in its own exception."** In 2.0 the OpenAI module surfaces the `openai-java` SDK's exceptions; Spring AI's `TransientAiException`/`NonTransientAiException` are used by modules built on `spring-ai-retry`.
- **"Token usage is only for billing."** It also drives budgets, rate-limit planning and regression detection.

## Key Takeaways

- `ChatResponse` = generations (text, tool calls, finish reason) + metadata (usage, model, rate limits).
- Check finish reason and emptiness before trusting an answer.
- Translate provider-specific exceptions into your own types and clear HTTP responses.

## Official References

- [Chat Model API: ChatResponse and Generation](https://docs.spring.io/spring-ai/reference/api/chatmodel.html)
- [ChatClient: call() return values](https://docs.spring.io/spring-ai/reference/api/chatclient.html)
- [OpenAI chat (2.0 uses the openai-java SDK)](https://docs.spring.io/spring-ai/reference/api/chat/openai-chat.html)
