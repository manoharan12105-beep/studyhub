# Observability: Metrics and Traces for AI Calls

**Module:** Spring AI: Production · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Name the observations Spring AI creates for ChatClient calls, advisors, model calls, tools and vector stores.
- Read the trace of a tool-calling request and find where time and tokens go.
- Export AI metrics and traces with Spring Boot Actuator, Micrometer and OpenTelemetry.
- Choose dashboards and alerts for AI features.

## Definition

Spring AI instruments its components with the **Micrometer Observation API**. Each observation becomes a **timer metric** and, when tracing is on, a **span**. Names and attributes follow the OpenTelemetry generative-AI conventions (`gen_ai.*`) plus Spring AI-specific keys (`spring.ai.*`).

| Observation | Created by | Useful keys |
|-------------|------------|-------------|
| `spring.ai.chat.client` | Each `ChatClient` call | `spring.ai.chat.client.stream` |
| `spring.ai.advisor` | Each advisor in the chain | `spring.ai.advisor.name` |
| `gen_ai.client.operation` | Provider `ChatModel` / `EmbeddingModel` calls | `gen_ai.request.model`, `gen_ai.response.model`, `gen_ai.operation.name`, `gen_ai.system` |
| `spring.ai.tool` | Each tool execution | `spring.ai.tool.definition.name` |
| Vector store observations | `similaritySearch`, `add`, `delete` | store kind, operation |

Token usage is exported as the counter `gen_ai.client.token.usage` with `gen_ai.token.type` = input/output/total.

## Why It Matters

AI calls are the slowest and most expensive dependency in most applications, and their behaviour changes without code changes (new model versions, longer histories, more retrieved context). Metrics show *how much* (latency, tokens, errors per model and feature); traces show *where* (which advisor, which tool round, which retrieval call). Without them, "the assistant is slow" or "the bill doubled" cannot be diagnosed.

## How It Works

```text
spring.ai.chat.client                       one per ChatClient call
 └─ spring.ai.advisor (each advisor)        memory, RAG, guardrails, Tool Calling Advisor …
     └─ gen_ai.client.operation             each provider model call (tokens, model, finish reason)
     └─ spring.ai.tool                      each tool execution between model calls
```

Spring Boot wiring:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
<!-- traces via OpenTelemetry (Spring Boot 4) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-opentelemetry</artifactId>
</dependency>
```

```properties
management.endpoints.web.exposure.include=health,prometheus
management.tracing.sampling.probability=0.1
# Content in observations stays off (defaults shown)
spring.ai.chat.client.observations.log-prompt=false
spring.ai.chat.observations.log-completion=false
spring.ai.tools.observations.include-content=false
```

Auto-configured `ChatClient.Builder`, `ChatModel`, `ToolCallingManager` and vector stores receive the application's `ObservationRegistry` automatically — another reason not to build clients with `ChatClient.create(model)` in production code.

## Example

A registry with a handler that prints each finished observation, its nesting and its low-cardinality keys, around a request with one tool call:

```java
import java.util.TreeMap;

import com.example.studyai.lab.ScriptedChatModel;
import io.micrometer.common.KeyValue;
import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationHandler;
import io.micrometer.observation.ObservationRegistry;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.ToolCallingAdvisor;
import org.springframework.ai.model.tool.ToolCallingManager;
import org.springframework.ai.tool.annotation.Tool;

public class ObservabilityDemo {

    static class GradeTools {
        @Tool(description = "Get the learner's latest grade")
        String latestGrade() {
            return "A";
        }
    }

    /** Prints every finished observation with its nesting depth and low-cardinality keys. */
    static class PrintingHandler implements ObservationHandler<Observation.Context> {
        @Override
        public void onStop(Observation.Context context) {
            int depth = 0;
            for (var parent = context.getParentObservation(); parent != null; parent = parent.getContextView().getParentObservation()) {
                depth++;
            }
            var keys = new TreeMap<String, String>();
            for (KeyValue kv : context.getLowCardinalityKeyValues()) {
                keys.put(kv.getKey(), kv.getValue());
            }
            System.out.println("  ".repeat(depth) + context.getName() + " " + keys);
        }

        @Override
        public boolean supportsContext(Observation.Context context) {
            return true;
        }
    }

    public static void main(String[] args) {
        ObservationRegistry registry = ObservationRegistry.create();
        registry.observationConfig().observationHandler(new PrintingHandler());

        ScriptedChatModel model = new ScriptedChatModel()
                .replyWithToolCall("latestGrade", "{}")
                .reply("Your latest grade is A.");
        ChatClient client = ChatClient.builder(model, registry, null, null)
                .defaultAdvisors(ToolCallingAdvisor.builder()
                        .toolCallingManager(ToolCallingManager.builder().observationRegistry(registry).build())
                        .build())
                .build();

        System.out.println("Observations (innermost first):");
        client.prompt().user("What's my latest grade?").tools(new GradeTools()).call().content();
    }
}
```

**Output:**

```text
Observations (innermost first):
    spring.ai.advisor {gen_ai.operation.name=framework, gen_ai.system=spring_ai, spring.ai.advisor.name=call, spring.ai.kind=advisor}
    spring.ai.tool {gen_ai.operation.name=execute_tool, gen_ai.system=spring_ai, spring.ai.kind=tool_call, spring.ai.tool.definition.name=latestGrade, spring.ai.tool.type=function}
    spring.ai.advisor {gen_ai.operation.name=framework, gen_ai.system=spring_ai, spring.ai.advisor.name=call, spring.ai.kind=advisor}
  spring.ai.advisor {gen_ai.operation.name=framework, gen_ai.system=spring_ai, spring.ai.advisor.name=Tool Calling Advisor, spring.ai.kind=advisor}
spring.ai.chat.client {gen_ai.operation.name=framework, gen_ai.system=spring_ai, spring.ai.chat.client.stream=false, spring.ai.kind=chat_client}
```

### Code walkthrough

- Observations finish innermost first, so read the output bottom-up: one `spring.ai.chat.client` observation contains the `Tool Calling Advisor` observation, which contains two model-call advisor observations (`call`) with the `spring.ai.tool` execution of `latestGrade` between them.
- The course's `ScriptedChatModel` is not instrumented. A provider `ChatModel` (OpenAI, Anthropic, Ollama…) adds a `gen_ai.client.operation` observation inside each `call` advisor, carrying the model name, token usage and finish reason.
- In this standalone program the registry was passed explicitly — to `ChatClient.builder(model, registry, null, null)` and to the `ToolCallingManager`. In Spring Boot, auto-configuration does this for you.
- Low-cardinality keys (model, operation, tool name) become metric tags; never put prompts or user ids in tags — they explode metric cardinality and leak data.

## Common Mistakes and Troubleshooting

- **No AI metrics at all.** The client was built with `ChatClient.create(model)` or a hand-made `ToolCallingManager` without the registry; use the auto-configured beans.
- **Enabling `log-prompt` to "see what happened".** Use traces and retrieved ids first; content in telemetry needs the same protection as logs ([Logging and Sensitive Data](../ai-logging-and-sensitive-data/content.md)).
- **High-cardinality tags.** Adding the conversation id or user id as a metric tag creates millions of time series; put such values in traces or logs only.
- **Sampling everything in production.** Full tracing of long AI requests is costly; sample, and keep 100% of errors if your backend supports it.
- **Streaming spans that never end.** A cancelled `Flux` must be handled so the observation stops ([call() vs stream()](../../spring-ai-chat-client/spring-ai-call-vs-stream/content.md)).

## Production Considerations

Dashboards and alerts to start with:

| Signal | Source | Alert idea |
|--------|--------|-----------|
| Latency p50/p95 per model and feature | `gen_ai.client.operation`, `spring.ai.chat.client` timers | p95 above SLO for 10 minutes |
| Tokens per minute by type and model | `gen_ai.client.token.usage` | Spend rate above budget |
| Error rate by exception type | timer `error` tag | Any 401/403; 5xx above baseline |
| Tool executions and failures | `spring.ai.tool` | Failure rate, calls per request |
| Retrieval latency and empty results | Vector store observations, custom counters | Empty-retrieval rate rising |

Add a `feature` tag through your own conventions or advisor so costs and errors can be attributed to features.

## Common Interview Traps

- **"Logs are enough for AI observability."** Metrics give rates and percentiles; traces give the structure of a multi-step request.
- **"Token usage must be computed by hand."** Spring AI exports `gen_ai.client.token.usage` from provider responses.
- **"Tracing an AI call means storing the prompt."** Spans can carry only metadata; content is opt-in and off by default.

## Key Takeaways

- Observations: `spring.ai.chat.client` → `spring.ai.advisor` → `gen_ai.client.operation` / `spring.ai.tool`; vector stores too.
- Metrics: timers per observation plus `gen_ai.client.token.usage`.
- Spring Boot: Actuator + a Micrometer registry + `spring-boot-starter-opentelemetry` for traces; use auto-configured beans.
- Low-cardinality tags only; content in telemetry stays off.

## Official References

- [Spring AI Observability](https://docs.spring.io/spring-ai/reference/observability/index.html)
- [Spring Boot: Observability](https://docs.spring.io/spring-boot/reference/actuator/observability.html)
- [OpenTelemetry semantic conventions for generative AI](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- Related: [Actuator and Monitoring](../../production/actuator-and-monitoring/content.md) · [Token Usage and Cost Control](../token-usage-and-cost-control/content.md) · [The Tool-Calling Loop](../../spring-ai-tools-and-advisors/tool-calling-loop/content.md)
