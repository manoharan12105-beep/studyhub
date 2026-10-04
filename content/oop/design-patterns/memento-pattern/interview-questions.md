# Memento — Interview Questions

## Conceptual

### Q1. What is the Memento pattern?

<details>
<summary>Answer</summary>

A behavioral pattern for saving and restoring an object's state without exposing its internals. The originator creates a memento (an opaque snapshot of its state); a caretaker stores mementos without inspecting them; later the originator restores itself from a memento.

</details>

### Q2. What are the roles in Memento?

<details>
<summary>Answer</summary>

Originator — the object whose state is saved; it creates and consumes mementos. Memento — the immutable snapshot, readable only by the originator. Caretaker — keeps mementos (for example in an undo stack) and returns them when needed, never modifying them.

</details>

### Q3. How do you keep a memento opaque in Java?

<details>
<summary>Answer</summary>

Make it a nested class of the originator with private fields and a private constructor; outer and nested classes can access each other's private members, so only the originator can create and read it, while caretakers just hold references. Store immutable copies of state inside it.

</details>

### Q4. Memento vs Command for undo?

<details>
<summary>Answer</summary>

Command-based undo stores operations and reverses them (each command knows how to undo itself) — compact but requires a correct inverse for every operation. Memento-based undo stores state snapshots and restores them — simple and robust, but uses more memory. They are often combined: a command saves a memento before executing and restores it on undo.

</details>
