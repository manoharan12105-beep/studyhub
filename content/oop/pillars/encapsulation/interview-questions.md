# Encapsulation — Interview Questions

## Conceptual

### Q1. What is encapsulation?

<details>
<summary>Answer</summary>

Encapsulation is bundling data with the methods that operate on it and restricting direct access to the data, so the object controls every change to its own state. In Java: `private` fields, and public methods that validate input and keep the object's invariants true. Example: `BankAccount` keeps `balance` private and changes it only in `deposit` and `withdraw`, which reject invalid amounts.

</details>

### Q2. What is the difference between encapsulation and data hiding?

<details>
<summary>Answer</summary>

Data hiding is the mechanism — making fields inaccessible (`private`). Encapsulation is the design principle — keeping data and the behaviour that guards it together. Hiding is necessary but not sufficient: a class with private fields and a public setter for each one hides its data yet enforces nothing.

</details>

### Q3. Explain the four access modifiers.

<details>
<summary>Answer</summary>

- `private`: only within the top-level class containing the declaration.
- package-private (no keyword): any class in the same package.
- `protected`: the same package, plus subclasses in other packages (through references of the subclass's own type).
- `public`: everywhere.

Top-level classes can only be `public` or package-private. Fields should normally be `private`.

</details>

### Q4. Is a class with private fields and public getters and setters for all of them well encapsulated?

<details>
<summary>Answer</summary>

Usually not. If every field can be read and set freely, callers can still put the object into any state; the class cannot enforce invariants such as "start date before end date" or "balance not negative". Good encapsulation exposes intention-revealing operations (`withdraw`, `reschedule`) that validate, omits setters for values that must not change, and avoids leaking mutable internals through getters. Pure data carriers (DTOs) are the exception where getters/setters are acceptable.

</details>

### Q5. What is an invariant? How does encapsulation help maintain it?

<details>
<summary>Answer</summary>

An invariant is a condition that is always true for a valid object between method calls — for example, a `Fraction`'s denominator is never zero. The constructor establishes the invariant and every public method preserves it. Encapsulation makes this possible: because fields are private, no code outside the class can break the condition, so checking it in the class's own methods is enough.

</details>

### Q6. What is defensive copying and when do you need it?

<details>
<summary>Answer</summary>

Copying mutable objects when they enter or leave your object, so outside code cannot change your internal state through a shared reference. Needed when a constructor or setter receives a mutable collection, array or `Date`, and when a getter would return one. Copy in (`new ArrayList<>(input)`), copy out (`List.copyOf(list)` or an unmodifiable view), and validate the copy rather than the original.

</details>

### Q7. Differentiate encapsulation and abstraction.

<details>
<summary>Answer</summary>

Encapsulation protects state: it decides who may access the data and ensures changes go through validating methods. Abstraction hides complexity: it decides what a type exposes so callers deal with a simple model (`sendNotification(msg)`) instead of details (SMTP, retries). Encapsulation is mostly about implementation inside a class; abstraction is about the design of the interface. They complement each other.

</details>

## Applied

### Q8. Find the encapsulation bug.

```java
import java.util.Date;

final class Meeting {
    private final Date start;

    Meeting(Date start) {
        this.start = start;
    }

    Date getStart() {
        return start;
    }
}
```

<details>
<summary>Answer</summary>

`Date` is mutable. The constructor stores the caller's object and the getter returns the internal object, so `meeting.getStart().setTime(0)` or changing the original `Date` after construction modifies the meeting, even though the field is `private final`. Fix: copy in (`this.start = new Date(start.getTime())`) and copy out (`return new Date(start.getTime())`) — or better, use the immutable `java.time.Instant`/`LocalDateTime`.

</details>

### Q9. A `User` class has `setPassword(String)` and `getPassword()`. How would you redesign it?

<details>
<summary>Answer</summary>

Never expose the password (or its hash). Replace the pair with behaviour: `changePassword(String oldPassword, String newPassword)`, which verifies the old one and enforces the password policy, and `boolean passwordMatches(String attempt)`, which hashes the attempt and compares internally. The stored hash stays private; callers get only the operations they actually need.

</details>

### Q10. Why are protected fields considered weaker encapsulation than private fields with protected methods?

<details>
<summary>Answer</summary>

A protected field can be written directly by every class in the package and by every subclass anywhere, so the superclass can no longer guarantee its invariants and cannot change the field's type or meaning without breaking subclasses. A private field with a protected method lets subclasses use or customise behaviour through a controlled entry point that still validates.

</details>
