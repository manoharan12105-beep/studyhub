# Circuit Breakers, Bulkheads and Fallbacks — Practice

### P1. Breaker state

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** circuit breaker states

In which state does a circuit breaker reject calls immediately without contacting the dependency?

- A) Closed
- B) Open
- C) Half-open
- D) All states

<details>
<summary>Answer</summary>

**Answer:** B) Open

</details>

### P2. Trace the breaker

**Difficulty:** Medium · **Type:** Output · **Concepts:** state transitions

Threshold 2 consecutive failures, cool-down 10 s, one trial in half-open. Calls at t = 0 (fail), 1 (fail), 5, 12 (fail), 15, 23 (success). What happens at each call?

<details>
<summary>Answer</summary>

t=0 failure 1; t=1 failure 2 → opens (at 1). t=5 rejected (open until 11). t=12 half-open trial fails → reopens (until 22). t=15 rejected. t=23 half-open trial succeeds → closed.

</details>

### P3. Bulkhead sizing

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** bulkheads

A service has a 200-thread pool shared by calls to payments (critical) and recommendations (optional). Recommendations hangs. Propose a bulkhead layout.

<details>
<summary>Answer</summary>

Separate pools or semaphores: for example payments 120 threads, recommendations at most 30 concurrent calls with a short timeout, the rest for other work. When recommendations hangs, at most 30 threads are blocked (and its circuit breaker soon opens), while payments keeps its capacity.

</details>

### P4. Pick a fallback

**Difficulty:** Medium · **Type:** Design · **Concepts:** fallbacks

Give a safe fallback for: (a) "people you may know" is down, (b) the currency-conversion service is down on a product page, (c) the avatar image service is down.

<details>
<summary>Answer</summary>

(a) Hide the widget or show cached suggestions. (b) Show prices in the base currency (or cached rates with a note), and recompute at checkout. (c) Show a default avatar placeholder.

</details>
