# Design Patterns

All 23 GoF patterns at revision depth: intent, the key structural idea, a recognition clue and an everyday Java example. **Core** marks the patterns to know thoroughly for interviews.

## Creational

| Pattern | Intent | Key idea | Recognise when… | Java example |
|---------|--------|----------|-----------------|--------------|
| **Singleton** (core) | One instance, global access | Private constructor + static instance (prefer enum/holder) | Exactly one shared resource | `Runtime.getRuntime()`; Spring singleton beans (injected) |
| **Factory Method** (core) | Subclass decides which product | Overridable `createX()` used by a workflow | A workflow needs a product that varies by subclass | `Collection.iterator()` |
| **Abstract Factory** (core) | Families of related products | One factory interface, one concrete factory per family | Products must match (theme, country, vendor) | `DocumentBuilderFactory` |
| **Builder** (core) | Step-by-step construction | Fluent builder + `build()` validates, immutable product | Many optional parameters, cross-field rules | `HttpRequest.newBuilder()`, `StringBuilder` |
| Prototype | Copy configured instances | `copy()` (copy constructor), registry | Expensive setup, many similar objects | Copy constructors, `List.copyOf` |

## Structural

| Pattern | Intent | Key idea | Recognise when… | Java example |
|---------|--------|----------|-----------------|--------------|
| **Adapter** (core) | Make interfaces compatible | Implements target, delegates to adaptee | Existing class has the wrong interface | `InputStreamReader`, `Arrays.asList` |
| Bridge | Vary two dimensions independently | Abstraction holds an implementor | m × n subclass explosion | JDBC API vs drivers (bridge-like) |
| Composite | Uniform part–whole trees | Leaf and container share an interface | Trees: bundles, folders, menus | GUI containers |
| **Decorator** (core) | Add behaviour dynamically | Same interface, wraps one, stackable | Optional combinable add-ons | `BufferedInputStream`, `Collections.unmodifiableList` |
| **Facade** (core) | Simple entry to a subsystem | One class coordinating many | Clients repeat multi-step workflows | Application services, `JdbcTemplate` |
| Flyweight | Share fine-grained objects | Immutable intrinsic state + factory cache | Huge numbers of similar objects | `Integer.valueOf` cache, string pool |
| **Proxy** (core) | Control access | Same interface; lazy / secure / remote / caching | Expensive, remote or protected objects | Spring AOP proxies, `java.lang.reflect.Proxy` |

## Behavioral

| Pattern | Intent | Key idea | Recognise when… | Java example |
|---------|--------|----------|-----------------|--------------|
| Chain of Responsibility | Pass a request along handlers | Each handler handles or forwards | Approval levels, filters, middleware | Servlet filter chain |
| **Command** (core) | Request as an object | `execute()`/`undo()` + invoker | Undo/redo, queues, logs, scheduling | `Runnable`, `Callable` with executors |
| Interpreter | Evaluate a small grammar | Class per rule, expression tree | User-defined rules/filters | `java.util.regex.Pattern` (interpreter-like) |
| Iterator | Traverse without exposing structure | Separate iterator with position | Custom collections, lazy sequences | `Iterable`/`Iterator` |
| Mediator | Centralise interactions | Colleagues talk only to the mediator | Many-to-many tangles (UI widgets) | Dialog controllers |
| Memento | Save/restore state, keep encapsulation | Opaque snapshot from the originator | Checkpoints, undo by snapshot | Editor history |
| **Observer** (core) | Notify dependents of changes | Subject keeps observer list | One change, many independent reactions | Listeners, Spring events, `Flow` |
| **State** (core) | Behaviour changes with state | Context delegates to state object; states transition | `switch(status)` in many methods | Order/ticket lifecycles |
| **Strategy** (core) | Interchangeable algorithms | Context holds an algorithm interface | Rules chosen by config/runtime | `Comparator` |
| **Template Method** (core) | Fixed skeleton, variable steps | `final` template + abstract steps/hooks | Same workflow, few differing steps | `AbstractList`, `HttpServlet` |
| Visitor | New operations on a stable hierarchy | `accept(v)` → `v.visitX(this)` (double dispatch) | Types stable, operations change | `FileVisitor` |

## Telling Look-Alikes Apart

- **Wrap one object:** Adapter (changes interface) · Decorator (adds behaviour) · Proxy (controls access).
- **Wrap a subsystem:** Facade (one-way simplification) vs Mediator (peers that know the coordinator).
- **Delegate to an interface:** Strategy (client picks) · State (states transition) · Bridge (two hierarchies).
- **Vary an algorithm:** Strategy (composition, runtime) vs Template Method (inheritance, compile time).
- **Create:** Factory Method (one product, subclass) · Abstract Factory (family) · Builder (assembly) · Prototype (copy).
- **Notify:** Observer (broadcast) vs Mediator (coordination) vs Chain of Responsibility (one handler acts).

## Patterns and Principles

| Pattern | Principle it serves |
|---------|---------------------|
| Strategy, Decorator, Observer, Template Method | Open/Closed |
| Factory Method, Abstract Factory, Adapter | Dependency Inversion |
| Facade, Adapter | Interface Segregation, low coupling |
| Decorator, Strategy, Bridge, Composite | Composition over inheritance |
| Command, Facade | Single Responsibility (separating invoking from doing / coordinating) |
| Builder, Flyweight | Immutability |

## When Not to Use a Pattern

- No variation and no boundary → no abstraction needed.
- One product, one algorithm, one family, one listener → write the direct code.
- Prefer the simplest design that solves today's problem; refactor toward a pattern when its problem appears.
