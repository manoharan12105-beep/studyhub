# Facade — Practice

### P1. Recognise it

**Difficulty:** Easy · **Type:** MCQ

A home-automation app offers a "Movie mode" button that dims lights, closes curtains, turns on the projector and sets the sound system. The button's handler calls one method, `homeTheater.startMovie()`. Which pattern is `homeTheater`?

- A) Adapter
- B) Facade
- C) Proxy
- D) Composite

<details>
<summary>Answer</summary>

**Answer:** B) Facade

**Explanation:** One simple method coordinates several subsystems in a fixed sequence.

</details>

### P2. Design a facade

**Difficulty:** Medium · **Type:** Design

Student registration in a college portal requires: validating documents, creating a student record, allocating a roll number, assigning a hostel (optional), creating a fee invoice and emailing credentials. Sketch a facade and list what it should **not** do.

<details>
<summary>Answer</summary>

**Answer:** `RegistrationFacade.register(application)` with injected `DocumentVerifier`, `StudentRepository`, `RollNumberAllocator`, `HostelAllocator`, `FeeService`, `CredentialMailer`. It calls them in order, skips hostel allocation if not requested, and rolls back or flags the application if a step fails.

**It should not:** contain the rules of each step (roll-number format, fee computation, document rules) — those stay in the subsystem classes; and it should not be the only way to reach them (for example, the accounts team may call `FeeService` directly).

</details>

### P3. Facade or not?

**Difficulty:** Medium · **Type:** Scenario

A `UserFacade` has methods `findById`, `save`, `delete` that each call the same method on `UserRepository` and nothing else. Is this a useful facade?

<details>
<summary>Answer</summary>

**Answer:** No. It adds a layer without simplifying anything — pure forwarding. Use the repository directly, or give the facade a real use-case method that combines several steps (for example `deactivateUser` that revokes sessions, anonymises data and notifies the user).

</details>
