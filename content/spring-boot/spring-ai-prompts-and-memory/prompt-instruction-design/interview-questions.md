# Instruction Design and Context Management — Interview Questions

## Beginner

### Q1. What should a good system instruction contain?

**Style:** Direct

<details>
<summary>Answer</summary>

The assistant's role and audience, the task, constraints (length, style, scope), a rule for what to do when it cannot answer ("say you don't know"), and the output format. Specific, positive wording works better than vague or negative wording.

</details>

### Q2. Why separate instructions from data with delimiters?

**Style:** Why

<details>
<summary>Answer</summary>

So the model can tell what to do from what to work on. User input and documents placed inside markers, with a statement that they are data, reduce confusion and make it harder for text inside the data to be taken as an instruction (prompt injection). It is a mitigation, not a guarantee.

</details>

## Intermediate

### Q3. How do you decide what context to send with a request?

**Style:** How

<details>
<summary>Answer</summary>

Send the minimum sufficient context: the most relevant retrieved snippets (by similarity score), the last few conversation turns or a summary, and only the user data the task needs. Budget tokens per slot (instructions, history, documents, question, answer) and drop or summarise the lowest-value items first.

</details>

### Q4. Why can adding more context make answers worse?

**Style:** Why

<details>
<summary>Answer</summary>

Irrelevant or contradictory text distracts the model, important facts can be overlooked in the middle of a long context, and the model may mix in unrelated details. More context also increases cost and latency and can push the request against the context-window limit.

</details>

### Q5. How do you reduce hallucinations through instructions alone?

**Style:** How

<details>
<summary>Answer</summary>

Tell the model to answer only from the supplied context, give it an explicit way out ("If the context does not contain the answer, say you don't know"), ask it to cite which part of the context it used, and lower the temperature. These help, but grounding with real data and validating outputs are still needed.

</details>

## Advanced

### Q6. How do you manage prompt changes safely in a team?

**Style:** Design

<details>
<summary>Answer</summary>

Keep prompts in versioned files reviewed through pull requests; render them in unit tests; run an evaluation dataset comparing the current and new version before switching; select the active version by configuration so you can roll back; and log the prompt version with each response to trace regressions.

</details>
