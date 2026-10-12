# Traditional Applications vs LLM-Powered Applications

**Module:** Spring AI: Foundations · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Contrast deterministic business logic with probabilistic model output.
- Identify which parts of a feature belong in Java code and which can be delegated to a model.
- Describe the new failure modes an LLM introduces: wrong-but-confident answers, format drift, latency, cost and injection.
- Sketch the "deterministic shell around a probabilistic core" architecture used throughout this course.

## Definition

A **traditional application** computes its output from its input with code you wrote: the same input always gives the same output, and every rule is explicit. An **LLM-powered application** delegates part of the work — understanding free text, summarising, drafting, choosing a tool — to a **large language model**, whose output is generated text that is usually right, sometimes wrong, and never guaranteed to have the same wording twice.

## Why It Matters

Most production problems in AI features come from treating model output like the return value of a Java method. Knowing the differences tells you where to put validation, tests, timeouts and human review — and when an LLM is the wrong tool ([When Not to Use an LLM](../../spring-ai-advanced/when-not-to-use-an-llm/content.md)).

## How the Two Styles Differ

| Aspect | Traditional code | LLM call |
|--------|------------------|----------|
| Determinism | Same input → same output | Same prompt can give different wording; temperature changes variety |
| Correctness | Provable by tests | Statistical: usually right, can be confidently wrong (hallucination) |
| Interface | Typed parameters and return values | Natural-language prompt in, text out (structure must be requested and checked) |
| Latency | Microseconds to milliseconds | Hundreds of milliseconds to tens of seconds |
| Cost | CPU you already pay for | Per token, per call |
| Failure modes | Exceptions, bugs | Timeouts, rate limits, refusals, format drift, prompt injection |
| Change management | Code review and deploy | Model upgrades can change behaviour without any code change |
| Testing | Assert exact results | Assert structure and properties; evaluate quality on datasets |

## The Deterministic Shell Around a Probabilistic Core

A reliable design keeps the model in a small, well-guarded part of the flow:

```text
HTTP request ──► validate input (Java) ──► build prompt (Java) ──► LLM (probabilistic)
                                                                      │
HTTP response ◄── business rules / authorization (Java) ◄── parse + validate output (Java)
```

- **Before the call:** validate and limit input, select only the data the model needs, and apply authorization.
- **The call:** a bounded request with a timeout, a token limit and a clear instruction.
- **After the call:** parse into a type, validate the values, apply deterministic business rules, and only then act.

Spring AI gives you the hooks for each part: Bean Validation on request DTOs, `PromptTemplate` for prompts, model options for limits, `.entity(...)` for typed output, and advisors for cross-cutting checks.

## What to Delegate — and What Not To

| Good fit for an LLM | Keep in Java |
|---------------------|--------------|
| Understanding a free-text question | Calculating a price, tax or grade |
| Summarising or rewriting text | Authorization ("may this user see this order?") |
| Extracting fields from messy text (then validating them) | Database writes and money movement |
| Drafting a reply for a human to approve | Anything that must be exact and auditable |
| Choosing which of your tools to call | Executing the tool and checking its input |

A useful rule: **the model may suggest, your code decides.** When the model's output triggers an action, deterministic code checks it first.

## Example

The same feature — "classify a support ticket" — written both ways.

```java
import java.util.Locale;

import org.springframework.ai.chat.client.ChatClient;

enum TicketCategory { BILLING, TECHNICAL, ACCOUNT, OTHER }

record TicketClassification(TicketCategory category, String reason) {}

class RuleBasedClassifier {

    TicketCategory classify(String text) {
        String t = text.toLowerCase(Locale.ROOT);
        if (t.contains("invoice") || t.contains("refund")) {
            return TicketCategory.BILLING;
        }
        if (t.contains("password") || t.contains("login")) {
            return TicketCategory.ACCOUNT;
        }
        if (t.contains("error") || t.contains("crash")) {
            return TicketCategory.TECHNICAL;
        }
        return TicketCategory.OTHER;
    }
}

class LlmClassifier {

    private final ChatClient chatClient;

    LlmClassifier(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    TicketClassification classify(String text) {
        TicketClassification result = chatClient.prompt()
                .system("Classify the support ticket. Use OTHER when unsure.")
                .user(text)
                .call()
                .entity(TicketClassification.class);
        if (result == null || result.category() == null) {
            return new TicketClassification(TicketCategory.OTHER, "model returned no category");
        }
        return result;
    }
}
```

### Code walkthrough

- `RuleBasedClassifier` is fast, free and predictable, but misses "I was charged twice" because no keyword matches.
- `LlmClassifier` understands paraphrases ("charged twice" → `BILLING`) and returns a short reason, but it costs a model call and can be wrong.
- `.entity(TicketClassification.class)` asks for JSON matching the record; the enum restricts the allowed categories, and the `null` check is the deterministic guard after the probabilistic step.

**Expected behaviour:** for "I was charged twice this month", the rule-based classifier returns `OTHER`; a capable model typically returns `BILLING` with a one-line reason. A common production design combines both: rules for clear cases, the model for the rest, and a fallback to `OTHER` (or a human queue) when the model fails.

## Common Mistakes and Troubleshooting

- **Acting on raw model text.** Never pass model output straight into SQL, a shell command, an e-mail to a customer or a payment. Parse, validate and authorize first.
- **Asserting exact sentences in tests.** Tests become flaky. Assert types, allowed values and properties instead.
- **Ignoring latency.** A synchronous model call inside a database transaction or a tight loop holds resources for seconds.
- **Assuming model upgrades are harmless.** A new model version can change formatting or behaviour; pin the model name and re-run your evaluation before upgrading.

## Production Considerations

- Budget latency and cost per request; cache or skip the model when rules suffice.
- Keep a fallback path (rules, a default answer or a human) for timeouts and outages.
- Log enough to debug (model, token counts, latency, outcome) without logging sensitive prompt contents by default.

## Common Interview Traps

- **"With temperature 0 the model is deterministic."** Lower temperature reduces variety but providers do not guarantee identical output across calls or model versions.
- **"The model validated the data, so it is safe."** A model can produce well-formed but wrong values; validation is your code's job.
- **"LLMs replace business logic."** They complement it; rules that must be exact stay in code.

## Key Takeaways

- LLM output is probabilistic, slow and paid per token; Java code is deterministic, fast and cheap.
- Wrap the model in deterministic input checks, output parsing and validation, and business rules.
- Let the model suggest; let your code decide and act.

## Official References

- [AI concepts (models, prompts, tokens)](https://docs.spring.io/spring-ai/reference/concepts.html)
- [Structured output](https://docs.spring.io/spring-ai/reference/api/structured-output.html)
