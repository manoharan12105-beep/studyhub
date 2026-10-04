# Memento

**Category:** Behavioral · **Interview priority:** Advanced / awareness

> [!NOTE]
> **Advanced topic.** Know Memento as the encapsulation-preserving way to save and restore state, typically paired with Command for undo. Study [Encapsulation](../../pillars/encapsulation/content.md) and [Command](../command-pattern/content.md) first.

## Intent

**Without violating encapsulation**, capture and externalise an object's internal state so that the object can be **restored** to that state later.

## The Problem

An online exam portal autosaves a candidate's answer sheet and supports "restore to last checkpoint" if the candidate's browser crashes or they want to undo a batch of changes. The answer sheet has private state (answers, flagged questions, time remaining) that other classes must not modify.

## Why the Naive Solution Fails

- Making the state public (or adding setters for everything) so a history manager can copy and restore it breaks encapsulation — any class could then corrupt the answer sheet.
- Having the history manager understand every field couples it to the answer sheet's internals; every new field breaks it.

## The Pattern Idea

Three roles:

- **Originator** (the answer sheet) creates a **memento** — an immutable snapshot of its own state — and can restore itself from one.
- **Memento** is opaque to everyone except the originator (in Java: a nested type with private/package access, or a record whose contents only the originator interprets).
- **Caretaker** (history manager) stores mementos and hands them back, **without looking inside**.

## Structure

```text
 Caretaker (History) ──stores──▶ Memento (opaque, immutable snapshot)
        │                              ▲
        │ asks for save / restore      │ created and read only by
        ▼                              │
 Originator (AnswerSheet) ── save(): Memento ── restore(Memento)
```

## Java Implementation

```java
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.TreeMap;

public class MementoDemo {

    // Originator
    static final class AnswerSheet {
        private final Map<Integer, String> answers = new TreeMap<>();
        private int secondsLeft;

        AnswerSheet(int secondsLeft) {
            this.secondsLeft = secondsLeft;
        }

        void answer(int question, String option) {
            answers.put(question, option);
        }

        void tick(int seconds) {
            secondsLeft -= seconds;
        }

        // Memento: only AnswerSheet can read its contents (private fields of a nested class)
        static final class Checkpoint {
            private final Map<Integer, String> answers;
            private final int secondsLeft;

            private Checkpoint(Map<Integer, String> answers, int secondsLeft) {
                this.answers = Map.copyOf(answers);          // immutable snapshot
                this.secondsLeft = secondsLeft;
            }
        }

        Checkpoint save() {
            return new Checkpoint(answers, secondsLeft);
        }

        void restore(Checkpoint checkpoint) {
            answers.clear();
            answers.putAll(checkpoint.answers);
            // time remaining is NOT restored: the clock keeps running — a deliberate business rule
        }

        @Override
        public String toString() {
            return answers + " (" + secondsLeft + "s left)";
        }
    }

    // Caretaker: stores checkpoints without inspecting them
    static final class History {
        private final Deque<AnswerSheet.Checkpoint> checkpoints = new ArrayDeque<>();

        void push(AnswerSheet.Checkpoint checkpoint) {
            checkpoints.push(checkpoint);
        }

        AnswerSheet.Checkpoint pop() {
            return checkpoints.pop();
        }
    }

    public static void main(String[] args) {
        AnswerSheet sheet = new AnswerSheet(3600);
        History history = new History();

        sheet.answer(1, "B");
        sheet.answer(2, "D");
        history.push(sheet.save());                 // checkpoint
        System.out.println("saved:    " + sheet);

        sheet.answer(2, "A");                       // changed mind
        sheet.answer(3, "C");
        sheet.tick(600);
        System.out.println("current:  " + sheet);

        sheet.restore(history.pop());
        System.out.println("restored: " + sheet);
    }
}
```

**Output:**

```text
saved:    {1=B, 2=D} (3600s left)
current:  {1=B, 2=A, 3=C} (3000s left)
restored: {1=B, 2=D} (3000s left)
```

The caretaker never reads or changes the snapshot. The originator alone decides what a snapshot contains and how restoring works (here, time is deliberately not rolled back).

## Execution Flow

1. Before a risky change, the caretaker asks the originator for a memento and stores it.
2. Later, the caretaker passes the memento back.
3. The originator restores its state from the memento's private contents.

## Real-World Examples

- Undo in editors (often Command + Memento), "restore checkpoint" in games.
- Database transactions and savepoints conceptually store state to roll back to.
- Serialising an object's state to resume later (a session snapshot, a draft autosave) — with the caveat that serialised forms can be read by anyone with the bytes.

## When to Use

- You need snapshots of an object's state for undo, rollback or checkpoints.
- Direct access to the state would break encapsulation.

## When Not to Use

- State is large and snapshots are frequent — memory cost may be prohibitive (consider storing diffs or commands instead).
- The object is immutable — keep references to old versions; no memento needed.

## Advantages

- Preserves encapsulation: only the originator knows its state's structure.
- Simplifies the originator: history management is elsewhere.

## Disadvantages

- Memory cost of many snapshots.
- Deep-copy concerns for mutable nested state.
- The caretaker cannot know how expensive a memento is.

## Related Patterns

- **Command:** commands often keep mementos to implement `undo()`.
- **Iterator:** a memento can capture an iteration position.
- **Prototype:** copies an object to create a new one; Memento copies state to restore the same object.

## SOLID Connection

- **SRP:** the originator manages its state; the caretaker manages history.
- **Encapsulation** is the central concern — the memento is opaque to outsiders.

## Common Mistakes

- Making memento contents public so caretakers manipulate state directly.
- Storing references to mutable internal collections instead of copies (the "snapshot" then changes).
- Snapshotting huge objects too often.

## Key Takeaways

- Memento = opaque snapshot created and restored only by the originator; caretakers just store it.
- Preserves encapsulation while enabling undo, rollback and checkpoints.
- Pair with Command for undo; mind memory and deep copies.
