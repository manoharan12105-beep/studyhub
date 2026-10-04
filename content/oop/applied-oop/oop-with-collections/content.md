# OOP with Collections

## Definition

Java collections store **references to objects** and rely on the objects' own methods to do their job: `List.contains` calls `equals`, `HashSet` calls `hashCode` and `equals`, `TreeSet` and `Collections.sort` call `compareTo` or a `Comparator`. How you design your classes therefore decides whether collections behave correctly. This topic covers that contract between your objects and the collections framework.

## Why It Matters

- Most real bugs with custom objects in collections are design bugs: missing `equals`, inconsistent `compareTo`, mutated keys, comparators that drop elements.
- Interviewers use collections to test OOP understanding: "Why did my `TreeSet` lose an element?", "Comparable vs Comparator?", "Why can't `HashMap` find my key?"

The data-structure internals (hash buckets, red-black trees, costs) are covered in the DSA topics [Java Maps and Sets](../../../dsa/fundamentals/java-maps-and-sets/content.md) and [Java Sorting and Comparators](../../../dsa/fundamentals/java-sorting-and-comparators/content.md). Here the focus is the **object design** side.

## Which Object Method Each Collection Uses

| Collection / operation | Uses |
|------------------------|------|
| `ArrayList`/`LinkedList`: `contains`, `indexOf`, `remove(Object)` | `equals` |
| `HashSet`, `HashMap` keys, `LinkedHashSet`/`LinkedHashMap` | `hashCode`, then `equals` |
| `TreeSet`, `TreeMap` keys, `PriorityQueue` ordering | `compareTo` (natural order) or the supplied `Comparator` — **not** `equals` |
| `Collections.sort`, `List.sort`, `Arrays.sort` (objects) | `compareTo` or the `Comparator` |
| `IdentityHashMap` | `==` and `System.identityHashCode` (deliberate identity semantics) |

## Objects in an `ArrayList`

A list stores references in order and allows duplicates. Search operations compare with `equals`, so without an `equals` override, a logically equal object is "not found":

```java
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class ListEquality {

    static class Tag {                              // no equals override
        final String name;

        Tag(String name) {
            this.name = name;
        }
    }

    record Label(String name) { }                   // record: value-based equals

    public static void main(String[] args) {
        List<Tag> tags = new ArrayList<>(List.of(new Tag("java")));
        System.out.println(tags.contains(new Tag("java")));

        List<Label> labels = new ArrayList<>(List.of(new Label("java")));
        System.out.println(labels.contains(new Label("java")));
        System.out.println(labels.remove(new Label("java")) + " " + labels.size());
        System.out.println(Objects.equals(new Label("a"), new Label("a")));
    }
}
```

**Output:**

```text
false
true
true 0
true
```

## Objects in a `HashSet` and as `HashMap` Keys

Hash-based collections need **both** `hashCode` and `equals`, consistent with each other, based on **fields that never change** while the object is inside. The full contract and the mutable-key failure are in [equals() and hashCode()](../../java-oop/equals-and-hashcode/content.md). Practical rules:

- Prefer immutable key types: `String`, `Integer`, enums, records with immutable components.
- For entities, base equality on a stable id.
- Never use arrays as keys (identity semantics); wrap them or use `List`.

## `Comparable`: Natural Ordering

A class implements `Comparable<T>` to define its **natural order** — the one obvious way to sort it (numbers by value, strings alphabetically, dates chronologically).

```java
public interface Comparable<T> {               // java.lang.Comparable (simplified)
    int compareTo(T other);   // negative: this < other, zero: same position, positive: this > other
}
```

The `compareTo` contract mirrors `equals`:

- **Antisymmetric:** `sgn(a.compareTo(b)) == -sgn(b.compareTo(a))`.
- **Transitive:** `a > b` and `b > c` ⇒ `a > c`.
- `a.compareTo(b) == 0` ⇒ `a` and `b` compare the same against every other element.
- **Strongly recommended:** `a.compareTo(b) == 0` exactly when `a.equals(b)` ("consistent with equals").

Use `Integer.compare`, `Long.compare`, `String.compareTo` inside — never `a - b`, which overflows for large or negative values.

## `Comparator`: Custom Ordering

A `Comparator<T>` is a separate **strategy object** that defines an ordering from outside the class. Use it when:

- the class has no natural order, or you cannot modify it;
- you need several orders (by salary, by name, by joining date);
- the order is specific to one screen or report.

```java
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class ComparableAndComparator {

    static final class Employee implements Comparable<Employee> {
        private final int id;
        private final String name;
        private final long salary;

        Employee(int id, String name, long salary) {
            this.id = id;
            this.name = name;
            this.salary = salary;
        }

        int id() {
            return id;
        }

        String name() {
            return name;
        }

        long salary() {
            return salary;
        }

        @Override
        public int compareTo(Employee other) {          // natural order: by id
            return Integer.compare(id, other.id);
        }

        @Override
        public String toString() {
            return name + "(" + id + ", " + salary + ")";
        }
    }

    public static void main(String[] args) {
        List<Employee> staff = new ArrayList<>(List.of(
            new Employee(3, "Kumar", 50_000),
            new Employee(1, "Anjali", 70_000),
            new Employee(2, "Bharath", 50_000)
        ));

        staff.sort(null);                                // null comparator = natural order
        System.out.println("by id:     " + staff);

        staff.sort(Comparator.comparingLong(Employee::salary)
                             .reversed()
                             .thenComparing(Employee::name));
        System.out.println("by salary: " + staff);

        staff.sort(Comparator.comparing(Employee::name, Comparator.reverseOrder()));
        System.out.println("name desc: " + staff);
    }
}
```

**Output:**

```text
by id:     [Anjali(1, 70000), Bharath(2, 50000), Kumar(3, 50000)]
by salary: [Anjali(1, 70000), Bharath(2, 50000), Kumar(3, 50000)]
name desc: [Kumar(3, 50000), Bharath(2, 50000), Anjali(1, 70000)]
```

`Comparator` is a functional interface with useful default and static methods: `comparing`, `comparingInt/Long/Double`, `thenComparing`, `reversed`, `naturalOrder`, `reverseOrder`, `nullsFirst`, `nullsLast`. It is the [Strategy](../../design-patterns/strategy-pattern/content.md) pattern built into the JDK.

### Comparable vs Comparator

| | `Comparable<T>` | `Comparator<T>` |
|--|-----------------|-----------------|
| Package | `java.lang` | `java.util` |
| Method | `compareTo(T other)` | `compare(T a, T b)` |
| Where defined | Inside the class being sorted | Outside, as a separate object/lambda |
| Number of orders | One (the natural order) | Any number |
| Need to modify the class | Yes | No |
| Used by | `Collections.sort(list)`, `TreeSet<>()`, `TreeMap<>()` with no comparator | `list.sort(cmp)`, `new TreeSet<>(cmp)`, `new PriorityQueue<>(cmp)` |
| Examples | `String`, `Integer`, `LocalDate` | `String.CASE_INSENSITIVE_ORDER`, `Comparator.comparing(Employee::salary)` |

## `TreeSet` and `TreeMap` Behaviour

Sorted collections decide **both order and duplicates** with `compareTo`/`compare`. If the comparator returns 0, the element is considered a **duplicate** and is not added (for `TreeMap`, the value replaces the existing one) — even if `equals` says the objects differ.

```java
import java.util.Comparator;
import java.util.TreeSet;

public class TreeSetDropsElements {

    record Student(String name, int marks) { }

    public static void main(String[] args) {
        TreeSet<Student> byMarks = new TreeSet<>(Comparator.comparingInt(Student::marks));
        byMarks.add(new Student("Aarav", 85));
        byMarks.add(new Student("Diya", 92));
        byMarks.add(new Student("Farhan", 85));        // compare() == 0 with Aarav → rejected
        System.out.println(byMarks);

        TreeSet<Student> fixed = new TreeSet<>(
            Comparator.comparingInt(Student::marks).thenComparing(Student::name));   // tie-breaker
        fixed.add(new Student("Aarav", 85));
        fixed.add(new Student("Diya", 92));
        fixed.add(new Student("Farhan", 85));
        System.out.println(fixed);
    }
}
```

**Output:**

```text
[Student[name=Aarav, marks=85], Student[name=Diya, marks=92]]
[Student[name=Aarav, marks=85], Student[name=Farhan, marks=85], Student[name=Diya, marks=92]]
```

Rule: a comparator used for a `TreeSet`/`TreeMap` should return 0 **only for objects you consider the same element** — add tie-breakers (ending with a unique field such as an id).

## Natural Ordering vs Custom Ordering

| Choose natural ordering when | Choose a comparator when |
|------------------------------|--------------------------|
| There is one obvious, stable order (ids, dates, versions) | Order depends on the use case (UI sorting, reports) |
| The class is yours and a value type | The class is from a library or has no single natural order |
| You want `TreeSet<>()` and `Collections.sort(list)` to just work | You need several orders or reverse/null handling |

## Mutable Objects Inside Collections

Collections remember where they put an element based on its state at insertion time:

| Collection | What breaks if you mutate an element's key fields |
|------------|----------------------------------------------------|
| `HashSet` / `HashMap` key | Element is in the wrong bucket: `contains`/`remove`/`get` fail |
| `TreeSet` / `TreeMap` key | Tree order is violated: searches take wrong turns, duplicates or misses |
| `PriorityQueue` | Heap order violated: `poll` returns the wrong element |
| `ArrayList` | Nothing structural — `ArrayList` does not depend on element state |

If you must change a key field: **remove** the element, change it, then **re-insert** it. Better: make key fields immutable.

```java
import java.util.Comparator;
import java.util.PriorityQueue;

public class MutatingInsidePriorityQueue {

    static class Task {
        final String name;
        int priority;

        Task(String name, int priority) {
            this.name = name;
            this.priority = priority;
        }
    }

    public static void main(String[] args) {
        PriorityQueue<Task> queue = new PriorityQueue<>(Comparator.comparingInt((Task t) -> t.priority));
        Task backup = new Task("backup", 5);
        queue.add(new Task("email", 3));
        queue.add(backup);
        queue.add(new Task("deploy", 4));

        backup.priority = 1;                         // mutated while inside: heap is not updated
        System.out.println(queue.poll().name);       // still "email"

        queue.remove(backup);                        // correct way: remove, change, re-add
        backup.priority = 1;
        queue.add(backup);
        System.out.println(queue.poll().name);
    }
}
```

**Output:**

```text
email
backup
```

## Programming to Collection Interfaces

Declare with interfaces, choose implementations in one place:

```java
private final List<Order> orders = new ArrayList<>();
private final Map<String, Customer> customersById = new HashMap<>();
private final Set<String> tags = new LinkedHashSet<>();     // keep insertion order

public List<Order> orders() {
    return List.copyOf(orders);                             // return an unmodifiable copy
}
```

Return unmodifiable copies (or views) from getters — see [Encapsulation](../../pillars/encapsulation/content.md#exposing-mutable-objects).

## Interview Traps

| Trap | Truth |
|------|-------|
| "`TreeSet` uses `equals` to detect duplicates." | It uses `compareTo`/`compare`; returning 0 means duplicate. |
| "A comparator `(a, b) -> a.age - b.age` is fine." | Subtraction can overflow; use `Integer.compare` or `Comparator.comparingInt`. |
| "`list.remove(1)` on `List<Integer>` removes the value 1." | It removes index 1 (`remove(int)` wins without boxing). |
| "`List.of(...)` returns an `ArrayList`." | It returns an unmodifiable list; `add` throws `UnsupportedOperationException`. |
| "Iterating a `HashSet` gives insertion order." | Order is unspecified; use `LinkedHashSet`. |
| "`PriorityQueue.toString()` is sorted." | It shows heap (array) order; only `poll` order is sorted. |
| "Changing a field of an object in a `TreeSet` re-sorts it." | Nothing re-sorts automatically; remove and re-add. |

## Real-World Examples

- Sorting search results by relevance, then price, then rating: a chained `Comparator`.
- De-duplicating customers by email: a `HashSet` of a record `EmailAddress`, or a `Map<EmailAddress, Customer>`.
- Leaderboards: `TreeMap<Score, Player>` needs a tie-breaker or two players with the same score collapse into one entry.

## Common Misconceptions

- **"Collections compare objects by their fields automatically."** Only if the class (or a record) defines `equals`/`hashCode`/`compareTo`.
- **"Comparable and Comparator cannot be used together."** A class can have a natural order and still be sorted by any comparator.
- **"A comparator returning 0 means the objects are equal."** It means equal **in that ordering** — and sorted sets treat that as a duplicate.

## Key Takeaways

- Lists use `equals`; hash collections use `hashCode` + `equals`; sorted collections and sorting use `compareTo`/`Comparator`.
- `Comparable` = one natural order inside the class; `Comparator` = any number of external orders (Strategy).
- Sorted sets/maps treat `compare == 0` as a duplicate — add tie-breakers.
- Do not mutate fields that a collection uses to locate an element; remove, change, re-add.
- Program to collection interfaces and return unmodifiable copies.
