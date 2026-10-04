# SOLID and Pattern Recognition

## SOLID One-Liners

- **S** — one reason to change per class.
- **O** — add behaviour with new code, not edits.
- **L** — subtypes must keep the base type's promises.
- **I** — small interfaces shaped by their clients.
- **D** — policy owns abstractions; details implement them; inject.

## Other Principles in One Line

- Composition over inheritance · Program to interfaces · Encapsulate what varies.
- Low coupling, high cohesion · Tell, Don't Ask · Law of Demeter.
- DRY (knowledge, not text) · KISS · YAGNI.
- Constructor injection for required dependencies.

## Clue → Pattern

| Clue in the problem | Pattern |
|---------------------|---------|
| "exactly one instance" | Singleton (inject it) |
| "subclass decides which object to create" | Factory Method |
| "family of matching objects" | Abstract Factory |
| "many optional parameters", "immutable but complex" | Builder |
| "copy a configured object" | Prototype |
| "existing class has the wrong interface" | Adapter |
| "two independent dimensions" | Bridge |
| "tree of parts and wholes" | Composite |
| "add logging/caching/retry in combinations" | Decorator |
| "one simple call over many subsystems" | Facade |
| "millions of similar objects" | Flyweight |
| "lazy load / access control / remote" | Proxy |
| "approval levels / filters" | Chain of Responsibility |
| "undo, queue, schedule requests" | Command |
| "evaluate user-defined rules" | Interpreter |
| "traverse without exposing internals" | Iterator |
| "components tangled with each other" | Mediator |
| "checkpoint and restore" | Memento |
| "notify many when one changes" | Observer |
| "behaviour depends on status/lifecycle" | State |
| "choose an algorithm at runtime" | Strategy |
| "same workflow, different steps" | Template Method |
| "new operations over stable types" | Visitor |

## Look-Alikes in One Line

- Adapter changes the interface; Decorator adds behaviour; Proxy controls access; Facade simplifies a subsystem.
- Strategy: client chooses; State: states transition.
- Strategy: composition; Template Method: inheritance.
- Observer broadcasts; Mediator coordinates.
- Factory Method: one product; Abstract Factory: family; Builder: assembly.

## Java Examples to Name

`Comparator` (Strategy) · `Runnable`/executors (Command) · `Iterator` (Iterator) · `BufferedInputStream` (Decorator) · `InputStreamReader` (Adapter) · `Integer.valueOf` (Flyweight cache) · `AbstractList` (Template Method) · Spring `@Transactional` (Proxy) · listeners/Spring events (Observer) · `HttpRequest.newBuilder()` (Builder).
