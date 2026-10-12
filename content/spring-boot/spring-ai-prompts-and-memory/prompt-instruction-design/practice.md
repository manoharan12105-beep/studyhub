# Instruction Design and Context Management — Practice

### P1. Better wording

**Difficulty:** Easy · **Type:** MCQ

Which instruction is most likely to produce consistent short answers?

- A) "Don't be too long."
- B) "Answer in at most 3 sentences."
- C) "Be brief if possible, but complete."
- D) "Use your judgement about length."

<details>
<summary>Answer</summary>

**Answer:** B) "Answer in at most 3 sentences."

**Explanation:** Specific, positive limits are followed more reliably than vague or negative ones.

</details>

### P2. The missing part

**Difficulty:** Easy · **Type:** MCQ

A tutor prompt says: "You are a Java tutor. Explain the topic in 4 sentences with an example." Which important part is missing?

- A) A role
- B) A length limit
- C) A rule for questions it cannot answer or that are out of scope
- D) A task

<details>
<summary>Answer</summary>

**Answer:** C) A rule for questions it cannot answer or that are out of scope

</details>

### P3. Rewrite the prompt

**Difficulty:** Medium · **Type:** Coding

Rewrite this system prompt using the five-part structure:

```text
Help users with our product. Be nice. Answer everything.
```

The product is "StudyHub", a study platform; answers must use only the provided help-centre articles.

<details>
<summary>Answer</summary>

```text
You are the StudyHub help assistant for learners using the StudyHub study platform.
Answer questions about using StudyHub (navigation, progress, notes, study plans).
Use only the help-centre articles between <<< and >>>. Keep answers under 120 words and polite.
If the articles do not answer the question, or it is not about StudyHub, say so and suggest contacting support.
Answer with short steps when the user asks how to do something.
```

</details>

### P4. Budget the context

**Difficulty:** Medium · **Type:** Scenario

A request may use 4,000 input tokens. The system prompt is 300 tokens, the question 100. You have 12 retrieved chunks of about 400 tokens each and 20 history messages of about 150 tokens each. Propose an allocation.

<details>
<summary>Answer</summary>

After the system prompt and question, 3,600 tokens remain. One sensible split: about 2,400 tokens for documents (the top 6 chunks by similarity) and about 1,200 tokens for history (the last 8 messages, or a short summary plus the last 4). Keep the output limit separate, and remeasure with real token counts from responses.

</details>

### P5. Diagnose inconsistent behaviour

**Difficulty:** Hard · **Type:** Debugging

Over months, a system prompt grew to 1,800 tokens of rules. Answers now ignore some rules and the bill rose. What do you do?

<details>
<summary>Answer</summary>

Audit the prompt for contradictions and duplicates; keep the essential rules (role, scope, refusal, format) and move situational rules into per-request context or separate prompts. Move enforceable rules into code (validation, structured output). Measure the change with the evaluation set before and after, and check token usage per request drops.

</details>
