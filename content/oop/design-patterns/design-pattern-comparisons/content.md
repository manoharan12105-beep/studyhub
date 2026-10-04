# Design Pattern Comparisons

## Definition

Many patterns look alike in a class diagram — a wrapper holding an object, a context delegating to an interface — but solve **different problems**. This topic compares the pairs interviewers most often ask about and gives a recognition guide: how to go from a problem description to the right pattern (or to no pattern at all).

## Why It Matters

- "What is the difference between Strategy and State?" and "Decorator vs Proxy?" are among the most common pattern questions.
- Choosing a pattern by **intent** (the problem) rather than by **shape** (the diagram) is what separates understanding from memorisation.

## How to Recognise the Right Pattern

Ask, in order:

1. **What varies?** An algorithm (Strategy), behaviour by lifecycle (State), steps in a fixed process (Template Method), the class to create (Factory Method), a family of classes (Abstract Factory), the construction process (Builder).
2. **What is the relationship problem?** Incompatible interface (Adapter), too complex a subsystem (Facade), need extra behaviour around calls (Decorator), need to control access (Proxy), part–whole tree (Composite), two independent dimensions (Bridge).
3. **What is the communication problem?** One-to-many notifications (Observer), many-to-many tangle (Mediator), request handled by one of several (Chain of Responsibility), request as an object for undo/queue (Command).
4. **Is the problem real now?** If not, write the simple code and refactor later.

### Structural look-alikes: wrappers

| Pattern | Wraps | Interface of wrapper | Purpose |
|---------|-------|----------------------|---------|
| **Adapter** | One object | **Different** from the wrapped object's (matches what the client expects) | Make incompatible interfaces work together |
| **Decorator** | One object | **Same** as the wrapped object's | Add behaviour; stackable |
| **Proxy** | One object | **Same** as the subject's | Control access (lazy, secure, remote, cached) |
| **Facade** | A whole subsystem | **New, simpler** interface | Simplify use of many classes |
| **Composite** | Many children | **Same** as the children's | Treat part–whole trees uniformly |

### Behavioral look-alikes: delegating to an interface

| Pattern | Who chooses the delegate | Does it change? | Purpose |
|---------|-------------------------|-----------------|---------|
| **Strategy** | The client / configuration | Occasionally, by the client | Interchangeable algorithms |
| **State** | The state objects themselves | Yes, as the lifecycle progresses | Behaviour that depends on internal state |
| **Command** | The client creates the command | Per request | Request as an object (queue, log, undo) |
| **Bridge** | Chosen when the abstraction is built | Rarely | Separate two dimensions of variation |

## Factory Method vs Abstract Factory

| | Factory Method | Abstract Factory |
|--|----------------|------------------|
| Creates | One product | A **family** of related products |
| Mechanism | Inheritance: subclass overrides a creation method | Composition: client receives a factory object |
| Typical shape | `abstract Writer createWriter()` in a creator class | `interface ComplianceKit { TaxCalculator tax(); InvoiceFormatter formatter(); }` |
| Guarantees | The workflow uses an abstract product | Products from one family are used together |
| Adding variants | New creator subclass | New concrete factory (easy); new product kind (hard: all factories change) |

Rule of thumb: one thing to create → Factory Method (or a simple factory); several things that must match → Abstract Factory.

## Factory vs Builder

| | Factory (Method / Abstract / simple) | Builder |
|--|--------------------------------------|---------|
| Question answered | **Which** class to instantiate? | **How** to assemble one complex object? |
| Creation | Usually one call | Step by step, then `build()` |
| Parameters | Few; often a type key | Many, often optional |
| Result | A product chosen among several types | One (usually immutable) object, validated |
| Example | `PaymentProcessorFactory.forCountry("IN")` | `HttpCall.to(url).method("POST").body(json).build()` |

They combine: a factory can return a builder, and a builder's `build()` can use a factory for a part.

## Builder vs Prototype

| | Builder | Prototype |
|--|---------|-----------|
| Starts from | Nothing — assembles from parts | An existing, configured object |
| Good for | Many optional parameters, validation, immutability | Expensive setup, many similar objects, runtime-registered variants |
| Key risk | Boilerplate | Wrong copy depth (shallow vs deep) |
| Example | `HttpRequest.newBuilder()` | `registry.create("festival-template")` returning a copy |

## Adapter vs Facade

| | Adapter | Facade |
|--|---------|--------|
| Intent | **Compatibility**: make an existing interface match one clients expect | **Simplicity**: give clients an easier interface to a subsystem |
| Scope | Usually one class (adaptee) | Many classes (a subsystem) |
| Interface | Already defined by the client (target) | Newly designed by the facade |
| Example | `AcmeSmsAdapter implements SmsSender` | `CheckoutFacade.placeOrder(...)` over inventory, payment, shipping |

## Adapter vs Decorator

| | Adapter | Decorator |
|--|---------|-----------|
| Interface | **Changes** it | **Keeps** it |
| Purpose | Make something fit | Add responsibilities |
| Stacking | Not normally | Designed to stack |
| JDK example | `InputStreamReader` (bytes → characters) | `BufferedInputStream` (adds buffering to any `InputStream`) |

## Decorator vs Proxy

| | Decorator | Proxy |
|--|-----------|-------|
| Structure | Same interface, wraps one object | Same interface, wraps one object |
| Intent | **Add behaviour** (logging, caching, compression) | **Control access** (lazy creation, permissions, remote calls) |
| Who creates the wrapped object | Usually the client, passing it in | Often the proxy itself (lazy) or a framework |
| Client awareness | Client composes decorators deliberately | Client often does not know a proxy is present |
| Typical number | Several stacked | Usually one |
| Examples | `java.io` streams, `Collections.synchronizedList` | Spring AOP/transaction proxies, ORM lazy-loading proxies, `java.lang.reflect.Proxy` |

Many real classes blur the line (a caching proxy is also "adding behaviour"); explain the **intent** when answering.

## Strategy vs State

| | Strategy | State |
|--|----------|-------|
| Varies | **How** a task is done (an algorithm) | **What** the object does in its current situation |
| Chosen by | The client / configuration | The state objects (transitions) |
| Awareness | Strategies are independent; do not know each other | States know which states can follow |
| Changes | Rarely, deliberately | Frequently, as the lifecycle progresses |
| Example | Delivery fee: standard / surge / free-above | Order: created → paid → shipped → delivered |

```text
 Strategy:  checkout.setFeeStrategy(new SurgeFee(...))        ← the CLIENT decides
 State:     paidState.ship(order) → order.setState(new Shipped()) ← the STATE decides
```

## Strategy vs Template Method

| | Strategy | Template Method |
|--|----------|-----------------|
| Mechanism | **Composition**: pass an algorithm object | **Inheritance**: subclass overrides steps |
| Granularity | Usually the whole algorithm | Individual steps in a fixed skeleton |
| When decided | Runtime (swappable) | Compile time (per subclass) |
| Combining variations | Easy (compose several strategies) | Subclass per combination |
| Example | `list.sort(comparator)` | `AbstractList` built on `get`/`size`; an import job with `validate`/`convert` steps |

## Observer vs Mediator

| | Observer | Mediator |
|--|----------|----------|
| Shape | One subject → many observers | Many colleagues ↔ one mediator |
| Knowledge | Subject knows only the observer interface; observers react independently | Mediator knows all colleagues and contains the coordination rules |
| Direction | One-way broadcast | Two-way coordination |
| Example | Order shipped → SMS, analytics, loyalty | Booking screen: seat map, coupon box, price, pay button affect each other |

They combine: colleagues often notify the mediator via an observer-style callback.

## Composition vs Decorator

**Composition** is a general technique: an object holds other objects and delegates to them (any HAS-A). **Decorator** is one specific use of composition with three extra properties: the wrapper has the **same interface** as the wrapped object, it holds **exactly one** such object, and it **adds** behaviour so wrappers can be stacked transparently. Every decorator uses composition; most composition is not a decorator.

| | Composition (technique) | Decorator (pattern) |
|--|------------------------|---------------------|
| Interface of the whole | Anything | Same as the part |
| Number of parts | Any | Exactly one of the same type |
| Purpose | Build objects from parts; reuse | Add responsibilities transparently |
| Example | `Car` has an `Engine` and four `Wheel`s | `LoggingRateService` wraps a `RateService` |

## Singleton: Advantages and Disadvantages

| Advantages | Disadvantages |
|-----------|---------------|
| Guarantees exactly one instance | Global access hides dependencies |
| Controlled, possibly lazy, creation | Global mutable state; order-dependent behaviour |
| Easy access to a shared resource | Hard to substitute in tests |
| Enum form is thread-, serialisation- and reflection-safe | Couples callers to a concrete class (DIP) |
| | Mixes lifecycle control with the class's job (SRP) |
| | Concurrency care needed for mutable singletons |

Modern recommendation: keep "one instance" but obtain it by **injection** (a DI container's singleton scope or manual wiring), not by a static `getInstance()`. See [Singleton](../singleton-pattern/content.md).

## Scenario Guide

| Scenario | Pattern | Why not the look-alike? |
|----------|---------|------------------------|
| Integrate a vendor SDK behind your own `SmsSender` | Adapter | Facade would design a new API; here the target interface already exists |
| Add retry + caching around an API client, configurable per environment | Decorator | Proxy's intent is access control; here we stack added behaviours |
| Load a large image only when it is displayed | Proxy (virtual) | Decorator would not control creation |
| One `checkout()` call over inventory, payment, shipping | Facade | Mediator implies peers that talk back through it |
| Pricing rule chosen per city | Strategy | State would imply the rule changes itself over a lifecycle |
| Ticket moving open → in-progress → resolved, behaviour differs per stage | State | Strategy would make the client choose and track the stage |
| Same import workflow, different validation per file type | Template Method (or Strategy for validation) | Strategy alone does not enforce the step order |
| Undo in an editor | Command (+ Memento) | Strategy has no undo/history semantics |
| UI components affecting each other | Mediator | Observer alone spreads rules across components |
| Create matching tax + invoice objects per country | Abstract Factory | Factory Method creates one product only |

## Common Misconceptions

- **"Same diagram, same pattern."** Intent distinguishes Decorator/Proxy and Strategy/State.
- **"Facade and Adapter both wrap, so they are interchangeable."** One simplifies a subsystem; the other converts an interface.
- **"Template Method and Strategy solve different problems."** They solve the same problem (varying parts of an algorithm) with inheritance vs composition.
- **"Using more patterns makes the design better."** Choose the simplest design that addresses the actual variation.

## Key Takeaways

- Choose patterns by the problem: what varies, what relationship is wrong, what communication is tangled.
- Wrappers: Adapter changes the interface, Decorator adds behaviour, Proxy controls access, Facade simplifies a subsystem, Composite aggregates many.
- Strategy (client chooses) vs State (states transition); Strategy (composition) vs Template Method (inheritance).
- Observer broadcasts; Mediator coordinates.
- Singleton's one-instance benefit is best obtained through injection.
