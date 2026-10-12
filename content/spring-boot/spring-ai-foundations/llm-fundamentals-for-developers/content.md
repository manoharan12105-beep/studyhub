# LLMs, Tokens, Context Windows, Temperature and Hallucinations

**Module:** Spring AI: Foundations · **Interview priority:** Core · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Explain what a large language model does when it "answers" a prompt.
- Count tokens, estimate their cost and explain why the context window limits a request.
- Choose temperature and output-length settings for a task.
- Explain hallucinations and list engineering techniques that reduce their impact.

## Definition

A **large language model (LLM)** is a neural network trained on large amounts of text to predict the next **token** — a chunk of text such as a word, part of a word or punctuation. Given a prompt, it generates a reply one token at a time, each time choosing a likely next token. Everything an application controls about this — how much text fits, how random the choice is, how long the reply may be — is expressed in tokens and sampling settings.

## Why It Matters

Tokens are the unit of **cost** (providers bill per input and output token), **limits** (the context window and maximum output length) and **latency** (generation time grows with output tokens). Temperature and hallucinations decide how far you can trust and test the output. Every later topic — memory, RAG, budgets, structured output — builds on these four ideas.

## How It Works

```text
prompt text ──► tokenizer ──► [token ids] ──► model predicts next-token probabilities
                                                    │
                    sampling (temperature, top-p) ──┘──► chosen token ──► appended ──► repeat
                                                                                         until a stop token,
                                                                                         a stop sequence or
                                                                                         the max-token limit
```

1. The **tokenizer** turns text into token ids. Different model families use different tokenizers, so the same text has different token counts across providers.
2. The model computes a probability for every possible next token, based on **all tokens in the context** (system instructions, history, retrieved documents, the question and the reply so far).
3. A **sampling** step picks one token. **Temperature** reshapes the probabilities: low values favour the most likely token, high values spread choices out.
4. Generation stops at an end-of-text token, a configured **stop sequence**, or the **maximum output tokens** limit. The provider reports the **finish reason** (for example `stop` or `length`).

## Tokens

Rules of thumb for English text: one token is roughly four characters, or about three quarters of a word. Code, unusual words and many non-English scripts use more tokens per character. Spring AI ships a token **estimator** (`JTokkitTokenCountEstimator`, based on the open-source JTokkit tokenizer) that it uses internally, for example to batch documents for embedding. It is an estimate: the provider's own tokenizer and message formatting decide the billed count, which you read from the response metadata ([Response Extraction](../../spring-ai-chat-client/spring-ai-responses-and-errors/content.md)).

## Context Window

The **context window** is the maximum number of tokens the model can consider in one request — **input and output together**. Everything competes for it:

```text
┌──────────────────────────── context window ─────────────────────────────┐
│ system instructions │ chat history │ retrieved documents │ question │ reply │
└──────────────────────────────────────────────────────────────────────────┘
```

When the request is too large the provider rejects it, or the reply is cut short. Your application must decide what to keep: a window of recent messages ([Long Conversations](../../spring-ai-prompts-and-memory/long-conversation-management/content.md)), the top few retrieved chunks ([Retrieval Quality](../../spring-ai-rag/retrieval-quality/content.md)), and a sensible output limit. A bigger window is not free: more input tokens cost more and add latency, and models can overlook facts buried in the middle of a very long context.

## Temperature and Other Sampling Settings

| Setting | Effect | Typical use |
|---------|--------|-------------|
| `temperature` | Low (≈0–0.3) = focused and repeatable; high (≈0.8+) = varied and creative | Low for extraction, classification, query rewriting; higher for brainstorming |
| `topP` | Samples only from the smallest set of tokens whose probabilities add up to *p* | Usually tune temperature **or** top-p, not both |
| `maxTokens` (or the provider's completion-token limit) | Caps the length of the reply | Protects cost and latency; too low truncates answers |
| `stopSequences` | Stops generation when a string appears | Cutting off at a delimiter |

In Spring AI these are portable fields of `ChatOptions` (`temperature`, `topP`, `topK`, `maxTokens`, `stopSequences`, `frequencyPenalty`, `presencePenalty`). Not every model accepts every option — some reasoning models reject `temperature` or use a different output-limit field — so check the provider page. When you set nothing, Spring AI 2.0 sends no temperature and the provider default applies.

## Hallucinations

A **hallucination** is fluent, confident output that is false or unsupported — an invented API, a wrong date, a citation that does not exist. It happens because the model generates *plausible* text, not *verified* text, and it has no built-in knowledge of your private data or of events after its training cut-off.

Engineering techniques that reduce the impact:

| Technique | How it helps | Topic |
|-----------|--------------|-------|
| Ground the answer in retrieved documents (RAG) | The model answers from supplied facts | [RAG Architecture](../../spring-ai-rag/rag-architecture/content.md) |
| Instruct "say you don't know" and allow refusals | Gives the model a safe alternative to guessing | [Grounding and Citations](../../spring-ai-rag/rag-grounding-and-citations/content.md) |
| Let the model call tools for live data | Facts come from your system, not memory | [Tool Calling](../../spring-ai-tools-and-advisors/tool-calling-fundamentals/content.md) |
| Validate structured output | Catches impossible values | [Validating AI Output](../../spring-ai-chat-client/ai-output-validation/content.md) |
| Evaluate on a labelled dataset | Measures how often answers are wrong | [Evaluation and Regression](../../spring-ai-production/ai-evaluation-and-regression/content.md) |

None of these makes hallucination impossible; they make it rarer and detectable.

## Example

Count tokens locally with the estimator that Spring AI already depends on. Run it inside the [Practice Lab](../spring-ai-practice-lab/content.md) project (or any project with a Spring AI starter).

```java
import java.util.List;

import com.knuddels.jtokkit.api.EncodingType;
import org.springframework.ai.tokenizer.JTokkitTokenCountEstimator;
import org.springframework.ai.tokenizer.TokenCountEstimator;

public class TokenCounter {

    public static void main(String[] args) {
        TokenCountEstimator cl100k = new JTokkitTokenCountEstimator();
        TokenCountEstimator o200k = new JTokkitTokenCountEstimator(EncodingType.O200K_BASE);

        List<String> samples = List.of(
                "Spring",
                "Spring Boot auto-configuration",
                "ChatClient.prompt().user(question).call().content()",
                "{\"student\":\"Priya\",\"score\":92}",
                "The quick brown fox jumps over the lazy dog.");

        for (String text : samples) {
            System.out.printf("%-55s chars=%3d  cl100k=%3d  o200k=%3d%n",
                    text, text.length(), cl100k.estimate(text), o200k.estimate(text));
        }

        String page = "Java is a programming language. ".repeat(250);
        int tokens = cl100k.estimate(page);
        System.out.println("A " + page.length() + "-character page is about " + tokens + " tokens.");
    }
}
```

**Output:**

```text
Spring                                                  chars=  6  cl100k=  1  o200k=  1
Spring Boot auto-configuration                          chars= 30  cl100k=  5  o200k=  5
ChatClient.prompt().user(question).call().content()     chars= 51  cl100k= 11  o200k= 11
{"student":"Priya","score":92}                          chars= 30  cl100k= 10  o200k= 10
The quick brown fox jumps over the lazy dog.            chars= 44  cl100k= 10  o200k= 10
A 8000-character page is about 1501 tokens.
```

### Code walkthrough

- `JTokkitTokenCountEstimator()` uses the `CL100K_BASE` encoding by default; `O200K_BASE` is the encoding used by newer OpenAI model families. Counts agree here, but they differ for other text (non-English text in particular often needs noticeably fewer tokens with `O200K_BASE`).
- Code and JSON are token-dense: punctuation and identifiers split into many tokens, which is why structured prompts and verbose tool results add up quickly.
- The page line shows the ratio in practice: 8,000 characters ≈ 1,500 tokens, about 5.3 characters per token for this very repetitive English text. Real prose is usually closer to four characters per token.

## Common Mistakes and Troubleshooting

- **Estimating cost from characters or words alone.** Use token counts from the response metadata for billing decisions; local estimates are for planning.
- **Forgetting that the reply uses the window too.** A prompt that fills the window leaves no room for the answer; the response is cut off with a `length` finish reason.
- **Raising temperature to "make it smarter".** Higher temperature adds variety, not accuracy. Use low temperature for factual and structured tasks.
- **Setting options the model rejects.** Some models refuse `temperature` or require a different output-limit field; the provider returns a 400 error. Read the provider's model notes.
- **Believing a confident tone.** Confidence in wording says nothing about correctness; verify facts that matter.

## Production Considerations

- Put a ceiling on output tokens for every endpoint and a budget per user or tenant ([Token Usage and Cost](../../spring-ai-production/token-usage-and-cost-control/content.md)).
- Trim history and retrieved context deliberately instead of sending everything.
- Record finish reasons: a rising share of `length` endings means your limits are too tight or prompts too big.

## Common Interview Traps

- **"The context window is the maximum answer length."** It covers input plus output; the output limit is a separate, smaller setting.
- **"One token is one word."** It is roughly ¾ of an English word on average and varies by tokenizer and language.
- **"RAG eliminates hallucinations."** It reduces them by grounding; the model can still misread or ignore the context.

## Key Takeaways

- An LLM generates text token by token by sampling likely continuations.
- Tokens drive cost, limits and latency; the context window holds input and output together.
- Temperature controls variety, not truth.
- Hallucinations are reduced with grounding, tools, validation and evaluation — never assumed away.

## Official References

- [AI concepts: models, prompts, tokens, embeddings](https://docs.spring.io/spring-ai/reference/concepts.html)
- [Chat model API and options](https://docs.spring.io/spring-ai/reference/api/chatmodel.html)
- [OpenAI chat properties (temperature, max tokens)](https://docs.spring.io/spring-ai/reference/api/chat/openai-chat.html)
