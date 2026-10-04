# OOP with Generics — Practice

### P1. Valid declaration

**Difficulty:** Easy · **Type:** MCQ

Which declaration compiles?

- A) `List<int> marks = new ArrayList<>();`
- B) `List<Integer> marks = new ArrayList<>();`
- C) `List<Number> marks = new ArrayList<Integer>();`
- D) `ArrayList<Object> marks = new ArrayList<String>();`

<details>
<summary>Answer</summary>

**Answer:** B

**Explanation:** Type arguments must be reference types (A fails), and generics are invariant (C and D fail).

</details>

### P2. Write a generic method

**Difficulty:** Easy · **Type:** Coding

Write `static <T> List<T> repeat(T value, int times)` that returns a list containing `value` `times` times.

<details>
<summary>Answer</summary>

```java
static <T> List<T> repeat(T value, int times) {
    List<T> result = new ArrayList<>();
    for (int i = 0; i < times; i++) {
        result.add(value);
    }
    return result;
}
```

**Explanation:** The method declares its own `T`; the compiler infers it, so `repeat("ab", 3)` returns a `List<String>` with no cast.

</details>

### P3. Bounded generic output

**Difficulty:** Medium · **Type:** Output-based

```java
import java.util.List;

public class BoundedQuestion {

    static <T extends Comparable<T>> T smallest(List<T> items) {
        T min = items.get(0);
        for (T item : items) {
            if (item.compareTo(min) < 0) {
                min = item;
            }
        }
        return min;
    }

    public static void main(String[] args) {
        System.out.println(smallest(List.of("trichy", "chennai", "salem")));
        System.out.println(smallest(List.of(3.5, -1.0, 2.0)));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
chennai
-1.0
```

**Explanation:** `String` and `Double` both implement `Comparable` of themselves; strings compare alphabetically.

</details>

### P4. Apply PECS

**Difficulty:** Medium · **Type:** Coding

Write `static void moveAll(...)` that removes every element from a source collection of `T`s and adds it to a destination that can hold `T`s, accepting the widest possible argument types.

<details>
<summary>Hint</summary>

The source both gives you elements and is cleared; clearing does not need the element type.

</details>

<details>
<summary>Answer</summary>

```java
static <T> void moveAll(Collection<? extends T> source, Collection<? super T> destination) {
    destination.addAll(source);
    source.clear();
}
```

**Explanation:** The source produces `T`s (`extends`), the destination consumes them (`super`). `clear()` needs no element type, so a wildcard source is fine. Example: move a `List<Integer>` into a `List<Number>`.

</details>

### P5. Erasure

**Difficulty:** Hard · **Type:** Code analysis

```java
import java.util.List;

class Notifier {
    void send(List<String> emails) { }
    void send(List<Long> phoneNumbers) { }   // compile-time error
}
```

Why does this not compile, and how would you redesign it?

<details>
<summary>Answer</summary>

**Answer:** Both methods erase to `send(List)`, so the compiler reports a name clash — overloads cannot differ only in type arguments.

**Redesign:** use intention-revealing names (`sendEmails(List<String>)`, `sendSms(List<Long>)`), or introduce a polymorphic `Recipient` interface implemented by `EmailRecipient` and `SmsRecipient`, with a single `send(List<? extends Recipient> recipients)` in which each recipient knows how it is contacted.

</details>
