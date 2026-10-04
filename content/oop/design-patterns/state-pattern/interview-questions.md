# State — Interview Questions

## Conceptual

### Q1. What is the State pattern?

<details>
<summary>Answer</summary>

A behavioral pattern that lets an object change its behaviour when its internal state changes. Each state is a class implementing a common interface; the context holds the current state object and delegates operations to it, and state objects switch the context to the next state. It replaces repeated `switch (status)` blocks in every method.

</details>

### Q2. State vs Strategy?

<details>
<summary>Answer</summary>

Same structure — a context delegating to an interface. In Strategy, the client usually chooses the algorithm and it stays fixed for a while; strategies are independent and unaware of each other. In State, the state objects drive transitions themselves as the context's lifecycle progresses, and each state knows which states can follow. Strategy answers "how should this be done?"; State answers "what does this object do in its current situation?".

</details>

### Q3. When would you use an enum instead of State classes?

<details>
<summary>Answer</summary>

When states mostly need validation of allowed transitions and carry little behaviour — an enum with a `canMoveTo(next)` method or a transition map is shorter and keeps the whole state machine visible. Move to State classes when each state has substantial, distinct behaviour across several operations.

</details>

### Q4. How do you prevent invalid transitions?

<details>
<summary>Answer</summary>

Let only state objects change the context's state (no public setter used by clients), give every state a default "not allowed in this state" behaviour (throwing `IllegalStateException`), and implement only valid operations in each concrete state. Unit tests per state verify allowed and rejected operations.

</details>

## Applied

### Q5. Design the states of an ATM session.

<details>
<summary>Answer</summary>

States: `Idle` (insert card → `CardInserted`), `CardInserted` (enter PIN → `Authenticated` if correct; after three failures → `CardRetained`; eject → `Idle`), `Authenticated` (withdraw, balance, eject → `Idle`), `Dispensing` (completes → `Authenticated`), `CardRetained`/`OutOfService`. The `Atm` context delegates `insertCard`, `enterPin`, `withdraw`, `eject` to the current state; invalid actions (withdraw while `Idle`) are rejected by the state's default behaviour.

</details>
