# Flyweight

**Category:** Structural · **Interview priority:** Advanced / awareness

> [!NOTE]
> **Advanced topic.** Flyweight is a memory optimisation needed only for very large numbers of similar objects. Know the intrinsic/extrinsic idea and the JDK examples. Study [Immutability](../../java-oop/immutability/content.md) first — shared flyweights must be immutable.

## Intent

Use **sharing** to support **large numbers of fine-grained objects** efficiently, by separating state that is **shared** (intrinsic) from state that **varies per use** (extrinsic) and keeping one shared object per distinct intrinsic state.

## The Problem

A stadium booking system renders and prices a seat map with **50,000 seats**. Every seat object stores its category name, price, colour, icon and terms text — but there are only **four** categories (VIP, Premium, Standard, Gallery). Storing all category data in every seat object multiplies memory use by 50,000.

## Why the Naive Solution Fails

```java
class Seat {
    int row;
    int number;
    String categoryName;     // repeated 50,000 times
    long pricePaise;         // repeated
    String colourHex;        // repeated
    String termsText;        // a long string, repeated
}
```

Most of each object is duplicate data. Memory grows with the number of seats instead of the number of distinct categories.

## The Pattern Idea

- **Intrinsic state** (category name, price, colour, terms) is the same for many seats → put it in an **immutable** `SeatType` object and **share** it.
- **Extrinsic state** (row, number, whether booked) differs per seat → keep it in the lightweight seat object or pass it in when needed.
- A **factory** returns the existing shared instance for a given key instead of creating duplicates.

## Structure

```text
 SeatTypeFactory ── cache: Map<String, SeatType> ──▶ SeatType (flyweight, immutable, shared)
                                                     name, pricePaise, colour, terms
 Seat (context)  ── row, number, booked ──refers to──▶ SeatType
 50,000 Seat objects → 4 SeatType objects
```

## Java Implementation

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Map;

public class FlyweightDemo {

    // Flyweight: immutable, shared intrinsic state
    record SeatType(String name, long pricePaise, String colourHex) { }

    // Flyweight factory: one instance per key
    static class SeatTypeFactory {
        private final Map<String, SeatType> cache = new HashMap<>();

        SeatType get(String name, long pricePaise, String colourHex) {
            return cache.computeIfAbsent(name, key -> new SeatType(key, pricePaise, colourHex));
        }

        int distinctTypes() {
            return cache.size();
        }
    }

    // Context: extrinsic state + reference to a shared flyweight
    record Seat(int row, int number, SeatType type) { }

    public static void main(String[] args) {
        SeatTypeFactory factory = new SeatTypeFactory();
        List<Seat> seats = new ArrayList<>();
        for (int row = 1; row <= 200; row++) {
            for (int number = 1; number <= 250; number++) {
                SeatType type = row <= 10 ? factory.get("VIP", 500_000, "#d4af37")
                              : row <= 60 ? factory.get("Premium", 200_000, "#1e88e5")
                              : row <= 150 ? factory.get("Standard", 80_000, "#43a047")
                              : factory.get("Gallery", 30_000, "#9e9e9e");
                seats.add(new Seat(row, number, type));
            }
        }

        Map<SeatType, Boolean> distinctObjects = new IdentityHashMap<>();
        for (Seat seat : seats) {
            distinctObjects.put(seat.type(), true);
        }
        System.out.println("Seats: " + seats.size());
        System.out.println("SeatType objects in factory: " + factory.distinctTypes());
        System.out.println("Distinct SeatType instances referenced: " + distinctObjects.size());
        System.out.println(seats.get(0).type() == seats.get(2499).type());   // both row ≤ 10 → same VIP object
    }
}
```

**Output:**

```text
Seats: 50000
SeatType objects in factory: 4
Distinct SeatType instances referenced: 4
true
```

## Execution Flow

1. Code asks the factory for a flyweight by key ("VIP").
2. The factory returns the cached instance, creating it only the first time.
3. Each lightweight context object (`Seat`) stores its own extrinsic data and a reference to the shared flyweight.

## Real-World Examples

- `Integer.valueOf`, `Short.valueOf`, `Byte.valueOf`, `Character.valueOf` and `Long.valueOf` cache small values (−128 to 127 by default for `Integer`) and return shared instances — a flyweight factory.
- The **string pool**: identical string literals share one `String` object; `String.intern()` returns the shared instance.
- `Boolean.TRUE` / `Boolean.FALSE`, enum constants.
- Text editors and games sharing glyph or texture objects across thousands of characters or sprites.

## When to Use

- An application uses a **huge** number of objects, memory cost is significant, and most of each object's state can be made **extrinsic** or shared.
- The shared part is **immutable** and identity of individual objects does not matter.

## When Not to Use

- Object counts are modest — the extra factory and split state add complexity for no gain.
- The shared state must change per object (then it is not intrinsic).
- Profiling has not shown memory to be a real problem (premature optimisation).

## Advantages

- Large memory savings when many objects share state.
- Shared immutable flyweights are thread-safe.

## Disadvantages

- More complex code: state is split, and extrinsic state may have to be passed around.
- Factory lookups add a small runtime cost.
- Identity comparisons and mutability must be handled carefully.

## Related Patterns

- **Singleton** shares one instance; Flyweight shares one instance **per key**.
- **Composite** trees often use flyweights for leaves (shared glyphs in a document tree).
- **Factory** methods typically manage the flyweight pool.
- **Immutability** is a prerequisite for safe sharing.

## SOLID Connection

Flyweight is primarily a performance pattern. It supports **SRP** by separating shared type data from per-instance data, and relies on immutable, encapsulated flyweights.

## Common Mistakes

- Making flyweights mutable — a change through one context affects all.
- Comparing wrapper objects with `==` and relying on the cache (works only within the cached range).
- Applying it without measuring memory first.

## Key Takeaways

- Flyweight shares immutable intrinsic state among many objects; extrinsic state stays per object.
- A factory hands out one shared instance per key.
- JDK examples: wrapper caches (`Integer.valueOf`), the string pool.
- Use only when object counts make memory a real concern.
