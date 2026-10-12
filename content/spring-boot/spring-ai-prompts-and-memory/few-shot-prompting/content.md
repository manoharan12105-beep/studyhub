# Few-Shot Prompting and Output Formats

**Module:** Spring AI: Prompts and Conversations · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Explain zero-shot, one-shot and few-shot prompting.
- Supply examples as user/assistant message pairs with `ChatClient`.
- Choose between few-shot examples, a described format and structured output.
- Avoid the classic few-shot pitfalls: biased, leaking or stale examples.

## Definition

**Few-shot prompting** shows the model a few input → output examples before the real input, so it copies the pattern: the labels, the tone, the format, the level of detail. **Zero-shot** gives only instructions; **one-shot** gives a single example. An **output format** is the exact shape the answer must take — a label, a line pattern, Markdown sections or JSON.

## Why It Matters

Some requirements are easier to show than to describe: "classify like *this*", "summarise in *this* style", "label edge cases *this* way". A handful of examples often fixes inconsistent outputs without changing models. Examples also cost tokens on every request, so you need to know when they are worth it.

## How It Works

Examples are best given as **conversation turns**: each example input is a `UserMessage`, each expected output an `AssistantMessage`. The model sees a conversation in which "it" already answered correctly and continues the pattern.

```text
SYSTEM     Classify Java interview questions as CORE, ADVANCED or OFF_TOPIC.
           Reply exactly as: LABEL | short reason
USER       What is the difference between == and equals()?        ← example 1
ASSISTANT  CORE | basic object equality
USER       How does the G1 collector choose regions to evacuate?   ← example 2
ASSISTANT  ADVANCED | garbage-collector internals
USER       What is the best pizza topping?                         ← example 3
ASSISTANT  OFF_TOPIC | not about Java
USER       What does the volatile keyword guarantee?               ← real input
```

Guidelines:

- **Cover the label space and edge cases.** Include at least one example per label and one tricky case.
- **Keep examples short and realistic.** Use inputs like your real traffic.
- **Balance and vary order.** Models are biased toward labels they saw most or last.
- **Never use real user data** in examples; it is sent with every request.

## Few-Shot vs Format Description vs Structured Output

| Technique | Best for | Cost | Reliability |
|-----------|----------|------|-------------|
| Described format ("Reply as LABEL \| reason") | Simple patterns | Low | Medium |
| Few-shot examples | Style, judgement on edge cases, label definitions | Medium–high (tokens per request) | Medium–high |
| Structured output (`entity(...)`, enums) | Data your code processes | Low–medium | High with `validateSchema()` |
| Combination | Hard classification with typed output | Medium–high | High |

For anything parsed by code, prefer structured output with an enum and add one or two examples only when labels are ambiguous ([Structured Output](../../spring-ai-chat-client/spring-ai-structured-output/content.md)).

## Example

```java
import java.util.List;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;

public class FewShotDemo {

    enum Label { CORE, ADVANCED, OFF_TOPIC }

    record Classification(Label label, String reason) {}

    static final List<Message> EXAMPLES = List.of(
            new UserMessage("What is the difference between == and equals()?"),
            new AssistantMessage("CORE | basic object equality"),
            new UserMessage("How does the G1 collector choose regions to evacuate?"),
            new AssistantMessage("ADVANCED | garbage-collector internals"),
            new UserMessage("What is the best pizza topping?"),
            new AssistantMessage("OFF_TOPIC | not about Java"));

    static Classification classify(ChatClient client, String question) {
        String reply = client.prompt()
                .system("""
                        Classify Java interview questions as CORE, ADVANCED or OFF_TOPIC.
                        Reply exactly as: LABEL | short reason""")
                .messages(EXAMPLES)
                .user(question)
                .call()
                .content();
        String[] parts = reply.split("\\|", 2);
        try {
            return new Classification(Label.valueOf(parts[0].trim()), parts.length > 1 ? parts[1].trim() : "");
        } catch (IllegalArgumentException e) {
            return new Classification(Label.OFF_TOPIC, "unparseable reply: " + reply);
        }
    }

    public static void main(String[] args) {
        ScriptedChatModel model = new ScriptedChatModel()
                .reply("CORE | memory visibility between threads")
                .reply("Probably advanced, it is about the JIT");
        ChatClient client = ChatClient.create(model);

        System.out.println(classify(client, "What does the volatile keyword guarantee?"));
        System.out.println("messages sent: " + model.lastPrompt().getInstructions().size());
        System.out.println(classify(client, "How does escape analysis work?"));
    }
}
```

**Output:**

```text
Classification[label=CORE, reason=memory visibility between threads]
messages sent: 8
Classification[label=OFF_TOPIC, reason=unparseable reply: Probably advanced, it is about the JIT]
```

### Code walkthrough

- `EXAMPLES` holds three user/assistant pairs — one per label. The request contains the system message, six example messages and the real question: 8 messages.
- The parser accepts only the agreed `LABEL | reason` shape and maps anything else to a safe default, so a format slip never crashes the caller.
- The second reply ignored the format. With few-shot alone this still happens occasionally; for production, the same examples combined with `entity(Classification.class, spec -> spec.validateSchema())` give typed, validated results.

## Common Mistakes and Troubleshooting

- **All examples share one label.** The model over-predicts it. Balance the examples.
- **Examples contradict the instructions.** The model usually follows the examples; fix whichever is wrong.
- **Examples copied into answers.** The model repeats example content when inputs are similar; use clearly different example topics.
- **Too many examples.** Each costs tokens on every call; three to five well-chosen ones are typical. Measure before adding more.
- **Examples drift from reality.** Re-check examples when labels, policies or products change.

## Production Considerations

- Store examples with the prompt (versioned resource or code constant) and evaluate changes on a labelled dataset.
- Watch token usage: a 600-token example block sent 100,000 times a day is 60 million tokens.
- If you need dozens of examples, consider retrieving the few most similar ones per request (dynamic few-shot) using a vector store.

## Common Interview Traps

- **"Few-shot means fine-tuning."** Examples live in the prompt at request time; no model weights change ([RAG vs Memory vs Fine-Tuning](../../spring-ai-rag/rag-vs-memory-vs-fine-tuning/content.md)).
- **"More examples are always better."** Returns diminish quickly while cost grows linearly.
- **"Examples guarantee the format."** They make it likely; parsing and validation make it safe.

## Key Takeaways

- Few-shot = example input/output pairs before the real input, best sent as user/assistant messages.
- Balanced, realistic, short examples; never real user data.
- For machine-readable output, combine examples with structured output and validation.

## Official References

- [Prompt engineering patterns: few-shot](https://docs.spring.io/spring-ai/reference/api/chat/prompt-engineering-patterns.html)
- [Structured output](https://docs.spring.io/spring-ai/reference/api/structured-output.html)
