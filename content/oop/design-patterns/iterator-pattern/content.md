# Iterator

**Category:** Behavioral · **Interview priority:** Frequently useful

## Intent

Provide a way to **access the elements of an aggregate object sequentially without exposing its underlying representation**. The traversal logic lives in a separate iterator object, so the same collection can be traversed in different ways, and clients use one uniform interface for any collection.

## The Problem

A hotel booking system has a `DateRange` (check-in to check-out). Pricing, availability checks and invoice lines all need to "loop over every night in the stay". Internally the range stores only two dates — there is no list of nights.

Similarly, custom collections (a ring buffer, a tree, a paginated API result) must be traversable by code that should not know their internal structure.

## Why the Naive Solution Fails

- Exposing internals (`getStart()`, `getEnd()` plus manual date arithmetic in every client) duplicates traversal logic and ties clients to the representation.
- Converting to a `List<LocalDate>` first wastes memory for long ranges and is impossible for infinite or lazily fetched sequences.
- Each collection with its own traversal API (`nextNight()`, `nodeAt(i)`, `page.next`) forces clients to learn each one.

## The Pattern Idea

Separate **traversal** from the **collection**. The collection (aggregate) creates an **iterator** object that keeps the traversal state (current position) and exposes `hasNext()` / `next()`. In Java, implementing `Iterable<T>` makes any class usable in the enhanced `for` loop.

## Structure

```text
 «interface» Iterable<T> (Aggregate)          «interface» Iterator<T>
 + iterator(): Iterator<T>  ──creates──▶      + hasNext(): boolean
          ▲                                   + next(): T
          ┆                                           ▲
     DateRange (ConcreteAggregate)        DateRangeIterator (ConcreteIterator)
     start, endExclusive                  current position
```

## Java Implementation

```java
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.ConcurrentModificationException;
import java.util.Iterator;
import java.util.List;
import java.util.NoSuchElementException;

public class IteratorDemo {

    // Aggregate: stores only two dates, yet can be iterated night by night
    record DateRange(LocalDate checkIn, LocalDate checkOut) implements Iterable<LocalDate> {
        DateRange {
            if (!checkOut.isAfter(checkIn)) {
                throw new IllegalArgumentException("check-out must be after check-in");
            }
        }

        @Override
        public Iterator<LocalDate> iterator() {
            return new Iterator<>() {                       // concrete iterator holds the position
                private LocalDate current = checkIn;

                @Override
                public boolean hasNext() {
                    return current.isBefore(checkOut);
                }

                @Override
                public LocalDate next() {
                    if (!hasNext()) {
                        throw new NoSuchElementException();
                    }
                    LocalDate night = current;
                    current = current.plusDays(1);
                    return night;
                }
            };
        }
    }

    public static void main(String[] args) {
        DateRange stay = new DateRange(LocalDate.of(2026, 12, 30), LocalDate.of(2027, 1, 2));
        long total = 0;
        for (LocalDate night : stay) {                       // enhanced for uses iterator()
            long rate = night.getMonthValue() == 12 && night.getDayOfMonth() == 31 ? 9_000 : 5_000;
            System.out.println(night + " -> Rs " + rate);
            total += rate;
        }
        System.out.println("Total Rs " + total);

        // Fail-fast iterators of java.util collections
        List<String> guests = new ArrayList<>(List.of("Anu", "Babu", "Chitra", "Dev"));
        try {
            for (String guest : guests) {
                if (guest.startsWith("B")) {
                    guests.remove(guest);                     // structural change during iteration
                }
            }
        } catch (ConcurrentModificationException e) {
            System.out.println("ConcurrentModificationException");
        }

        Iterator<String> it = guests.iterator();
        while (it.hasNext()) {
            if (it.next().startsWith("B")) {
                it.remove();                                  // the safe way to remove while iterating
            }
        }
        System.out.println(guests);
    }
}
```

**Output:**

```text
2026-12-30 -> Rs 5000
2026-12-31 -> Rs 9000
2027-01-01 -> Rs 5000
Total Rs 19000
ConcurrentModificationException
[Anu, Chitra, Dev]
```

In the first loop, removing "Babu" (the second of four elements) changes the list structurally, so the iterator's next call to `next()` detects the modification and throws. The removal itself happened, so the second loop finds nothing left to remove. One trap: removing the **second-to-last** element does **not** throw — `hasNext()` simply returns false and the last element is silently skipped. Never modify a list inside a for-each loop; use `Iterator.remove()` or `list.removeIf(...)`.

### Internal vs external iteration

| | External iteration | Internal iteration |
|--|--------------------|--------------------|
| Who controls the loop | The client (`for`, `while` with `hasNext`/`next`) | The collection (`forEach(action)`, streams) |
| Example | `for (LocalDate night : stay)` | `stay.forEach(night -> ...)`; `list.stream().filter(...)` |
| Early exit | Easy (`break`) | Limited (short-circuiting stream operations) |

`Iterable` provides a default `forEach`, so implementing `iterator()` gives both styles.

## Execution Flow

1. The `for` loop calls `stay.iterator()`, creating a fresh iterator with its own position.
2. Each iteration calls `hasNext()` then `next()`.
3. The aggregate's representation (two dates) is never exposed to the loop.

## Real-World Examples

- Every `java.util.Collection` is `Iterable`; `ArrayList`, `HashMap.keySet()`, `TreeSet` each return their own iterator classes.
- `Scanner` implements `Iterator<String>`; `java.nio.file.DirectoryStream` is `Iterable<Path>`.
- `ResultSet.next()` in JDBC is an iterator-like cursor; paginated REST clients often expose results as an iterator that fetches pages lazily.

## When to Use

- You want to traverse a collection without exposing its structure.
- You need several traversal orders (in-order vs level-order for a tree) or multiple simultaneous traversals.
- You want custom collections to work with the enhanced `for` loop and other `Iterable`-based APIs.

## When Not to Use

- The collection is a standard `List`/`Set` — use the JDK iterators already provided.
- Random access by index is what clients really need.

## Advantages

- Uniform traversal interface; hides representation (encapsulation).
- Multiple independent iterators over the same collection.
- Lazy traversal of large or computed sequences.

## Disadvantages

- An extra object per traversal.
- Concurrent modification needs a policy (fail-fast, snapshot, weakly consistent).

## Related Patterns

- **Composite:** iterators traverse composite trees.
- **Factory Method:** `iterator()` is a factory method — each collection creates its own iterator type.
- **Memento:** an iterator can store its position as a memento to resume later.
- **Visitor:** performs operations on each element; Iterator only provides access.

## SOLID Connection

- **SRP:** traversal logic is separated from storage.
- **OCP:** new traversal orders as new iterator classes.
- **Encapsulation:** the internal representation stays private.

## Common Mistakes

- Modifying a collection inside a for-each loop instead of using `Iterator.remove()` or `removeIf`.
- Calling `next()` without checking `hasNext()`, or not throwing `NoSuchElementException` in custom iterators.
- Returning the same iterator instance from every `iterator()` call (iterations then interfere).

## Key Takeaways

- Iterator separates traversal from the collection; clients use `hasNext()`/`next()` without knowing the structure.
- Implement `Iterable<T>` to support the enhanced `for` loop.
- `java.util` iterators are fail-fast; remove through the iterator or use `removeIf`.
- External iteration (loops) vs internal iteration (`forEach`, streams).
