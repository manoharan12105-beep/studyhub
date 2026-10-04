# Bridge

**Category:** Structural · **Interview priority:** Advanced / awareness

> [!NOTE]
> **Advanced topic.** Bridge is less commonly asked by name, but the problem it solves — two independent dimensions of variation — is common. Study [Composition over Inheritance](../../relationships/composition-over-inheritance/content.md) first.

## Intent

**Decouple an abstraction from its implementation** so the two can vary independently. Instead of one inheritance hierarchy covering every combination, use two hierarchies connected by composition (the "bridge").

## The Problem

A notification system has **kinds** of notifications (reminder, alert with escalation, digest) and **channels** (email, SMS, push). Each kind has its own rules for composing and repeating messages; each channel has its own delivery mechanics.

## Why the Naive Solution Fails

```text
 Notification
  ├── EmailReminder     ├── SmsReminder     ├── PushReminder
  ├── EmailAlert        ├── SmsAlert        ├── PushAlert
  └── EmailDigest       ├── SmsDigest       └── PushDigest
```

- 3 kinds × 3 channels = 9 classes; adding WhatsApp adds 3 more; adding a kind adds 4 more.
- Channel code is duplicated across kinds and kind logic across channels.
- A notification cannot switch channel at runtime (e.g. fall back from push to SMS).

## The Pattern Idea

Split the two dimensions into **two hierarchies**: the **abstraction** (what the notification means — kinds) and the **implementor** (how it is delivered — channels). The abstraction **holds a reference** to an implementor and delegates delivery to it.

## Structure

```text
      Abstraction                                Implementor
 ┌───────────────────────┐   has-a (bridge)   ┌────────────────────────┐
 │ Notification          │──────────────────▶ │ «interface» Channel    │
 │ # channel: Channel    │                    │ + deliver(to, text)    │
 │ + notify(to)          │                    └──────────▲─────────────┘
 └──────────▲────────────┘                       ┆       ┆        ┆
     ┌──────┴───────┐                      EmailChannel SmsChannel PushChannel
 Reminder         Alert                    (concrete implementors)
 (refined abstractions)
```

| Participant | In the example |
|-------------|----------------|
| Abstraction | `Notification` (holds a `Channel`) |
| RefinedAbstraction | `Reminder`, `EscalatingAlert` |
| Implementor | `Channel` |
| ConcreteImplementor | `EmailChannel`, `SmsChannel` |

## Java Implementation

```java
public class BridgeDemo {

    // ---------- Implementor hierarchy: HOW to deliver ----------
    interface Channel {
        void deliver(String to, String text);
    }

    static class EmailChannel implements Channel {
        public void deliver(String to, String text) {
            System.out.println("EMAIL " + to + ": " + text);
        }
    }

    static class SmsChannel implements Channel {
        public void deliver(String to, String text) {
            System.out.println("SMS " + to + ": " + text);
        }
    }

    // ---------- Abstraction hierarchy: WHAT the notification is ----------
    abstract static class Notification {
        protected final Channel channel;                  // the bridge

        Notification(Channel channel) {
            this.channel = channel;
        }

        abstract void notify(String to);
    }

    static class Reminder extends Notification {
        private final String event;

        Reminder(Channel channel, String event) {
            super(channel);
            this.event = event;
        }

        void notify(String to) {
            channel.deliver(to, "Reminder: " + event);
        }
    }

    static class EscalatingAlert extends Notification {
        private final String problem;
        private final int repeats;

        EscalatingAlert(Channel channel, String problem, int repeats) {
            super(channel);
            this.problem = problem;
            this.repeats = repeats;
        }

        void notify(String to) {
            for (int level = 1; level <= repeats; level++) {
                channel.deliver(to, "ALERT L" + level + ": " + problem);
            }
        }
    }

    public static void main(String[] args) {
        Channel email = new EmailChannel();
        Channel sms = new SmsChannel();

        new Reminder(email, "fee due on 10th").notify("parent@example.com");
        new Reminder(sms, "fee due on 10th").notify("98xxxxxx01");
        new EscalatingAlert(sms, "server down", 2).notify("98xxxxxx02");
    }
}
```

**Output:**

```text
EMAIL parent@example.com: Reminder: fee due on 10th
SMS 98xxxxxx01: Reminder: fee due on 10th
SMS 98xxxxxx02: ALERT L1: server down
SMS 98xxxxxx02: ALERT L2: server down
```

Classes now **add**: 2 kinds + 2 channels = 4 classes instead of 4 combinations; WhatsApp is one new `Channel`, a digest is one new `Notification`, and any kind works with any channel.

## Execution Flow

1. The client chooses a refined abstraction and passes it a concrete implementor.
2. The abstraction's high-level logic (repeat, compose text) runs.
3. Low-level delivery is delegated through the bridge to the implementor.

## Real-World Examples

- **JDBC:** your code uses the `java.sql` API (the abstraction side) while vendor drivers implement it (the implementation side) — often cited as a Bridge-like structure.
- Logging facades with pluggable back-ends (application logging API vs output handlers/appenders).
- UI toolkits separating widget abstractions from platform-specific rendering.

## When to Use

- A class varies along **two (or more) independent dimensions** that would otherwise multiply subclasses.
- Implementations should be **switchable at runtime**.
- You design a library whose abstraction and platform implementations evolve separately.

## When Not to Use

- Only one dimension varies — plain polymorphism or Strategy is simpler.
- The two hierarchies are not really independent (every kind works with only one channel).

## Advantages

- Avoids class explosion; dimensions grow additively.
- Abstraction and implementation evolve and are tested independently.
- Implementations can be swapped at runtime.

## Disadvantages

- More indirection and up-front design; overkill for a single dimension.
- Choosing the right split between abstraction and implementor takes experience.

## Related Patterns

- **Strategy** looks similar (an object delegating to a swappable interface); Bridge is a **structural** decision to keep **two hierarchies** independent, typically designed up front, while Strategy swaps one algorithm.
- **Adapter** makes existing incompatible classes work together after the fact; Bridge is planned.
- **Abstract Factory** can create the matching implementor for an abstraction.

## SOLID Connection

- **OCP:** add a kind or a channel without editing the other hierarchy.
- **SRP:** "what" and "how" are separated.
- **Composition over inheritance:** the bridge is a HAS-A link.

## Common Mistakes

- Confusing Bridge with Adapter: Bridge is designed in; Adapter retrofits.
- Splitting into abstraction/implementor when there is no second dimension.
- Leaking channel-specific details into the abstraction's interface.

## Key Takeaways

- Bridge separates two dimensions of variation into two hierarchies joined by composition.
- Combinations become additive instead of multiplicative.
- Use it when both dimensions really vary independently.
