# Facade

**Category:** Structural · **Interview priority:** Core

## Intent

Provide a **unified, simplified interface** to a set of interfaces in a subsystem. The facade defines a higher-level entry point that makes the subsystem easier to use, without hiding it from clients who still need the details.

## The Problem

Placing an order in an e-commerce backend involves several subsystems, called in a specific order with specific rules:

1. reserve stock in inventory,
2. charge the payment gateway,
3. if payment fails, release the reservation,
4. create a shipment,
5. send a confirmation.

The web controller, the mobile API, the admin "place order on behalf of a customer" screen and a bulk-import job all need to place orders.

## Why the Naive Solution Fails

- Every client repeats the five-step sequence, including the compensation rule (release stock if payment fails). One client will get it wrong.
- Every client depends on four subsystems and their APIs — high coupling; a change in shipping touches all clients.
- The sequence is business knowledge that has no single home.

## The Pattern Idea

Create a **facade** class that knows the subsystems and the correct order of calls, and exposes **one high-level method** (`placeOrder`). Clients talk to the facade. The subsystems remain available for clients with special needs.

## Structure

```text
 WebController  MobileApi  AdminScreen
        \           |          /
         ▼          ▼         ▼
       ┌──────────────────────────┐
       │ CheckoutFacade           │  placeOrder(order) → result
       └──┬──────┬───────┬──────┬─┘
          ▼      ▼       ▼      ▼
   Inventory  Payment  Shipping  Notification      ← subsystem classes (unchanged)
```

| Participant | Role |
|-------------|------|
| Facade | `CheckoutFacade` — knows which subsystem does what, and in what order |
| Subsystem classes | `InventoryService`, `PaymentService`, `ShippingService`, `NotificationService` — do the real work; unaware of the facade |
| Clients | Use the facade instead of the subsystems |

## Java Implementation

```java
public class FacadeDemo {

    // ---------- Subsystem classes ----------
    static class InventoryService {
        boolean reserve(String sku, int qty) {
            System.out.println("inventory: reserve " + qty + " x " + sku);
            return qty <= 5;
        }

        void release(String sku, int qty) {
            System.out.println("inventory: release " + qty + " x " + sku);
        }
    }

    static class PaymentService {
        String charge(String customer, long amountPaise) {
            System.out.println("payment: charge " + customer + " " + amountPaise);
            return amountPaise <= 500_000 ? "PAY-" + amountPaise : null;    // null = declined
        }
    }

    static class ShippingService {
        String createShipment(String customer, String sku, int qty) {
            System.out.println("shipping: create shipment for " + customer);
            return "SHP-" + sku + "-" + qty;
        }
    }

    static class NotificationService {
        void confirm(String customer, String shipmentId) {
            System.out.println("notify: " + customer + " order shipped as " + shipmentId);
        }
    }

    // ---------- Facade ----------
    static class CheckoutFacade {
        private final InventoryService inventory;
        private final PaymentService payments;
        private final ShippingService shipping;
        private final NotificationService notifications;

        CheckoutFacade(InventoryService inventory, PaymentService payments,
                       ShippingService shipping, NotificationService notifications) {
            this.inventory = inventory;
            this.payments = payments;
            this.shipping = shipping;
            this.notifications = notifications;
        }

        String placeOrder(String customer, String sku, int qty, long amountPaise) {
            if (!inventory.reserve(sku, qty)) {
                return "FAILED: out of stock";
            }
            String paymentId = payments.charge(customer, amountPaise);
            if (paymentId == null) {
                inventory.release(sku, qty);                         // compensation lives in ONE place
                return "FAILED: payment declined";
            }
            String shipmentId = shipping.createShipment(customer, sku, qty);
            notifications.confirm(customer, shipmentId);
            return "OK " + paymentId + " " + shipmentId;
        }
    }

    public static void main(String[] args) {
        CheckoutFacade checkout = new CheckoutFacade(
                new InventoryService(), new PaymentService(), new ShippingService(), new NotificationService());

        System.out.println(checkout.placeOrder("Vani", "BOOK-7", 2, 90_000));
        System.out.println("---");
        System.out.println(checkout.placeOrder("Raj", "TV-1", 1, 4_500_000));
    }
}
```

**Output:**

```text
inventory: reserve 2 x BOOK-7
payment: charge Vani 90000
shipping: create shipment for Vani
notify: Vani order shipped as SHP-BOOK-7-2
OK PAY-90000 SHP-BOOK-7-2
---
inventory: reserve 1 x TV-1
payment: charge Raj 4500000
inventory: release 1 x TV-1
FAILED: payment declined
```

In a real system, the subsystems would be interfaces injected into the facade (so the facade can be unit-tested with fakes), and the sequence might need transactions or a saga for reliability.

## Execution Flow

1. A client calls `placeOrder(...)` with only business-level data.
2. The facade calls the subsystems in the correct order and applies the compensation rule.
3. The client receives a simple result; it never touches inventory or payment APIs.

## Real-World Examples

- `javax.faces.context.FacesContext` and similar framework entry points that hide many internal services (an often-cited example).
- `java.net.URL.openStream()` — one call hides protocol handlers, connections and streams.
- Spring's `JdbcTemplate` and `RestTemplate`/`RestClient` offer a simple API over connection handling, statements, resource cleanup and error translation (they also use Template Method).
- **Application services** in layered backends (`CheckoutService`, `RegistrationService`) are facades over repositories, gateways and notifiers.
- API gateways / "backend for frontend" services act as facades over many microservices.

## When to Use

- A subsystem is complex and most clients need only a few common operations.
- You want to **decouple clients** from subsystem internals so the subsystem can change.
- You want to layer a system: each layer offers a facade to the layer above.
- A **workflow across several services** must be applied consistently.

## When Not to Use

- The subsystem is already simple; a facade would just forward calls one-to-one.
- Clients genuinely need fine-grained control over the subsystem — keep direct access available rather than forcing everything through the facade.

## Advantages

- Simpler client code; fewer dependencies per client (low coupling).
- Workflow knowledge in one place (consistency, DRY).
- Subsystems can be refactored behind a stable facade.

## Disadvantages

- A facade can grow into a **god object** if every operation of every subsystem is added to it — keep it focused on common use cases, and split into several facades if needed.
- An extra layer (thin when well designed).

## Related Patterns

- **Adapter** converts one existing interface to another expected one; **Facade** defines a new, simpler interface over many classes.
- **Mediator** also centralises communication, but subsystem objects **know** the mediator and talk through it; with Facade, subsystems are unaware of the facade and communication is one-way.
- **Abstract Factory** can be used with Facade to create subsystem objects in a platform-independent way.
- Facades are often single instances (injected singletons).

## SOLID Connection

- **Low coupling / ISP:** clients depend on a narrow interface tailored to their needs.
- **SRP:** the facade's responsibility is coordinating a use case; subsystems keep their own responsibilities.
- **DIP:** inject subsystem interfaces into the facade; clients depend on the facade (or an interface it implements).

## Common Mistakes

- Turning the facade into a god class containing business rules that belong in the subsystems.
- Making the facade the **only** way to access subsystems when some clients need more control.
- Creating subsystem objects inside the facade with `new`, making it untestable — inject them.

## Key Takeaways

- Facade = one simple, high-level entry point over a complex subsystem.
- It coordinates; subsystems still do the work and do not know about the facade.
- Reduces coupling and duplicates of workflow logic; keep it focused to avoid a god object.
- Facade simplifies; Adapter converts; Mediator coordinates peers that know it.
