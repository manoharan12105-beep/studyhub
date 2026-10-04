# Command — Practice

### P1. Identify the role

**Difficulty:** Easy · **Type:** MCQ

In `executor.submit(() -> report.generate())`, which role does `executor` play?

- A) Receiver
- B) Command
- C) Invoker
- D) Client

<details>
<summary>Answer</summary>

**Answer:** C) Invoker

**Explanation:** The lambda is the command (`Runnable`/`Callable`), `report` is the receiver, and the executor runs commands without knowing what they do.

</details>

### P2. Undo output

**Difficulty:** Medium · **Type:** Output-based

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class CounterCommands {

    static class Counter {
        int value;
    }

    interface Command {
        void execute();
        void undo();
    }

    record Add(Counter c, int amount) implements Command {
        public void execute() {
            c.value += amount;
        }

        public void undo() {
            c.value -= amount;
        }
    }

    public static void main(String[] args) {
        Counter counter = new Counter();
        Deque<Command> history = new ArrayDeque<>();
        for (int amount : new int[] {5, 10, 20}) {
            Command command = new Add(counter, amount);
            command.execute();
            history.push(command);
        }
        history.pop().undo();
        System.out.println(counter.value);
        history.pop().undo();
        System.out.println(counter.value);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
15
5
```

**Explanation:** After 5 + 10 + 20 = 35, undo pops the last command (+20) → 15, then the previous one (+10) → 5. The stack gives last-in, first-out undo order.

</details>

### P3. Macro command

**Difficulty:** Hard · **Type:** Coding

Write a `MacroCommand` that executes a list of commands in order and undoes them in reverse order.

<details>
<summary>Answer</summary>

```java
import java.util.List;

interface Command {
    void execute();
    void undo();
}

class MacroCommand implements Command {
    private final List<Command> steps;

    MacroCommand(List<Command> steps) {
        this.steps = List.copyOf(steps);
    }

    @Override
    public void execute() {
        for (Command step : steps) {
            step.execute();
        }
    }

    @Override
    public void undo() {
        for (int i = steps.size() - 1; i >= 0; i--) {
            steps.get(i).undo();
        }
    }
}
```

**Explanation:** A macro is a Composite of commands. Undo must reverse the order so each step sees the state it produced.

</details>
