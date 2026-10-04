# Command

**Category:** Behavioral · **Interview priority:** Core

## Intent

**Encapsulate a request as an object**, so you can parameterise clients with different requests, **queue** or **log** requests, schedule them, and support **undoable** operations.

## The Problem

A spreadsheet-like inventory editor lets users change stock levels and prices. Requirements:

- every change must be **undoable** (and redoable),
- changes made offline are **queued** and replayed when back online,
- every change is **logged** for audit,
- the same action can be triggered from a menu, a keyboard shortcut or a script.

## Why the Naive Solution Fails

If buttons and shortcuts call `inventory.setStock(sku, 40)` directly:

- There is no record of what was done, so undo needs ad-hoc "previous value" variables everywhere.
- Queueing a direct method call for later is impossible — a method call is not a value you can store.
- Each UI element duplicates the logic of what to call and with which arguments.

## The Pattern Idea

Turn each request into an **object** with an `execute()` method (and `undo()` if needed). The command stores the **receiver** (the object that does the real work) and the **parameters**. An **invoker** runs commands without knowing what they do, and can store them in a history (undo/redo), a queue (deferred execution) or a log.

## Structure

```text
 Client ──creates──▶ ConcreteCommand(receiver, params) ──given to──▶ Invoker (history / queue)
                         │                                            │
                         │ execute(): receiver.action(params)         │ calls execute() / undo()
                         ▼                                            ▼
                     Receiver (Inventory)              «interface» Command { execute(); undo(); }
```

| Participant | In the example |
|-------------|----------------|
| Command | `Command` interface with `execute()` and `undo()` |
| ConcreteCommand | `SetStockCommand`, `ChangePriceCommand` |
| Receiver | `Inventory` — does the actual work |
| Invoker | `CommandManager` — executes, keeps history for undo/redo |
| Client | Creates commands and hands them to the invoker |

## Java Implementation

```java
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.Map;

public class CommandDemo {

    // Receiver: knows how to do the work
    static class Inventory {
        private final Map<String, Integer> stock = new HashMap<>();
        private final Map<String, Long> price = new HashMap<>();

        int stockOf(String sku) {
            return stock.getOrDefault(sku, 0);
        }

        void setStock(String sku, int qty) {
            stock.put(sku, qty);
        }

        long priceOf(String sku) {
            return price.getOrDefault(sku, 0L);
        }

        void setPrice(String sku, long rupees) {
            price.put(sku, rupees);
        }

        String show(String sku) {
            return sku + " stock=" + stockOf(sku) + " price=" + priceOf(sku);
        }
    }

    // Command interface
    interface Command {
        void execute();
        void undo();
        String describe();
    }

    // Concrete commands store receiver + parameters + what they need to undo
    static class SetStockCommand implements Command {
        private final Inventory inventory;
        private final String sku;
        private final int newQty;
        private int previousQty;

        SetStockCommand(Inventory inventory, String sku, int newQty) {
            this.inventory = inventory;
            this.sku = sku;
            this.newQty = newQty;
        }

        public void execute() {
            previousQty = inventory.stockOf(sku);
            inventory.setStock(sku, newQty);
        }

        public void undo() {
            inventory.setStock(sku, previousQty);
        }

        public String describe() {
            return "set stock of " + sku + " to " + newQty;
        }
    }

    static class ChangePriceCommand implements Command {
        private final Inventory inventory;
        private final String sku;
        private final long newPrice;
        private long previousPrice;

        ChangePriceCommand(Inventory inventory, String sku, long newPrice) {
            this.inventory = inventory;
            this.sku = sku;
            this.newPrice = newPrice;
        }

        public void execute() {
            previousPrice = inventory.priceOf(sku);
            inventory.setPrice(sku, newPrice);
        }

        public void undo() {
            inventory.setPrice(sku, previousPrice);
        }

        public String describe() {
            return "set price of " + sku + " to " + newPrice;
        }
    }

    // Invoker: runs commands, keeps history for undo/redo, logs them
    static class CommandManager {
        private final Deque<Command> undoStack = new ArrayDeque<>();
        private final Deque<Command> redoStack = new ArrayDeque<>();

        void run(Command command) {
            command.execute();
            undoStack.push(command);
            redoStack.clear();                          // a new action invalidates redo history
            System.out.println("did:    " + command.describe());
        }

        void undo() {
            if (!undoStack.isEmpty()) {
                Command command = undoStack.pop();
                command.undo();
                redoStack.push(command);
                System.out.println("undid:  " + command.describe());
            }
        }

        void redo() {
            if (!redoStack.isEmpty()) {
                Command command = redoStack.pop();
                command.execute();
                undoStack.push(command);
                System.out.println("redid:  " + command.describe());
            }
        }
    }

    public static void main(String[] args) {
        Inventory inventory = new Inventory();
        CommandManager manager = new CommandManager();

        manager.run(new SetStockCommand(inventory, "PEN", 100));
        manager.run(new ChangePriceCommand(inventory, "PEN", 12));
        manager.run(new SetStockCommand(inventory, "PEN", 40));
        System.out.println(inventory.show("PEN"));

        manager.undo();
        manager.undo();
        System.out.println(inventory.show("PEN"));

        manager.redo();
        System.out.println(inventory.show("PEN"));
    }
}
```

**Output:**

```text
did:    set stock of PEN to 100
did:    set price of PEN to 12
did:    set stock of PEN to 40
PEN stock=40 price=12
undid:  set stock of PEN to 40
undid:  set price of PEN to 12
PEN stock=100 price=0
redid:  set price of PEN to 12
PEN stock=100 price=12
```

The invoker never knows what a command does; new operations are new command classes. Because commands are objects, they can also be serialised into a queue for offline replay or written to an audit log.

## Execution Flow

1. The client creates a command with its receiver and parameters (for example from a button click).
2. The invoker calls `execute()`; the command calls the receiver and records what it needs for undo.
3. The invoker stores the command in its history; `undo()` pops it and calls `command.undo()`.

## Real-World Examples

- `java.lang.Runnable` and `java.util.concurrent.Callable` are command objects: an `ExecutorService` (the invoker) queues and runs them without knowing what they do.
- GUI actions (`javax.swing.Action`), keyboard shortcuts and menu items mapped to the same action object.
- Undo/redo in editors; transaction logs; job queues; scheduled tasks.
- CQRS-style backends model state changes as command objects (`PlaceOrderCommand`) handled by command handlers.

## When to Use

- You need **undo/redo**, **queuing**, **scheduling**, **retry** or **audit logging** of operations.
- The code that triggers an operation should be decoupled from the code that performs it.
- You want to parameterise objects (buttons, jobs) with actions.

## When Not to Use

- Simple direct calls with no need to store, queue or undo them — a command class per method adds ceremony. A lambda (`Runnable`) may be enough.

## Advantages

- Decouples invoker from receiver (SRP, low coupling).
- New commands without changing the invoker (OCP).
- Enables undo/redo, macros (composite commands), queues and logs.

## Disadvantages

- Many small classes (one per operation), though lambdas reduce this for simple cases.
- Undo is not automatic: each command must capture enough state to reverse itself correctly (or use Memento).

## Related Patterns

- **Memento** stores state snapshots that commands can use for undo.
- **Composite** builds macro commands from several commands.
- **Chain of Responsibility** can pass command objects along handlers.
- **Strategy** also wraps behaviour in an object, but represents **how** to do something (an algorithm), while Command represents **what** to do (a request, often with its parameters and receiver) and is usually stored or deferred.

## SOLID Connection

- **SRP:** invoking, performing and recording operations are separate responsibilities.
- **OCP:** new operations are new command classes.
- **DIP:** invokers depend on the `Command` abstraction.

## Common Mistakes

- Commands that do the work themselves instead of delegating to a receiver (fine for tiny cases, but mixes concerns).
- Forgetting to capture "before" state, making undo incorrect.
- Not clearing the redo stack after a new command.
- Sharing one command instance across multiple executions when it stores per-execution undo state.

## Key Takeaways

- Command = a request as an object (`execute`, optional `undo`), holding its receiver and parameters.
- Invokers run, queue, log, undo and redo commands without knowing what they do.
- `Runnable`/`Callable` with executors are Java's everyday commands.
- Command = what to do (a request); Strategy = how to do it (an algorithm).
