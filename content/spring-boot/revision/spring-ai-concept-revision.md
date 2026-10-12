# 30-Minute Spring AI Concept Revision

A timed path through the ideas behind the APIs: what each mechanism is for, and when to choose it.

## Minutes 0–6: How LLM Applications Work

- An LLM predicts tokens from the prompt. It is stateless between calls and probabilistic.
- Everything the model knows about this request is in the messages: system, user, assistant and tool.
- Cost and latency grow with the input and output tokens of every call.
- Spring AI gives portable APIs. Quality, limits and features stay provider-specific.

## Minutes 6–12: Getting Reliable Output

- Write clear instructions and a role in the system prompt, and use examples (few-shot) for format.
- Structured output turns JSON into Java objects. Validation in code makes them trustworthy.
- Lower temperature reduces variance; it does not guarantee correctness.
- Deterministic first: code handles calculations, rules and lookups, and the model handles language.

## Minutes 12–18: Knowledge Mechanisms

| Need | Mechanism |
|------|-----------|
| Continue the conversation | Chat memory (by conversation id) |
| Answer from documents, with sources | RAG (embeddings + vector store + augmentation) |
| Live data or actions | Tools (the model requests; your code runs) |
| Style or behaviour change | Fine-tuning, which is rarely the first choice |

- RAG failures are mostly retrieval failures: chunking, threshold, filters or embedding mismatch.
- Grounding means answering only from the context and citing verified sources.

## Minutes 18–24: Control Flow

- Advisors form a chain. Their order decides whether they run once per request or once per model call in the tool loop.
- Tool calling is a loop: the model requests, the app executes, the result goes back, until a text answer.
- Workflows (code decides the steps) beat agents (the model decides) whenever the steps are known.
- Human approval separates requesting an action from executing it.

## Minutes 24–30: Running It in Production

- Plan for provider failure: timeouts, one retry layer, fallbacks and circuit breakers.
- Measure: observations, the token usage metric, and cost per feature.
- Test with stub models; evaluate with real models on a fixed set before every change.
- Security: least-privilege tools, identity outside the prompt, validated output, no secrets in prompts, and rate limits.
- MCP shares tools across applications over a network. Authenticate it and trust only known servers.
