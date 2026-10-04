# Mediator

**Category:** Behavioral · **Interview priority:** Advanced / awareness

> [!NOTE]
> **Advanced topic.** Mediator is less often asked by name, but "too many objects referencing each other" is a common design problem. Know how it differs from Observer and Facade.

## Intent

Define an object (the **mediator**) that **encapsulates how a set of objects interact**. The objects (colleagues) no longer refer to each other directly; they talk only to the mediator, which coordinates them. This replaces many-to-many connections with one-to-many.

## The Problem

A movie-ticket booking screen has several components:

- a **seat map** (select seats),
- a **coupon box** (apply a code),
- a **price summary** (total),
- a **pay button** (enabled only when at least one seat is selected and the total is valid).

Every change in one component affects others: selecting a seat updates the price and the pay button; applying a coupon updates the price; clearing seats removes the coupon and disables payment.

## Why the Naive Solution Fails

```text
 SeatMap ⇄ PriceSummary ⇄ CouponBox
    ⇅  ╲        ⇅        ╱  ⇅
         PayButton ⇄ ...      each component holds references to the others
```

- Every component knows about several others: n components → up to n × (n − 1) dependencies.
- Components cannot be reused on another screen because they are wired to these specific neighbours.
- The interaction rules ("clearing seats removes the coupon") are scattered across components.

## The Pattern Idea

Introduce a **mediator** that knows all components. Each component only **notifies the mediator** ("I changed"), and the mediator decides what the others must do. Interaction logic lives in one place; components stay simple and reusable.

## Structure

```text
            «interface» BookingMediator
            + changed(component, event)
                       ▲
                       ┆
               BookingScreen (ConcreteMediator) ── knows ──▶ SeatMap, CouponBox, PriceSummary, PayButton
                       ▲          ▲         ▲          ▲
                       └──────────┴─────────┴──────────┘
                     each colleague knows ONLY the mediator
```

## Java Implementation

```java
import java.util.ArrayList;
import java.util.List;

public class MediatorDemo {

    interface BookingMediator {
        void changed(Object component, String event);
    }

    // ---------- Colleagues: know only the mediator ----------
    static class SeatMap {
        private final BookingMediator mediator;
        private final List<String> selected = new ArrayList<>();

        SeatMap(BookingMediator mediator) {
            this.mediator = mediator;
        }

        void select(String seat) {
            selected.add(seat);
            mediator.changed(this, "seats");
        }

        void clear() {
            selected.clear();
            mediator.changed(this, "seats");
        }

        int count() {
            return selected.size();
        }
    }

    static class CouponBox {
        private final BookingMediator mediator;
        private String code;

        CouponBox(BookingMediator mediator) {
            this.mediator = mediator;
        }

        void apply(String code) {
            this.code = code;
            mediator.changed(this, "coupon");
        }

        void reset() {
            this.code = null;
        }

        int discountPercent() {
            return "FIRST50".equals(code) ? 50 : 0;
        }
    }

    static class PriceSummary {
        private long total;

        void show(long total) {
            this.total = total;
            System.out.println("  price: Rs " + total);
        }

        long total() {
            return total;
        }
    }

    static class PayButton {
        void setEnabled(boolean enabled) {
            System.out.println("  pay button " + (enabled ? "ENABLED" : "disabled"));
        }
    }

    // ---------- Concrete mediator: ALL interaction rules live here ----------
    static class BookingScreen implements BookingMediator {
        static final long SEAT_PRICE = 180;
        final SeatMap seats = new SeatMap(this);
        final CouponBox coupon = new CouponBox(this);
        final PriceSummary price = new PriceSummary();
        final PayButton pay = new PayButton();

        @Override
        public void changed(Object component, String event) {
            System.out.println("event: " + event);
            if (component == seats && seats.count() == 0) {
                coupon.reset();                                   // rule: no seats → no coupon
            }
            long total = seats.count() * SEAT_PRICE;
            total -= total * coupon.discountPercent() / 100;
            price.show(total);
            pay.setEnabled(seats.count() > 0);
        }
    }

    public static void main(String[] args) {
        BookingScreen screen = new BookingScreen();
        screen.seats.select("F7");
        screen.seats.select("F8");
        screen.coupon.apply("FIRST50");
        screen.seats.clear();
    }
}
```

**Output:**

```text
event: seats
  price: Rs 180
  pay button ENABLED
event: seats
  price: Rs 360
  pay button ENABLED
event: coupon
  price: Rs 180
  pay button ENABLED
event: seats
  price: Rs 0
  pay button disabled
```

## Execution Flow

1. A colleague changes (a seat is selected) and calls `mediator.changed(this, "seats")`.
2. The mediator applies the interaction rules: recompute the price, reset the coupon if needed, enable or disable payment.
3. Colleagues never call each other.

## Real-World Examples

- GUI dialog controllers that coordinate widgets (enable/disable, cascade selections).
- Air-traffic control: aircraft coordinate through the tower, not with each other directly (a classic illustration).
- Chat rooms: users send messages to the room, which delivers them to other participants.
- Workflow/orchestration services coordinating several microservices; an in-process event bus with request handlers is also mediator-like.

## When to Use

- A set of objects communicates in complex, well-defined ways, and their mutual references make them hard to understand and reuse.
- Interaction rules change often and should live in one place.

## When Not to Use

- Only two or three objects interact simply — direct calls are clearer.
- The mediator would end up containing all the business logic of the system (a god object).

## Advantages

- Reduces coupling: colleagues depend only on the mediator.
- Centralises interaction logic (easy to change in one place).
- Colleagues become reusable in other contexts with a different mediator.

## Disadvantages

- The mediator can grow into a complex god class.
- Control flow becomes less visible inside each component.

## Related Patterns

- **Observer:** distributes events to any number of independent subscribers; colleagues often notify the mediator using Observer-style callbacks. Mediator adds **coordination logic** that knows all participants; Observer's subject does not know what observers do.
- **Facade:** simplifies access **to** a subsystem for outside clients, and the subsystem does not know the facade; with Mediator, colleagues know the mediator and communication is two-way.
- **Command / Chain of Responsibility:** other ways to decouple senders from receivers.

## SOLID Connection

- **SRP:** interaction rules move out of the colleagues into one class.
- **Low coupling:** colleagues depend on one abstraction.
- **OCP:** changing interactions means changing (or replacing) the mediator, not every colleague.

## Common Mistakes

- Letting colleagues still call each other directly "just this once".
- Putting domain logic unrelated to coordination into the mediator.
- Using a mediator for a handful of simple interactions.

## Key Takeaways

- Mediator centralises how a group of objects interact; each object talks only to the mediator.
- Turns many-to-many dependencies into one-to-many.
- Watch out for the mediator becoming a god object.
- Mediator coordinates peers that know it; Facade simplifies a subsystem that does not know it.
