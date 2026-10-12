# Few-Shot Prompting and Output Formats — Interview Questions

## Beginner

### Q1. What is few-shot prompting?

**Style:** Direct

<details>
<summary>Answer</summary>

Showing the model a few example inputs with the desired outputs before the real input, so it imitates the pattern — labels, format, tone or level of detail. Zero-shot uses only instructions; one-shot uses one example.

</details>

### Q2. How do you pass few-shot examples with `ChatClient`?

**Style:** How

<details>
<summary>Answer</summary>

As message pairs: each example input as a `UserMessage` and its expected output as an `AssistantMessage`, added with `.messages(...)` (or `defaultMessages`-style constants in your service), followed by the real `.user(...)` input. The system message states the task and format.

</details>

## Intermediate

### Q3. Few-shot examples or structured output — how do you choose?

**Style:** Comparison

<details>
<summary>Answer</summary>

For output that code parses, structured output (records, enums, `validateSchema()`) is more reliable and cheaper. Few-shot examples help when the *judgement* is hard to describe — ambiguous labels, a particular style, edge cases. They combine well: an enum-typed record plus two or three examples of tricky cases.

</details>

### Q4. What are common pitfalls with few-shot examples?

**Style:** Direct

<details>
<summary>Answer</summary>

Unbalanced labels (the model over-predicts the frequent one), examples that contradict instructions, examples copied into answers, too many examples inflating every request's cost, stale examples after policies change, and real user data leaking into prompts.

</details>

## Advanced

### Q5. You need 200 labelled examples to cover all edge cases. What do you do instead of putting all of them in the prompt?

**Style:** Design

<details>
<summary>Answer</summary>

Embed the examples into a vector store and, per request, retrieve the few most similar ones to the input (dynamic few-shot), keeping the prompt small. If the behaviour must be consistent at scale and examples keep growing, evaluate fine-tuning a smaller model — but only after measuring that prompt-based approaches are insufficient.

</details>
