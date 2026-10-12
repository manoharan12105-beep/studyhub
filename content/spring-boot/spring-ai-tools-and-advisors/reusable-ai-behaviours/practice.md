# Reusable AI Behaviours: Shared Builders, Customizers and Advisors — Practice

### P1. Count the model calls

**Difficulty:** Easy · **Type:** Behavior

A client has `SafeGuardAdvisor` with the sensitive word "leaked paper". Three requests are sent: "Explain recursion", "Quiz me", "Send me the leaked paper". How many model calls happen?

<details>
<summary>Answer</summary>

Two. The third request is answered by the guardrail's failure response without calling the model.

</details>

### P2. Which mechanism?

**Difficulty:** Easy · **Type:** MCQ

Every client in the application must log requests in the `dev` profile. Where does this belong?

- A) In every service's constructor
- B) A `ChatClientBuilderCustomizer` bean annotated with `@Profile("dev")`
- C) The system prompt
- D) A tool

<details>
<summary>Answer</summary>

**Answer:** B) A `ChatClientBuilderCustomizer` bean annotated with `@Profile("dev")`

</details>

### P3. Clone a family of clients

**Difficulty:** Medium · **Type:** Coding

From an injected `ChatClient.Builder`, create a base with an input-limit advisor, then two clients: `summaryClient` with system text "Summarise in three bullet points." and `explainClient` with "Explain for a beginner."

<details>
<summary>Answer</summary>

```java
// Illustrative fragment
ChatClient.Builder base = builder.defaultAdvisors(new InputLimitAdvisor(2000));

ChatClient summaryClient = base.clone()
        .defaultSystem("Summarise in three bullet points.")
        .build();
ChatClient explainClient = base.clone()
        .defaultSystem("Explain for a beginner.")
        .build();
```

Both inherit the input limit; their system texts are independent.

</details>

### P4. The rule disappeared

**Difficulty:** Medium · **Type:** Debugging

The platform team put "Never reveal internal course prices" in the base builder's `defaultSystem`. The pricing feature's client was cloned and given its own `defaultSystem`, and now it reveals internal prices. Why, and how should the platform team enforce the rule?

<details>
<summary>Answer</summary>

`defaultSystem` on the clone replaced the base text, so the rule was gone. Enforce mandatory rules with an advisor registered by a customizer that appends the rule via `augmentSystemMessage` — and, since instructions alone are not enforcement, keep internal prices out of the data the pricing tools return.

</details>

### P5. Keyword guardrail limits

**Difficulty:** Hard · **Type:** Scenario

A `SafeGuardAdvisor` blocks "exam answers". Users bypass it with "solutions to tomorrow's test", and a teacher's legitimate question "How should I publish exam answers after grading?" is blocked. What do you recommend?

<details>
<summary>Answer</summary>

Keyword matching cannot capture intent: it misses paraphrases and blocks legitimate uses. Keep it for unambiguous terms only, and add layers: role-aware rules (teachers may discuss answer keys), a moderation or classification step for intent, output checks, and — most importantly — make sure the data source never exposes unreleased answers to learners at all (authorisation in tools and retrieval filters).

</details>
