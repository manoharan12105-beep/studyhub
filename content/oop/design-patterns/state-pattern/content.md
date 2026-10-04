# State

**Category:** Behavioral · **Interview priority:** Core

## Intent

Allow an object to **alter its behaviour when its internal state changes**. The object appears to change its class: each state is a separate object that implements the state-specific behaviour, and the context delegates to its current state object.

## The Problem

An order moves through a lifecycle:

```text
 CREATED ──pay──▶ PAID ──ship──▶ SHIPPED ──deliver──▶ DELIVERED
    │               │
    └──cancel──▶ CANCELLED ◀──cancel (with refund)
```

What each operation does depends on the current state: `cancel()` is free when CREATED, triggers a refund when PAID, and is not allowed once SHIPPED. `ship()` is allowed only when PAID.

## Why the Naive Solution Fails

```java
class Order {
    String status = "CREATED";

    void cancel() {
        if (status.equals("CREATED")) {
            status = "CANCELLED";
        } else if (status.equals("PAID")) {
            refund();
            status = "CANCELLED";
        } else if (status.equals("SHIPPED") || status.equals("DELIVERED")) {
            throw new IllegalStateException("too late to cancel");
        }
    }

    void ship() { /* another switch over status */ }
    void pay() { /* and another */ }
    void deliver() { /* and another */ }
    void refund() { }
}
```

- Every operation contains a `switch`/`if` chain over the same states — adding a state ("ON_HOLD") means editing every method (Shotgun Surgery, OCP violation).
- The rules for one state are scattered across many methods; it is hard to see "what can happen when PAID?".
- Invalid transitions are easy to miss.

## The Pattern Idea

Create one class per **state**, each implementing a common `OrderState` interface with all the operations. The **context** (`Order`) holds a reference to its current state object and **delegates** each operation to it. A state object performs the behaviour for that state and **switches the context to the next state**.

## Structure

```text
 Order (Context)                      «interface» OrderState
 - state: OrderState ─────────────▶   + pay(Order), ship(Order), deliver(Order), cancel(Order)
 + pay() → state.pay(this)            + name()
 + setState(OrderState)                  ▲        ▲        ▲          ▲          ▲
                                     Created    Paid    Shipped   Delivered  Cancelled
                                     (ConcreteStates: behaviour + transitions)
```

| Participant | In the example |
|-------------|----------------|
| Context | `Order` — holds the current state, exposes the operations |
| State | `OrderState` interface |
| ConcreteStates | `Created`, `Paid`, `Shipped`, `Delivered`, `Cancelled` |

## Java Implementation

```java
public class StateDemo {

    interface OrderState {
        default void pay(Order order) {
            throw new IllegalStateException("cannot pay when " + name());
        }

        default void ship(Order order) {
            throw new IllegalStateException("cannot ship when " + name());
        }

        default void deliver(Order order) {
            throw new IllegalStateException("cannot deliver when " + name());
        }

        default void cancel(Order order) {
            throw new IllegalStateException("cannot cancel when " + name());
        }

        String name();
    }

    static final class Created implements OrderState {
        public void pay(Order order) {
            System.out.println("payment captured");
            order.setState(new Paid());
        }

        public void cancel(Order order) {
            System.out.println("cancelled, nothing to refund");
            order.setState(new Cancelled());
        }

        public String name() {
            return "CREATED";
        }
    }

    static final class Paid implements OrderState {
        public void ship(Order order) {
            System.out.println("handed to courier");
            order.setState(new Shipped());
        }

        public void cancel(Order order) {
            System.out.println("cancelled, refund initiated");
            order.setState(new Cancelled());
        }

        public String name() {
            return "PAID";
        }
    }

    static final class Shipped implements OrderState {
        public void deliver(Order order) {
            System.out.println("delivered to customer");
            order.setState(new Delivered());
        }

        public String name() {
            return "SHIPPED";
        }
    }

    static final class Delivered implements OrderState {
        public String name() {
            return "DELIVERED";
        }
    }

    static final class Cancelled implements OrderState {
        public String name() {
            return "CANCELLED";
        }
    }

    // Context: delegates every operation to its current state
    static final class Order {
        private OrderState state = new Created();

        void pay() {
            state.pay(this);
        }

        void ship() {
            state.ship(this);
        }

        void deliver() {
            state.deliver(this);
        }

        void cancel() {
            state.cancel(this);
        }

        void setState(OrderState next) {           // for state objects only; not part of the public API
            this.state = next;
        }

        String status() {
            return state.name();
        }
    }

    static void attempt(String label, Runnable action, Order order) {
        try {
            action.run();
        } catch (IllegalStateException e) {
            System.out.println("rejected: " + e.getMessage());
        }
        System.out.println("  " + label + " -> " + order.status());
    }

    public static void main(String[] args) {
        Order first = new Order();
        attempt("pay", first::pay, first);
        attempt("ship", first::ship, first);
        attempt("cancel", first::cancel, first);     // too late
        attempt("deliver", first::deliver, first);

        Order second = new Order();
        attempt("pay", second::pay, second);
        attempt("cancel", second::cancel, second);   // refund path
    }
}
```

**Output:**

```text
payment captured
  pay -> PAID
handed to courier
  ship -> SHIPPED
rejected: cannot cancel when SHIPPED
  cancel -> SHIPPED
delivered to customer
  deliver -> DELIVERED
payment captured
  pay -> PAID
cancelled, refund initiated
  cancel -> CANCELLED
```

Default methods give every state a "not allowed" behaviour, so each state class contains only what is **valid** in that state. Adding `OnHold` is a new class plus the transitions into and out of it.

### Lighter alternative: an enum

When states carry little behaviour, an enum with a transition table is enough:

```java
enum Status {
    CREATED, PAID, SHIPPED, DELIVERED, CANCELLED;

    boolean canMoveTo(Status next) {
        switch (this) {
            case CREATED: return next == PAID || next == CANCELLED;
            case PAID: return next == SHIPPED || next == CANCELLED;
            case SHIPPED: return next == DELIVERED;
            default: return false;
        }
    }
}
```

Use full State classes when each state has substantial, different behaviour; use an enum when you mainly need to validate transitions.

## Execution Flow

1. The client calls `order.cancel()`.
2. `Order` delegates to `state.cancel(this)`.
3. The current state object performs its behaviour (refund or rejection) and, if appropriate, calls `order.setState(next)`.
4. Later calls go to the new state object automatically.

## Real-World Examples

- Order, payment, ticket and loan lifecycles in business systems; workflow engines and state machines (e.g. Spring Statemachine).
- TCP connection states (listen, established, closed) — the textbook example.
- Vending machines, ATMs, elevators, traffic lights, media players (see the design problems).
- `java.util.Iterator` implementations and parsers often keep internal state machines.

## When to Use

- An object's behaviour depends on its state and it must change behaviour at runtime.
- Operations contain large conditionals on the same state field.
- States and transitions are a core part of the domain and will grow.

## When Not to Use

- Only a few states with trivial differences — an enum or a few `if`s is clearer.
- State changes rarely and behaviour barely differs.

## Advantages

- Each state's behaviour is in one class (SRP); transitions are explicit.
- New states without editing existing ones (OCP, mostly).
- Removes duplicated conditionals across operations.
- Invalid operations are rejected systematically.

## Disadvantages

- More classes; small state machines become verbose.
- Transitions are spread across state classes, so the overall diagram is not visible in one place (document it or keep a transition table).
- States that need context data couple to the context's API.

## Related Patterns

- **Strategy:** structurally the same (context delegates to an interface). In Strategy the **client** chooses an algorithm and it rarely changes; in State the **states themselves** trigger transitions, and the context's behaviour changes as its lifecycle progresses. See [Design Pattern Comparisons](../design-pattern-comparisons/content.md).
- **Flyweight / Singleton:** stateless state objects can be shared (one instance per state).
- **Memento:** can save and restore a context's state.

## SOLID Connection

- **SRP:** one class per state's behaviour.
- **OCP:** new states are new classes.
- **LSP:** every state must honour the `OrderState` contract (including the documented "not allowed" exceptions).

## Common Mistakes

- Letting clients set the state directly (`order.setState(new Delivered())`), bypassing transition rules.
- Duplicating transition logic in both the context and the states.
- Storing per-order data in shared state objects.
- Using State for a two-state toggle.

## Key Takeaways

- State: the context delegates behaviour to a current-state object; states trigger transitions.
- Replaces repeated `switch(status)` blocks across methods.
- Use classes when states have rich behaviour; an enum with transitions for simple lifecycles.
- Same structure as Strategy; the difference is who changes the object and why.
