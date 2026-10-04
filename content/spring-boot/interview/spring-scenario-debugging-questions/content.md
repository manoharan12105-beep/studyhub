# Spring Boot Scenario and Debugging Questions

**Module:** Interview Preparation · **Interview priority:** Frequently asked

## Definition

Scenario and debugging questions describe a **symptom or a business situation** and ask how you would diagnose or design a solution — "the app is slow after deployment", "orders are duplicated", "users see each other's data". They complement the structured walkthroughs in the [Debugging](../../debugging/debugging-beans-and-injection/content.md) subcategory with new situations.

## Why It Matters

Interviewers use them to see your **process**: forming hypotheses, using the right tools (logs, metrics, `EXPLAIN`, Actuator, TRACE logging), fixing root causes and preventing recurrence.

## How to Answer

1. **Clarify** the symptom (always/intermittent, since when, which endpoints, error code).
2. **List hypotheses** in order of likelihood.
3. **Name the evidence** that would confirm each (logs, metrics, traces, queries).
4. **Fix** the root cause, not the symptom.
5. **Prevent**: test, alert or guardrail.

## Key Takeaways

- Symptom → hypotheses → evidence → fix → prevention.
- Mention concrete tools; vague answers ("I'd check the logs") score poorly.
