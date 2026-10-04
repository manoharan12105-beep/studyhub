# "Why?" Questions in OOP

## Definition

"Why?" questions test understanding instead of recall: *Why does Java not allow multiple class inheritance? Why must `equals` and `hashCode` agree? Why prefer constructor injection?* A good answer explains the **problem the rule prevents** or the **benefit the practice brings**, ideally with a concrete failure that would happen otherwise.

## Why It Matters

- Interviewers often follow every definition with "why?". Candidates who memorised rules stop there; candidates who understand them continue with reasons and consequences.
- Reasons connect topics: the answer to "why composition?" draws on encapsulation, coupling, LSP and testability.

## How to Answer a "Why?" Question

1. **State the rule or practice** in one sentence.
2. **Describe what would go wrong without it** — a concrete scenario.
3. **Name the principle** that generalises the reason (encapsulation, substitutability, loose coupling, single responsibility).
4. **Mention the trade-off or exception** if one exists.

Example: *"Why are immutable objects useful?"* → "Their state cannot change after construction. Without that, an object shared between threads or used as a `HashMap` key can change under you — a race or a lost entry. Immutability gives thread safety and hash-safety for free. The cost is allocating new objects for changes."

## Key Takeaways

- Rule → failure without it → principle → trade-off.
- Concrete failures (lost `HashMap` entries, half-built objects, broken substitution) are the most convincing reasons.
