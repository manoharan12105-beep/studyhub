# Food Ordering System Design

## Requirements

**Functional**

1. Customers browse **restaurants** and their **menus**, add items to a **cart** (items from one restaurant at a time) and **place an order**.
2. The bill = item total + **delivery fee** (rule depends on city/promotion) + 5% tax on items.
3. An order moves through statuses: PLACED → ACCEPTED → PREPARING → OUT_FOR_DELIVERY → DELIVERED; it can be CANCELLED only before PREPARING.
4. When the restaurant marks an order ready, the system assigns the **nearest available delivery partner**.
5. The customer is **notified** on every status change.

**Assumptions:** payment is handled elsewhere; distances are straight-line km; one city.

## Entities and Responsibilities

| Class | Responsibility |
|-------|----------------|
| `Restaurant` | Name, location, menu, open/closed |
| `MenuItem` (record) | Name, price, availability |
| `Cart` | Lines from one restaurant; computes item total; enforces the single-restaurant rule |
| `Order` | Lines, bill, status; **owns its status transitions** |
| `OrderStatus` (enum) | Allowed next statuses |
| `DeliveryFeePolicy` (interface) | Fee rule (flat, free above amount, surge) |
| `DeliveryPartner` | Location, availability |
| `PartnerAssignmentStrategy` (interface) | Chooses a partner (nearest, least busy…) |
| `OrderListener` (interface) | Reacts to status changes (customer notifications, analytics) |
| `OrderService` | Use cases: place order, update status, assign partner |

## Relationships

- `Restaurant` ◆ `MenuItem`; `Cart` ◆ cart lines; `Order` ◆ order lines (copied from the cart at checkout — prices are frozen).
- `Order` → `Restaurant`, `Order` → 0..1 `DeliveryPartner`.
- `OrderService` → `DeliveryFeePolicy`, `PartnerAssignmentStrategy`, `OrderListener`s (injected abstractions).

## Class Diagram

```text
 Customer ──▶ Cart ◆── 1..* Line(MenuItem, qty) ──checkout──▶ Order ◆── 1..* Line
                                                               │ status: OrderStatus (transitions)
                                                               ├──▶ Restaurant ◆── MenuItem
                                                               └──▶ 0..1 DeliveryPartner
 OrderService ──▶ «interface» DeliveryFeePolicy        (Strategy)
              ──▶ «interface» PartnerAssignmentStrategy (Strategy)
              ──▶ «interface» OrderListener *           (Observer)
```

## Design Decisions

- **Order status as an enum with a transition table** (the lightweight form of the State pattern): the lifecycle is mostly validation of allowed moves. If each status gained rich behaviour, it would become full State classes.
- **Strategies** for delivery fees and partner assignment — both change by city, time and experiments (OCP).
- **Observer** for notifications: `Order` changes do not know about SMS, push or analytics.
- **Prices frozen at checkout:** order lines copy item prices so later menu changes do not alter placed orders.
- **Cart enforces "one restaurant"** — the rule lives with the data it protects.

## Java Implementation

```java
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public class FoodOrderingDesign {

    record Location(double x, double y) {
        double distanceTo(Location o) {
            return Math.hypot(x - o.x, y - o.y);
        }
    }

    record MenuItem(String name, long price) { }

    record Restaurant(String name, Location location, List<MenuItem> menu) { }

    record Line(MenuItem item, int qty) {
        long amount() {
            return item.price() * qty;
        }
    }

    static final class Cart {
        private Restaurant restaurant;
        private final List<Line> lines = new ArrayList<>();

        void add(Restaurant from, MenuItem item, int qty) {
            if (restaurant != null && restaurant != from) {
                throw new IllegalStateException("cart has items from " + restaurant.name());
            }
            restaurant = from;
            lines.add(new Line(item, qty));
        }

        long itemTotal() {
            return lines.stream().mapToLong(Line::amount).sum();
        }
    }

    enum OrderStatus {
        PLACED, ACCEPTED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED;

        Set<OrderStatus> next() {
            switch (this) {
                case PLACED: return EnumSet.of(ACCEPTED, CANCELLED);
                case ACCEPTED: return EnumSet.of(PREPARING, CANCELLED);
                case PREPARING: return EnumSet.of(OUT_FOR_DELIVERY);
                case OUT_FOR_DELIVERY: return EnumSet.of(DELIVERED);
                default: return EnumSet.noneOf(OrderStatus.class);
            }
        }
    }

    static final class DeliveryPartner {
        final String name;
        final Location location;
        boolean available = true;

        DeliveryPartner(String name, Location location) {
            this.name = name;
            this.location = location;
        }
    }

    static final class Order {
        final String id;
        final Restaurant restaurant;
        final List<Line> lines;
        final long bill;
        private OrderStatus status = OrderStatus.PLACED;
        DeliveryPartner partner;

        Order(String id, Restaurant restaurant, List<Line> lines, long bill) {
            this.id = id;
            this.restaurant = restaurant;
            this.lines = List.copyOf(lines);           // prices frozen at checkout
            this.bill = bill;
        }

        void moveTo(OrderStatus next) {
            if (!status.next().contains(next)) {
                throw new IllegalStateException(id + ": " + status + " -> " + next + " not allowed");
            }
            status = next;
        }

        OrderStatus status() {
            return status;
        }
    }

    interface DeliveryFeePolicy {
        long fee(long itemTotal);
    }

    interface PartnerAssignmentStrategy {
        Optional<DeliveryPartner> choose(List<DeliveryPartner> partners, Location pickup);
    }

    static final class NearestAvailable implements PartnerAssignmentStrategy {
        public Optional<DeliveryPartner> choose(List<DeliveryPartner> partners, Location pickup) {
            DeliveryPartner best = null;
            for (DeliveryPartner p : partners) {
                if (p.available && (best == null
                        || p.location.distanceTo(pickup) < best.location.distanceTo(pickup))) {
                    best = p;
                }
            }
            return Optional.ofNullable(best);
        }
    }

    interface OrderListener {
        void statusChanged(Order order);
    }

    static final class OrderService {
        private final DeliveryFeePolicy feePolicy;
        private final PartnerAssignmentStrategy assignment;
        private final List<DeliveryPartner> partners;
        private final List<OrderListener> listeners;
        private int nextId = 1;

        OrderService(DeliveryFeePolicy feePolicy, PartnerAssignmentStrategy assignment,
                     List<DeliveryPartner> partners, List<OrderListener> listeners) {
            this.feePolicy = feePolicy;
            this.assignment = assignment;
            this.partners = partners;
            this.listeners = List.copyOf(listeners);
        }

        Order checkout(Cart cart) {
            long items = cart.itemTotal();
            long bill = items + items * 5 / 100 + feePolicy.fee(items);
            Order order = new Order("ORD" + nextId++, cart.restaurant, cart.lines, bill);
            publish(order);
            return order;
        }

        void update(Order order, OrderStatus next) {
            order.moveTo(next);
            if (next == OrderStatus.OUT_FOR_DELIVERY) {
                DeliveryPartner p = assignment.choose(partners, order.restaurant.location())
                        .orElseThrow(() -> new IllegalStateException("no partner available"));
                p.available = false;
                order.partner = p;
            }
            publish(order);
        }

        private void publish(Order order) {
            listeners.forEach(l -> l.statusChanged(order));
        }
    }

    public static void main(String[] args) {
        MenuItem dosa = new MenuItem("Masala Dosa", 80);
        MenuItem coffee = new MenuItem("Filter Coffee", 30);
        Restaurant cafe = new Restaurant("Srirangam Cafe", new Location(0, 0), List.of(dosa, coffee));
        Restaurant other = new Restaurant("Biryani Point", new Location(5, 5), List.of());

        List<DeliveryPartner> partners = List.of(
                new DeliveryPartner("Ravi", new Location(3, 4)),
                new DeliveryPartner("Mani", new Location(1, 1)));

        OrderListener customerSms = o -> System.out.println("SMS: " + o.id + " is " + o.status()
                + (o.partner != null ? " with " + o.partner.name : ""));
        OrderService service = new OrderService(
                items -> items >= 300 ? 0 : 25,                     // free delivery above Rs 300
                new NearestAvailable(), partners, List.of(customerSms));

        Cart cart = new Cart();
        cart.add(cafe, dosa, 2);
        cart.add(cafe, coffee, 2);
        try {
            cart.add(other, new MenuItem("Biryani", 220), 1);
        } catch (IllegalStateException e) {
            System.out.println("rejected: " + e.getMessage());
        }

        Order order = service.checkout(cart);
        System.out.println("bill: Rs " + order.bill);
        service.update(order, OrderStatus.ACCEPTED);
        service.update(order, OrderStatus.PREPARING);
        try {
            service.update(order, OrderStatus.CANCELLED);
        } catch (IllegalStateException e) {
            System.out.println("rejected: " + e.getMessage());
        }
        service.update(order, OrderStatus.OUT_FOR_DELIVERY);
        service.update(order, OrderStatus.DELIVERED);
    }
}
```

**Output:**

```text
rejected: cart has items from Srirangam Cafe
SMS: ORD1 is PLACED
bill: Rs 256
SMS: ORD1 is ACCEPTED
SMS: ORD1 is PREPARING
rejected: ORD1: PREPARING -> CANCELLED not allowed
SMS: ORD1 is OUT_FOR_DELIVERY with Mani
SMS: ORD1 is DELIVERED with Mani
```

(Items 2 × 80 + 2 × 30 = 220; tax 5% = 11; delivery fee 25 because 220 is below the ₹300 free-delivery threshold; bill 256. Mani is assigned as the partner closest to the restaurant.)

## Extension Scenarios

### Coupons and restaurant offers

<details>
<summary>Approach</summary>

Add a `Discount` strategy list applied at checkout (flat, percentage with cap, first-order). Keep eligibility rules composable (Specification/Interpreter style) and record the applied discount on the order for refunds.

</details>

### Partner rejects the assignment

<details>
<summary>Approach</summary>

Model assignment as its own lifecycle (OFFERED → ACCEPTED/REJECTED/TIMED_OUT); on rejection, the strategy chooses the next nearest partner excluding those who declined. Use a scheduled timeout and events.

</details>

### Live tracking on the customer app

<details>
<summary>Approach</summary>

Partners publish location updates; the order's subscribers (customer app) receive them through an Observer/pub-sub channel. Keep location updates out of `Order` itself to avoid frequent writes to the order record.

</details>

## Interview Discussion

- Clarify the scope: single vs multi-restaurant carts, payments, ratings, scheduling.
- Highlight frozen prices, the status transition table and where each rule lives.
- Justify Strategy (fees, assignment) and Observer (notifications); mention concurrency in partner assignment (two orders choosing the same partner — make assignment atomic).
- Follow-ups: ETA estimation, batching two orders for one partner, surge pricing.

## Key Takeaways

- Cart enforces single-restaurant; orders copy lines at checkout.
- Status transitions live in the enum; invalid moves are rejected in one place.
- Strategies for fees and partner assignment; Observer for notifications.
