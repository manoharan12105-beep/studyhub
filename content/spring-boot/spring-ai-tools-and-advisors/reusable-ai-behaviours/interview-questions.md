# Reusable AI Behaviours: Shared Builders, Customizers and Advisors — Interview Questions

## Beginner

### Q1. How do you make sure every `ChatClient` in a Spring Boot application gets the same guardrail?

**Style:** How

<details>
<summary>Answer</summary>

Declare a `ChatClientBuilderCustomizer` bean that adds the guardrail advisor. Every auto-configured (prototype) `ChatClient.Builder` injected into a service passes through all customizers, so each client built from it has the guardrail.

</details>

### Q2. What does `SafeGuardAdvisor` do?

**Style:** Direct

<details>
<summary>Answer</summary>

It checks the prompt for configured sensitive words; on a match it returns the configured failure response without calling the model. It is a simple keyword filter — a first line of defence, not content moderation.

</details>

## Intermediate

### Q3. A base builder has `defaultSystem("Never ask for passwords.")`. A feature clones it and calls `defaultSystem("You write quiz questions.")`. What system message does the feature send?

**Style:** Behavior

<details>
<summary>Answer</summary>

Only "You write quiz questions." — `defaultSystem` replaces the inherited text. Advisors added with `defaultAdvisors` accumulate, so mandatory rules are safer in an advisor that augments the system message.

</details>

### Q4. When would you write a reusable advisor instead of using a customizer?

**Style:** Compare

<details>
<summary>Answer</summary>

A customizer decides *which* configuration every builder gets; an advisor holds *logic* that runs per call (tagging, token budgets, redaction, input limits). Often both: the customizer registers the shared advisor on every builder.

</details>

## Advanced

### Q5. Design the shared AI platform layer for ten feature teams.

**Style:** Design

<details>
<summary>Answer</summary>

A small internal library with: a `ChatClientBuilderCustomizer` registering outermost guardrails (input limits, `SafeGuardAdvisor` with configurable words), a feature-tag/usage advisor, and observability conventions; a rule-appending advisor so mandatory instructions survive feature `defaultSystem` overrides; documented advisor order constants; fake-model test utilities. Feature teams inject `ChatClient.Builder`, add their own persona, tools and memory, and must not build clients with `ChatClient.create`. Changes to the shared layer go through tests and a changelog, because they affect every feature.

</details>
