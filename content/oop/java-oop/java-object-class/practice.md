# The Object Class — Practice

### P1. Final methods of Object

**Difficulty:** Easy · **Type:** MCQ

Which `Object` method can **not** be overridden?

- A) `toString()`
- B) `equals(Object)`
- C) `getClass()`
- D) `hashCode()`

<details>
<summary>Answer</summary>

**Answer:** C) `getClass()`

**Explanation:** `getClass`, `wait`, `notify` and `notifyAll` are `final` in `Object`.

</details>

### P2. Default equals

**Difficulty:** Easy · **Type:** Output-based

```java
public class DefaultEquals {

    static class Book {
        String isbn;

        Book(String isbn) {
            this.isbn = isbn;
        }
    }

    public static void main(String[] args) {
        Book a = new Book("978-81");
        Book b = new Book("978-81");
        Book c = a;
        System.out.println(a.equals(b) + " " + a.equals(c) + " " + a.isbn.equals(b.isbn));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
false true true
```

**Explanation:** `Book` inherits identity-based `equals` from `Object`. The `String` fields are compared by content because `String` overrides `equals`.

</details>

### P3. Wrapper comparisons

**Difficulty:** Medium · **Type:** Output-based

```java
public class WrapperCompare {
    public static void main(String[] args) {
        Integer x = 50;
        Integer y = 50;
        Integer m = 500;
        Integer n = 500;
        Long big = 50L;
        System.out.println((x == y) + " " + (m == n) + " " + m.equals(n) + " " + x.equals(big));
    }
}
```

<details>
<summary>Hint</summary>

`Integer.equals` returns `true` only for another `Integer` with the same value.

</details>

<details>
<summary>Answer</summary>

**Output:**

```text
true false true false
```

**Explanation:** 50 is within the `Integer` cache; 500 is not. `x.equals(big)` is `false` because a `Long` is never equal to an `Integer`, even with the same numeric value.

</details>

### P4. Write a copy constructor

**Difficulty:** Medium · **Type:** Coding

```java
import java.util.ArrayList;
import java.util.List;

class Itinerary {
    private final String traveller;
    private final List<String> cities;

    Itinerary(String traveller, List<String> cities) {
        this.traveller = traveller;
        this.cities = new ArrayList<>(cities);
    }
}
```

Add a copy constructor that produces a fully independent copy, and explain why it is preferable to implementing `clone()`.

<details>
<summary>Answer</summary>

```java
import java.util.ArrayList;
import java.util.List;

class Itinerary {
    private final String traveller;
    private final List<String> cities;

    Itinerary(String traveller, List<String> cities) {
        this.traveller = traveller;
        this.cities = new ArrayList<>(cities);
    }

    Itinerary(Itinerary other) {                 // copy constructor
        this(other.traveller, other.cities);     // the main constructor copies the list
    }
}
```

**Explanation:** Reusing the main constructor gives a new `ArrayList`, so the copies do not share the list (strings are immutable, so sharing them is safe). Unlike `clone()`, it runs normal construction (validation), works with `final` fields, needs no `Cloneable` or checked exception, and the copy depth is explicit.

</details>
