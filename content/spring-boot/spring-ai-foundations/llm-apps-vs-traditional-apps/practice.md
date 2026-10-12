# Traditional Applications vs LLM-Powered Applications — Practice

### P1. Where does it belong?

**Difficulty:** Easy · **Type:** MCQ

Which task should stay in deterministic Java code rather than be delegated to a model?

- A) Summarising a long customer e-mail
- B) Deciding whether the logged-in user may view an invoice
- C) Suggesting a polite reply to a complaint
- D) Detecting the language of a message

<details>
<summary>Answer</summary>

**Answer:** B) Deciding whether the logged-in user may view an invoice

**Explanation:** Authorization must be exact and auditable; it belongs in code (for example Spring Security rules), never in a prompt.

</details>

### P2. Temperature and determinism

**Difficulty:** Easy · **Type:** MCQ

You set temperature to 0. Which statement is true?

- A) Every call now returns byte-for-byte identical text forever
- B) Output becomes less varied, but identical results across calls and model versions are not guaranteed
- C) The model stops hallucinating
- D) The call becomes free

<details>
<summary>Answer</summary>

**Answer:** B) Output becomes less varied, but identical results across calls and model versions are not guaranteed

</details>

### P3. Spot the risk

**Difficulty:** Medium · **Type:** Code analysis

```java
// Illustrative fragment
String sql = chatClient.prompt()
        .user("Write a SQL query that finds orders for: " + userText)
        .call()
        .content();
jdbcTemplate.queryForList(sql);
```

List two problems with this code.

<details>
<summary>Answer</summary>

1. Model output is executed directly as SQL, so a wrong or manipulated reply can read or modify any data (the user text can steer the model — prompt injection).
2. There is no validation, no allow-list of queries and no authorization; nothing checks that the result only touches the user's own orders. Use a fixed, parameterised query and let the model at most extract parameters that you validate.

</details>

### P4. Combine rules and a model

**Difficulty:** Medium · **Type:** Design

Design a ticket classifier that is cheap for obvious tickets and smart for unclear ones. Describe the flow in four steps.

<details>
<summary>Answer</summary>

1. Run keyword rules; if exactly one category matches strongly, return it without calling the model.
2. Otherwise call the model with `.entity(TicketClassification.class)` and an enum of allowed categories.
3. Validate the result; on parse failure, timeout or an invalid value, fall back to `OTHER` (or a human queue).
4. Record which path was used and the outcome so you can measure accuracy and cost over time.

</details>

### P5. Testing strategy

**Difficulty:** Medium · **Type:** Conceptual

Why is `assertEquals("Your ticket is about billing.", reply)` a poor test for an LLM-backed method, and what should you assert instead?

<details>
<summary>Answer</summary>

The wording can change on every call or model update, so the test is flaky and does not test your code. Use a scripted model to make the unit test deterministic and assert your logic (the parsed category, the fallback on bad output); evaluate real-model quality separately on a labelled dataset by measuring how often the category is correct.

</details>
