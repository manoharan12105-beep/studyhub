# Immutability — Interview Questions

## Conceptual

### Q1. How do you create an immutable class in Java?

<details>
<summary>Answer</summary>

1. Declare the class `final` (or use private constructors with static factories) so subclasses cannot add mutability.
2. Make all fields `private final`.
3. Provide no setters or mutating methods.
4. Initialise and validate all fields in the constructor.
5. Defensive-copy mutable constructor arguments (lists, arrays, `Date`).
6. Never return references to mutable internals — return copies or unmodifiable collections.
7. Do not let `this` escape from the constructor.
8. For changes, return new instances (`withX(...)`).

Records give steps 1–4 automatically; mutable components still need copying in a compact constructor.

</details>

### Q2. Why is `String` immutable in Java?

<details>
<summary>Answer</summary>

So literals can be safely shared in the string pool; so security-sensitive values (paths, URLs, class names) cannot be changed after validation; so the hash code can be cached, making strings efficient map keys; and so strings can be shared across threads without synchronisation.

</details>

### Q3. What is the difference between a `final` reference and an immutable object?

<details>
<summary>Answer</summary>

A `final` variable cannot be reassigned to point to another object, but the object it points to can still change (`final List<String> list` still allows `add`). An immutable object's state cannot change at all, regardless of whether the variables referring to it are final. A non-final variable can refer to an immutable `String` and be rebound to a different `String`.

</details>

### Q4. What is the difference between `Collections.unmodifiableList` and `List.copyOf`?

<details>
<summary>Answer</summary>

`unmodifiableList` returns a read-only **view** of an existing list: callers cannot modify through it, but changes made to the underlying list are visible through the view. `List.copyOf` returns an unmodifiable **copy**: later changes to the source list do not affect it, and it rejects `null` elements. For truly immutable state, store a copy.

</details>

### Q5. Why are immutable objects thread-safe?

<details>
<summary>Answer</summary>

Data races require at least one thread writing shared state. An immutable object is written only during construction; afterwards every thread only reads it. Combined with the Java Memory Model's guarantee for `final` fields (correctly constructed objects are seen fully initialised), immutable objects can be shared across threads without locks.

</details>

### Q6. Are records immutable?

<details>
<summary>Answer</summary>

Shallowly. Record fields are `private final` and there are no setters, but if a component is a mutable object (a `List`, an array), its contents can change. Make components immutable types or copy them in the compact constructor (`members = List.copyOf(members);`).

</details>

## Applied

### Q7. Is this class immutable? If not, fix it.

```java
import java.util.Date;
import java.util.List;

public final class Event {
    private final String name;
    private final Date date;
    private final List<String> guests;

    public Event(String name, Date date, List<String> guests) {
        this.name = name;
        this.date = date;
        this.guests = guests;
    }

    public Date getDate() {
        return date;
    }

    public List<String> getGuests() {
        return guests;
    }
}
```

<details>
<summary>Answer</summary>

No. `Date` and `List` are mutable and are both stored from the caller and returned to callers, so `event.getDate().setTime(0)` or `event.getGuests().add("x")` (or changes to the original arguments) alter the event.

Fix: copy in and out, or better use immutable types:

```java
import java.time.LocalDate;
import java.util.List;

public final class Event {
    private final String name;
    private final LocalDate date;          // immutable replacement for Date
    private final List<String> guests;

    public Event(String name, LocalDate date, List<String> guests) {
        this.name = name;
        this.date = date;
        this.guests = List.copyOf(guests); // unmodifiable copy
    }

    public LocalDate getDate() {
        return date;
    }

    public List<String> getGuests() {
        return guests;                     // safe: unmodifiable and not shared with callers
    }
}
```

</details>

### Q8. What does this print?

```java
public class StringChange {

    static String shout(String text) {
        text = text.toUpperCase();
        return text + "!";
    }

    public static void main(String[] args) {
        String word = "vanakkam";
        String result = shout(word);
        word.concat(" all");
        System.out.println(word + " | " + result);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
vanakkam | VANAKKAM!
```

Inside `shout`, reassigning `text` only rebinds the local copy of the reference. `word.concat(" all")` creates a new string that is discarded. `word` still refers to the original, unchanged string.

</details>
