# LLMs, Tokens, Context Windows, Temperature and Hallucinations — Interview Questions

## Beginner

### Q1. What is a token, and why do developers care about tokens?

**Style:** Direct

<details>
<summary>Answer</summary>

A token is the unit of text a model reads and writes — a word, part of a word or punctuation, produced by the model's tokenizer. Developers care because providers bill per input and output token, context windows and output limits are measured in tokens, and generation time grows with output tokens. English averages roughly four characters per token; code, JSON and many non-English scripts use more tokens per character.

</details>

### Q2. What is a context window?

**Style:** Direct

<details>
<summary>Answer</summary>

The maximum number of tokens a model can process in one request, counting the input (system message, history, retrieved documents, question) and the generated output together. Exceeding it causes an error or a truncated reply, so applications limit history and retrieved context.

</details>

### Q3. What does temperature control?

**Style:** Direct

<details>
<summary>Answer</summary>

The randomness of sampling. Low temperature makes the model pick the most likely tokens, giving focused and more repeatable output (good for extraction, classification and structured output). High temperature spreads probability over more tokens, giving more varied output (useful for brainstorming). It does not make answers more accurate.

</details>

## Intermediate

### Q4. What is a hallucination and why does it happen?

**Style:** Why

<details>
<summary>Answer</summary>

Confident output that is false or unsupported. The model is trained to generate plausible continuations, not to check facts, and it lacks your private data and recent events. When the prompt does not contain the needed facts, a plausible-sounding guess is often the most likely text.

</details>

### Q5. How would you reduce hallucinations in a Spring AI service?

**Style:** How

<details>
<summary>Answer</summary>

Ground answers with retrieval (RAG) and instruct the model to answer only from the context and say when it does not know; fetch live data through tools; lower the temperature for factual tasks; request structured output and validate values; show sources to users; and measure the hallucination rate on an evaluation dataset so changes are tested. These reduce and expose hallucinations; none removes them completely.

</details>

### Q6. A reply ends mid-sentence. What do you check?

**Style:** Debugging

<details>
<summary>Answer</summary>

The finish reason in the response metadata: `length` (or the provider's equivalent) means the output-token limit was reached. Raise `maxTokens` (or the provider's completion-token field) within budget, shorten the prompt so the window has room, or ask for a more concise answer. Also check streaming clients did not close early.

</details>

## Advanced

### Q7. Why can the same text cost a different number of tokens with two providers?

**Style:** Why

<details>
<summary>Answer</summary>

Each model family uses its own tokenizer (vocabulary and splitting rules), and providers add their own per-message formatting tokens. Spring AI's `JTokkitTokenCountEstimator` approximates OpenAI-style encodings; the authoritative count is the usage reported in the provider's response.

</details>

### Q8. Is a model with a 1-million-token window a reason to stop doing retrieval?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Not usually. Sending everything costs more on every request, increases latency, and models can miss facts in very long contexts. Retrieval sends a few relevant chunks, which is cheaper, faster and easier to cite. Large windows help for one-off analysis of a long document or when retrieval would split connected information.

</details>
