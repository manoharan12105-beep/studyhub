# Chain of Responsibility

**Category:** Behavioral · **Interview priority:** Frequently useful

## Intent

Avoid coupling the sender of a request to a specific receiver by giving **more than one object a chance to handle it**. The handlers are linked in a **chain**; the request travels along the chain until a handler deals with it (or, in the "pipeline" variant, every handler processes it in turn).

## The Problem

An expense-claim system routes claims by amount:

- up to ₹5,000 → team lead approves,
- up to ₹50,000 → manager,
- up to ₹5,00,000 → director,
- above that → the CFO's office.

Limits and levels change when the organisation restructures, and some departments add an extra "finance review" step.

## Why the Naive Solution Fails

```java
String approve(long amount) {
    if (amount <= 5_000) return "Team lead";
    else if (amount <= 50_000) return "Manager";
    else if (amount <= 500_000) return "Director";
    else return "CFO";
}
```

- The routing rules, each approver's own checks and the order are all hard-coded in one method.
- Adding, removing or reordering levels means editing this method (OCP violation).
- The sender knows every possible receiver.

## The Pattern Idea

Make each approver a **handler** object with a reference to the **next** handler. Each handler either handles the request or **passes it on**. The client sends the request to the first handler and does not know who will handle it. The chain is assembled (and can be re-assembled) by configuration.

## Structure

```text
 Client ──▶ Handler1 ──next──▶ Handler2 ──next──▶ Handler3 ──next──▶ (end)

 «abstract» Approver
 - next: Approver
 + setNext(Approver): Approver
 + handle(Claim): String      ← handle or forward
        ▲
 TeamLead   Manager   Director   CfoOffice   (concrete handlers)
```

| Participant | Role |
|-------------|------|
| Handler | Declares the handling method; holds the next link |
| ConcreteHandler | Handles requests it is responsible for; otherwise forwards |
| Client | Sends the request to the head of the chain |

## Java Implementation

```java
public class ChainOfResponsibilityDemo {

    record Claim(String employee, long amountRupees, String purpose) { }

    abstract static class Approver {
        private Approver next;

        Approver linkWith(Approver next) {              // returns next, so chains read left to right
            this.next = next;
            return next;
        }

        final String handle(Claim claim) {
            if (canApprove(claim)) {
                return approve(claim);
            }
            if (next == null) {
                return "REJECTED: no approver for Rs " + claim.amountRupees();
            }
            return next.handle(claim);                   // pass along the chain
        }

        protected abstract boolean canApprove(Claim claim);

        protected abstract String approve(Claim claim);
    }

    static class LimitApprover extends Approver {
        private final String role;
        private final long limitRupees;

        LimitApprover(String role, long limitRupees) {
            this.role = role;
            this.limitRupees = limitRupees;
        }

        protected boolean canApprove(Claim claim) {
            return claim.amountRupees() <= limitRupees;
        }

        protected String approve(Claim claim) {
            return role + " approved Rs " + claim.amountRupees() + " for " + claim.purpose();
        }
    }

    public static void main(String[] args) {
        Approver chain = new LimitApprover("Team lead", 5_000);
        chain.linkWith(new LimitApprover("Manager", 50_000))
             .linkWith(new LimitApprover("Director", 500_000));

        System.out.println(chain.handle(new Claim("Arul", 1_200, "taxi")));
        System.out.println(chain.handle(new Claim("Arul", 38_000, "conference")));
        System.out.println(chain.handle(new Claim("Arul", 450_000, "server hardware")));
        System.out.println(chain.handle(new Claim("Arul", 900_000, "office lease")));
    }
}
```

**Output:**

```text
Team lead approved Rs 1200 for taxi
Manager approved Rs 38000 for conference
Director approved Rs 450000 for server hardware
REJECTED: no approver for Rs 900000
```

Adding a CFO level, or a special handler that rejects claims without receipts **before** any approver, is a change to how the chain is assembled — not to the handlers or the client.

### Pipeline variant

In many real systems every handler **processes** the request and passes it on (unless it decides to stop): servlet filters, Spring Security's filter chain, logging pipelines, request validation steps. The structure is the same; the difference is "first handler that can, handles it" vs "every handler gets a turn".

## Execution Flow

1. The client calls `handle` on the first handler.
2. The handler checks whether it is responsible; if so, it handles and returns.
3. Otherwise it forwards to its successor; the end of the chain returns a default result (or throws).

## Real-World Examples

- `javax.servlet.Filter` / `jakarta.servlet.Filter` chains: each filter calls `chain.doFilter(...)` to pass the request on (or stops it, e.g. for authentication failure).
- Spring Security's `SecurityFilterChain`.
- `java.util.logging.Logger` passes log records to parent loggers' handlers.
- Exception handling in Java itself: an exception propagates up the call stack until a matching `catch` handles it — a chain of potential handlers.
- Approval workflows, support-ticket escalation, middleware in web frameworks.

## When to Use

- More than one object may handle a request, and the handler should be determined at runtime.
- You want to issue requests without knowing the receiver.
- The set and order of handlers should be configurable.

## When Not to Use

- There is always exactly one known receiver — call it directly.
- Every request **must** be handled and silently falling off the end would be dangerous (or ensure a terminal handler).
- Long chains make it hard to see which handler acted; for strict, visible workflows a simple list of steps may be clearer.

## Advantages

- Decouples sender and receivers (low coupling).
- Handlers can be added, removed and reordered without changing others (OCP).
- Each handler has one responsibility (SRP).

## Disadvantages

- No guarantee of handling unless the chain ends with a catch-all.
- Debugging: the path a request took is not obvious from the code.
- Performance cost for long chains.

## Related Patterns

- **Decorator** also forms a chain of objects with the same interface, but every decorator always delegates and adds behaviour; in Chain of Responsibility a handler may **stop** propagation.
- **Composite:** a component's parent can act as its successor (events bubbling up a UI tree).
- **Command:** requests passed along a chain are often command objects.
- **Mediator / Observer:** other ways to decouple senders and receivers.

## SOLID Connection

- **SRP:** each handler handles one kind of decision.
- **OCP:** extend by adding handlers.
- **DIP:** the client depends on the handler abstraction, not on concrete approvers.

## Common Mistakes

- Forgetting to forward, which silently stops the chain.
- No terminal handler, so requests disappear unhandled.
- Accidentally creating cycles in the chain.
- Encoding the order inside handlers (`if (next instanceof Manager)`), which defeats the decoupling.

## Key Takeaways

- Requests travel along a chain of handlers until one handles them (or each processes them, in pipelines).
- The sender does not know the receiver; the chain is configurable.
- Real examples: servlet/security filter chains, logging, exception propagation.
- Always define what happens at the end of the chain.
