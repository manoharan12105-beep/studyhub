# Spring Boot Tricky and Behavior Questions

**Module:** Interview Preparation · **Interview priority:** Frequently asked

## Definition

Tricky questions test **precise behaviour** where intuition is often wrong: "Does this method run in a transaction?", "How many SQL statements?", "Which bean is injected?", "What status does the client get?". Many answers here were verified by the runnable demos in the lessons (linked in each answer).

## Why It Matters

They separate memorised definitions from real understanding and are common in product-company interviews and online assessments (output/behavior MCQs).

## How to Answer

- Identify the **mechanism** involved (proxy, persistence context, filter chain, binding rules).
- Reason step by step; state assumptions (default configuration, Spring Boot defaults).
- Give the **fix** if the behaviour is a bug.

## Key Takeaways

- Most "surprises" come from proxies, persistence-context state, defaults and ordering rules.
- Precise wording matters: "joins the transaction", "marks rollback-only", "backs off", "is detached".
