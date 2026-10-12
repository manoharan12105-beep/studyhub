# call() vs stream(): Blocking and Streaming Responses

**Module:** Spring AI: ChatClient · **Interview priority:** Core · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Explain the difference between waiting for a full answer and receiving it in chunks.
- Use `stream().content()` and `stream().chatResponse()` and consume a `Flux`.
- Expose a streaming endpoint with Server-Sent Events from a Spring MVC application.
- Know what does not work with streaming (typed `entity(...)`, `validateSchema()`) and how to handle errors and cancellation.

## Definition

`call()` sends the request and **blocks** until the model has generated the whole answer. `stream()` returns a reactive **`Flux`** that emits pieces of the answer (chunks of text, or `ChatResponse` fragments) as the provider generates them. Both send the same prompt; they differ in how and when you receive the result.

## Why It Matters

Generating a long answer can take many seconds. With `call()` the user sees nothing until the end; with `stream()` the first words appear after a fraction of that time, which makes chat interfaces feel responsive. Streaming also changes error handling, structured output, metrics and threading, so choose it deliberately.

## How It Works

| | `call()` | `stream()` |
|--|---------|-----------|
| Return type | `String`, `ChatResponse`, entity … | `Flux<String>`, `Flux<ChatResponse>`, `Flux<ChatClientResponse>` |
| When you get text | After the full answer | Chunk by chunk |
| Time to first token for the user | Total generation time | Usually much shorter |
| Total time | Same generation work | Same generation work (often slightly longer overall) |
| Typed output (`entity`) | Yes | No — collect the text and convert yourself |
| `validateSchema()` retries | Yes | No |
| Threading | Blocks the calling thread | Non-blocking; work happens when the `Flux` is subscribed |
| Web stack | Spring MVC | Requires Reactor on the classpath (`spring-boot-starter-webflux`), even in an MVC app |

Two consequences:

- **Nothing happens until subscription.** `stream().content()` returns a `Flux` immediately; the HTTP request to the provider starts when something subscribes (a controller returning it, or `subscribe()`/`collectList()`).
- **Metadata arrives in pieces.** Each `ChatResponse` chunk carries part of the text; token usage is typically reported only in a late chunk, and only when the provider sends it for streams.

## Streaming Over HTTP (Server-Sent Events)

Spring MVC can return a `Flux` from a controller and write each element as a Server-Sent Event:

```java
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Flux;

@RestController
class StreamingTutorController {

    private final ChatClient chatClient;

    StreamingTutorController(ChatClient.Builder builder) {
        this.chatClient = builder.defaultSystem("You are a Java tutor.").build();
    }

    @GetMapping(path = "/api/tutor/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    Flux<String> stream(@RequestParam String question) {
        return chatClient.prompt()
                .user(question)
                .stream()
                .content();
    }
}
```

```bash
curl -N "http://localhost:8080/api/tutor/stream?question=What%20is%20a%20virtual%20thread"
```

**Expected behaviour:** `curl -N` prints `data:` lines as they arrive — a few words per event — instead of one response at the end. A browser can consume the same endpoint with `EventSource`. Validate the question and limit its length exactly as for blocking endpoints ([REST Service Design](../spring-ai-rest-service-design/content.md)).

Add `spring-boot-starter-webflux` alongside `spring-boot-starter-web`: the application stays a servlet (MVC) application, and Reactor is available for streaming calls.

## Example

Consume a stream in plain Java with the scripted model from the [Practice Lab](../../spring-ai-foundations/spring-ai-practice-lab/content.md), whose `stream(...)` emits one word per chunk:

```java
import java.util.List;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;

import reactor.core.publisher.Flux;

public class StreamingDemo {

    public static void main(String[] args) {
        ScriptedChatModel model = new ScriptedChatModel()
                .reply("Virtual threads are cheap threads managed by the JVM.")
                .reply("They make blocking code scale.");
        ChatClient client = ChatClient.create(model);

        Flux<String> chunks = client.prompt().user("What is a virtual thread?").stream().content();
        System.out.println("Requests before subscribing: " + model.prompts().size());

        List<String> received = chunks.collectList().block();
        System.out.println("Requests after subscribing:  " + model.prompts().size());
        System.out.println("Chunks: " + received.size() + " -> " + received);
        System.out.println("Joined: " + String.join("", received));

        List<ChatResponse> responses = client.prompt().user("Why use them?").stream().chatResponse().collectList().block();
        System.out.println("ChatResponse chunks: " + responses.size()
                + ", first text: '" + responses.get(0).getResult().getOutput().getText() + "'");
    }
}
```

**Output:**

```text
Requests before subscribing: 0
Requests after subscribing:  1
Chunks: 9 -> [Virtual , threads , are , cheap , threads , managed , by , the , JVM.]
Joined: Virtual threads are cheap threads managed by the JVM.
ChatResponse chunks: 5, first text: 'They '
```

### Code walkthrough

- Building the `Flux` did not contact the model (0 requests); `collectList().block()` subscribed and triggered the request. In a controller, Spring subscribes when it writes the response — never call `block()` there.
- Joining the chunks gives the complete text; that is what you would store in chat history or convert to a record after the stream ends.
- `stream().chatResponse()` emits `ChatResponse` objects, so you can read per-chunk metadata (and usage when the provider sends it).

## Common Mistakes and Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Nothing happens when calling `stream()` | Nobody subscribed to the `Flux` | Return it from the controller or subscribe |
| `ClassNotFoundException` for Reactor/WebFlux classes, or streaming unavailable in an MVC app | Reactive stack missing | Add `spring-boot-starter-webflux` |
| Whole answer arrives at once in the browser | A proxy or the client buffers the response | Use `text/event-stream`, disable proxy buffering for the route, use `curl -N` to test |
| Need a record from a stream | `entity(...)` is call-only | Collect the text, then convert with a `BeanOutputConverter` (format instructions must be in the prompt) |
| Errors after some text was sent | The provider failed mid-stream; HTTP status was already 200 | Emit an error event (`onErrorResume`) and let the UI show a retry option |
| Calling `block()` inside a WebFlux handler | Blocking a non-blocking thread | Return the `Flux` instead |

## Production Considerations

- **Cancellation:** when a user closes the page, the subscription is cancelled; make sure costly follow-up work (saving history) is triggered on completion, not before.
- **Timeouts:** apply an overall time limit (`.timeout(Duration.ofSeconds(60))` on the `Flux`) in addition to the provider client's timeout.
- **Observability and usage:** streaming observations and token usage depend on provider support; verify that your cost tracking still works for streamed calls.
- **When not to stream:** background jobs, structured extraction, and short answers gain nothing from streaming — use `call()`.

## Common Interview Traps

- **"Streaming makes the model faster."** Total generation time is about the same; streaming improves *perceived* latency (time to first token).
- **"You can stream into `entity(MyRecord.class)`."** Typed conversion needs the complete response; it is call-only.
- **"A streaming endpoint needs a WebFlux application."** A Spring MVC application can return `Flux` as Server-Sent Events; it only needs Reactor on the classpath.

## Key Takeaways

- `call()` blocks for the whole answer; `stream()` emits chunks through a lazy `Flux`.
- Stream user-facing chat; use `call()` for structured output, validation retries and background work.
- Handle subscription, buffering, mid-stream errors, cancellation and timeouts explicitly.

## Official References

- [ChatClient: streaming responses and implementation notes](https://docs.spring.io/spring-ai/reference/api/chatclient.html)
- [Structured output is call-only](https://docs.spring.io/spring-ai/reference/api/structured-output.html)
- [Spring Framework: Server-Sent Events in Spring MVC](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-async.html)
