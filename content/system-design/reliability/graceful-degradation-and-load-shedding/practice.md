# Graceful Degradation and Load Shedding — Practice

### P1. Degrade first

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** feature priority

During an overload on a food-delivery app, which feature should be turned off first?

- A) Placing orders
- B) Payment
- C) "Restaurants your friends liked" recommendations
- D) Order tracking

<details>
<summary>Answer</summary>

**Answer:** C) "Restaurants your friends liked" recommendations

</details>

### P2. Status code

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** shedding responses

What should an instance return when it sheds a request because it is at its concurrency limit, and what should clients do?

<details>
<summary>Answer</summary>

503 Service Unavailable (or 429 if it is per-client rate limiting), ideally with `Retry-After`. Clients should retry later with exponential backoff and jitter, not immediately.

</details>

### P3. Design degradation

**Difficulty:** Medium · **Type:** Design · **Concepts:** graceful degradation

A news site's comment service is down. List three graceful-degradation behaviours for article pages.

<details>
<summary>Answer</summary>

Render the article without the comments section (or with "comments temporarily unavailable"); show the cached comment count or last cached comments read-only; accept new comments into a queue for later posting, or disable the comment form. The article itself — the core — keeps working.

</details>
