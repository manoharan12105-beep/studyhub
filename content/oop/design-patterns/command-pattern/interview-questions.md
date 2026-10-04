# Command — Interview Questions

## Conceptual

### Q1. What is the Command pattern?

<details>
<summary>Answer</summary>

A behavioral pattern that wraps a request — the receiver to call, the action and its parameters — in an object with an `execute()` method. Invokers (buttons, executors, schedulers) run commands without knowing what they do, and because commands are objects they can be queued, logged, retried, undone and redone.

</details>

### Q2. How do you implement undo/redo with Command?

<details>
<summary>Answer</summary>

Give commands an `undo()` method and have each command capture the state it needs to reverse itself when it executes (or store a memento). The invoker pushes executed commands onto an undo stack; undo pops a command, calls `undo()` and pushes it onto a redo stack; redo re-executes and moves it back. Executing a new command clears the redo stack.

</details>

### Q3. Where does Java use the Command pattern?

<details>
<summary>Answer</summary>

`Runnable` and `Callable` are command interfaces; `ExecutorService`, `Timer` and `ScheduledExecutorService` act as invokers that queue and run them without knowing what they do. Swing's `Action` objects are also commands shared by menus, buttons and shortcuts.

</details>

### Q4. Command vs Strategy?

<details>
<summary>Answer</summary>

Both encapsulate behaviour in an object. A strategy is an interchangeable algorithm used by a context to do its job ("how to compute a fare"). A command represents a specific request to be executed, usually with its receiver and arguments, often stored, queued or undone ("set price of PEN to 12"). Strategies are typically chosen and reused; commands are typically created per request.

</details>

### Q5. What are the components of the Command pattern?

<details>
<summary>Answer</summary>

Command (interface with `execute`/`undo`), ConcreteCommand (binds a receiver and parameters), Receiver (performs the actual work), Invoker (asks commands to execute and may keep history or a queue), and Client (creates commands and configures the invoker).

</details>

## Applied

### Q6. A mobile app must let users perform actions offline and sync them later. How does Command help?

<details>
<summary>Answer</summary>

Represent each user action as a serialisable command object (`AddExpenseCommand`, `DeleteNoteCommand`) with its parameters and a client-generated id. While offline, append commands to a persistent queue; when online, an invoker replays them in order against the server API, retrying failures and using ids to avoid duplicates. The UI code that creates commands does not need to know whether execution is immediate or deferred.

</details>
