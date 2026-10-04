# Immutability

## Definition

An **immutable object** is one whose observable state **cannot change after it is constructed**. Every "modifying" operation returns a **new** object instead. `String`, `Integer`, `LocalDate` and `BigDecimal` are immutable; `StringBuilder`, `ArrayList` and `java.util.Date` are mutable.

## Why Immutable Objects Matter

| Benefit | Why |
|---------|-----|
| **Thread safety for free** | Nothing changes, so threads can share the object without locks |
| **Safe sharing and caching** | Many parts of a program (or a cache) can hold the same instance without defensive copies |
| **Reliable map keys and set elements** | `hashCode` never changes, so entries are never lost ([equals() and hashCode()](../equals-and-hashcode/content.md)) |
| **Simpler reasoning** | An object valid at construction stays valid forever; invariants are checked once |
| **Failure atomicity** | A failed operation cannot leave the object half-modified |
| **No aliasing surprises** | Passing an object to a method cannot change it behind your back |

The cost: every change allocates a new object. For values that change constantly in a tight loop (building a long string) a mutable companion is used — `StringBuilder` for `String`.

## `final` Reference vs Immutable Object

These are different ideas that are constantly confused:

| | `final` variable | Immutable object |
|--|------------------|------------------|
| What is fixed | The **reference** — the variable always points to the same object | The **state** of the object |
| Applies to | A variable or field | A class design |
| Example | `final List<String> names = new ArrayList<>();` | `String`, `LocalDate` |

```java
import java.util.ArrayList;
import java.util.List;

public class FinalIsNotImmutable {
    public static void main(String[] args) {
        final List<String> names = new ArrayList<>();
        names.add("Asha");                // allowed: the list object is mutable
        names.add("Bala");
        // names = new ArrayList<>();      // not allowed: the reference is final
        System.out.println(names);

        String city = "Salem";
        city.toUpperCase();               // returns a new String; city is unchanged
        System.out.println(city);
        city = city.toUpperCase();        // rebind the (non-final) variable to the new String
        System.out.println(city);
    }
}
```

**Output:**

```text
[Asha, Bala]
Salem
SALEM
```

## String Immutability

`String` is immutable: methods such as `toUpperCase`, `replace`, `concat` and `substring` return new strings.

Why Java made it immutable:

- **String pool:** literals are shared (interned). If strings were mutable, changing one shared literal would change it everywhere.
- **Security:** file paths, URLs, class names and credentials are passed as strings; a caller cannot change them after a check has been made.
- **Hash caching:** `String` caches its hash code, which is safe only because the content never changes — making strings fast `HashMap` keys.
- **Thread safety:** strings are shared freely across threads.

Because each change creates a new object, repeated concatenation in a loop is O(n²); use `StringBuilder` for building strings incrementally.

## Wrapper Classes

`Integer`, `Long`, `Double`, `Boolean`, `Character` and the other wrappers are immutable. `count++` on an `Integer` variable unboxes, adds, and boxes a **new** `Integer`, then rebinds the variable:

```java
public class WrapperImmutability {

    static void increment(Integer value) {
        value++;                          // creates a new Integer; only the local variable changes
    }

    public static void main(String[] args) {
        Integer count = 10;
        Integer alias = count;
        count++;
        System.out.println(count + " " + alias);
        increment(count);
        System.out.println(count);
    }
}
```

**Output:**

```text
11 10
11
```

## How to Create a Truly Immutable Class in Java

Follow these steps; each one closes a specific loophole.

| Step | Rule | Loophole it closes |
|------|------|--------------------|
| 1 | Make the class `final` (or make constructors `private` and expose static factories) | A subclass could add mutable state or override methods to return changing values |
| 2 | Make all fields `private final` | `private` blocks outside writes; `final` blocks internal reassignment and gives safe publication to other threads |
| 3 | Provide **no setters** or other mutating methods | Obvious mutation paths |
| 4 | Initialise every field in the constructor, **validating** inputs | Objects must be valid from birth, since they can never be fixed later |
| 5 | **Defensive-copy mutable inputs** in the constructor | The caller keeps a reference to the list/array/`Date` it passed in |
| 6 | **Never return mutable internals**; return copies or unmodifiable views | Getters hand out references that can be mutated |
| 7 | Do not let `this` escape during construction | Another thread could see a half-built object |
| 8 | For "changes", return a new instance ("withers": `withPrice(...)`) | Gives a usable API without mutation |

### Putting the steps together

```java
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class ImmutableClassDemo {

    // Step 1: final class
    static final class Itinerary {
        // Step 2: private final fields
        private final String traveller;
        private final List<String> cities;              // a mutable type: needs care

        // Step 4: initialise and validate everything in the constructor
        Itinerary(String traveller, List<String> cities) {
            this.traveller = Objects.requireNonNull(traveller, "traveller");
            // Step 5: copy the caller's list (List.copyOf also rejects null elements)
            this.cities = List.copyOf(cities);
            if (this.cities.isEmpty()) {
                throw new IllegalArgumentException("at least one city");
            }
        }

        String traveller() {
            return traveller;
        }

        // Step 6: the stored list is already unmodifiable, so returning it is safe
        List<String> cities() {
            return cities;
        }

        // Step 8: a "wither" returns a new object instead of mutating
        Itinerary withExtraCity(String city) {
            List<String> extended = new ArrayList<>(cities);
            extended.add(city);
            return new Itinerary(traveller, extended);
        }

        // Step 3: no setters anywhere

        @Override
        public String toString() {
            return traveller + " " + cities;
        }
    }

    public static void main(String[] args) {
        List<String> plan = new ArrayList<>(List.of("Chennai", "Madurai"));
        Itinerary trip = new Itinerary("Nila", plan);

        plan.add("Ooty");                                   // caller changes its own list
        System.out.println(trip);                           // unaffected (copied in)

        try {
            trip.cities().add("Goa");                       // cannot modify through the getter
        } catch (UnsupportedOperationException e) {
            System.out.println("cities() is read-only");
        }

        Itinerary longer = trip.withExtraCity("Kodaikanal");
        System.out.println(trip);
        System.out.println(longer);
    }
}
```

**Output:**

```text
Nila [Chennai, Madurai]
cities() is read-only
Nila [Chennai, Madurai]
Nila [Chennai, Madurai, Kodaikanal]
```

### Mutable fields

If a field's type is mutable (`Date`, arrays, mutable collections, your own mutable classes):

- Prefer an **immutable alternative**: `java.time.LocalDate`/`Instant` instead of `Date`; `List.copyOf` instead of `ArrayList`.
- Otherwise copy **in** and **out**: `this.start = new Date(start.getTime());` and `return new Date(start.getTime());`. For arrays, `array.clone()` (a shallow copy is enough for primitive arrays).
- Element objects matter too: `List.copyOf(list)` copies the list structure, but if the elements are mutable objects, they are still shared — "deep" immutability requires immutable elements.

## Unmodifiable vs Immutable

| Kind | Example | Can the content change? |
|------|---------|-------------------------|
| **Unmodifiable view** | `Collections.unmodifiableList(list)` | You cannot modify it **through the view**, but changes to the underlying `list` show through |
| **Unmodifiable copy** | `List.copyOf(list)`, `List.of(...)`, `Set.of`, `Map.of` | No — no one holds a modifiable reference to the copy's structure |
| **Immutable** (deeply) | `List.of("a", "b")` of `String`s | No, and the elements are immutable too |

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ViewVsCopy {
    public static void main(String[] args) {
        List<String> source = new ArrayList<>(List.of("x"));
        List<String> view = Collections.unmodifiableList(source);
        List<String> copy = List.copyOf(source);

        source.add("y");
        System.out.println(view + " " + copy);
    }
}
```

**Output:**

```text
[x, y] [x]
```

`List.of`/`List.copyOf` also reject `null` elements, and their `add`/`set`/`remove` throw `UnsupportedOperationException`.

## Records

A **record** (Java 16+) is a concise immutable data carrier: `record Point(int x, int y) { }` generates `private final` fields, a canonical constructor, accessors `x()`/`y()`, and `equals`/`hashCode`/`toString`. Records are implicitly `final`.

Records are **shallowly** immutable: a component of a mutable type can still be mutated. Use the **compact constructor** to validate and copy:

```java
import java.util.List;

record Team(String name, List<String> members) {
    Team {                                        // compact canonical constructor
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name required");
        }
        members = List.copyOf(members);           // defensive copy → deeply safe for String elements
    }
}
```

More on records, enums and sealed types: [Modern Java OOP Features](../modern-java-oop/content.md).

## Immutability and Concurrency

- Immutable objects are **thread-safe without synchronisation**: there are no writes after construction, so there are no data races.
- `final` fields have a special guarantee in the Java Memory Model: once a constructor finishes (and `this` did not escape), every thread that obtains a reference to the object sees the correctly initialised values of its `final` fields, even without synchronisation.
- A common thread-safe design: keep shared state in an immutable object and replace the **reference** atomically (`AtomicReference<Config>` or a `volatile` field), instead of locking many fields. See [OOP with Multithreading](../../applied-oop/oop-with-multithreading/content.md).

## When Mutability Is Fine

- Objects with identity and a lifecycle (an `Order` moving through statuses, a `ShoppingCart`) are naturally mutable — keep the mutation **encapsulated** and validated.
- Performance-critical building (`StringBuilder`, filling an array) inside a method, never shared.
- Builders: a mutable [Builder](../../design-patterns/builder-pattern/content.md) assembles values, then produces an immutable object.

## Real-World Examples

- `java.time` (`LocalDate`, `Duration`, `ZonedDateTime`) — immutable replacements for the mutable `Date`/`Calendar`.
- `BigDecimal` for money: `price.multiply(rate)` returns a new value.
- Configuration objects loaded at startup and shared by all request threads.
- DTOs and events in backend systems are often records.

## Common Misconceptions

- **"`final` makes an object immutable."** It fixes a reference, not the object's state.
- **"Private fields with no setters are enough."** Mutable fields leaked through getters or kept from constructor arguments break it.
- **"`Collections.unmodifiableList` is immutable."** It is a read-only view of a list that may still change.
- **"Records are deeply immutable."** They are shallowly immutable; copy mutable components.
- **"Immutable objects are always slow."** Allocation of short-lived objects is cheap in modern JVMs, and immutability removes locking and defensive copying elsewhere.

## Key Takeaways

- Immutable = state cannot change after construction; changes produce new objects.
- `final` reference ≠ immutable object.
- Recipe: `final` class, `private final` fields, no setters, validate in the constructor, copy mutable inputs and outputs, no `this` escape, withers for changes.
- Unmodifiable view ≠ unmodifiable copy ≠ deeply immutable.
- Immutable objects are thread-safe, hash-safe and easy to reason about; records make simple ones concise.
