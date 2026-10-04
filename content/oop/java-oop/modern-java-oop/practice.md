# Modern Java OOP Features: Enums, Records and Sealed Classes — Practice

### P1. Record accessors

**Difficulty:** Easy · **Type:** MCQ

For `record Student(String name, int marks)`, how do you read the marks of `s`?

- A) `s.getMarks()`
- B) `s.marks`
- C) `s.marks()`
- D) `s.get("marks")`

<details>
<summary>Answer</summary>

**Answer:** C) `s.marks()`

**Explanation:** Record accessors have the component's name. The field is private, so `s.marks` does not compile outside the record.

</details>

### P2. Record equality

**Difficulty:** Easy · **Type:** Output-based

```java
public class RecordEquality {

    record Pin(String code) { }

    public static void main(String[] args) {
        Pin a = new Pin("620001");
        Pin b = new Pin("620001");
        System.out.println((a == b) + " " + a.equals(b) + " " + a);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
false true Pin[code=620001]
```

**Explanation:** Two distinct objects (`==` is false), but records generate value-based `equals` and a readable `toString`.

</details>

### P3. Validate in a record

**Difficulty:** Medium · **Type:** Coding

Write a record `DateRange(LocalDate start, LocalDate end)` that rejects `null`s and ranges where `end` is before `start`, and add a method `long days()` returning the number of days between them.

<details>
<summary>Answer</summary>

```java
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

record DateRange(LocalDate start, LocalDate end) {
    DateRange {
        Objects.requireNonNull(start, "start");
        Objects.requireNonNull(end, "end");
        if (end.isBefore(start)) {
            throw new IllegalArgumentException("end before start");
        }
    }

    long days() {
        return ChronoUnit.DAYS.between(start, end);
    }
}
```

**Explanation:** The compact constructor runs before the fields are assigned, so every `DateRange` is valid. `LocalDate` is immutable, so no copying is needed.

</details>

### P4. Sealed rules

**Difficulty:** Medium · **Type:** Code analysis

```java
sealed interface Vehicle permits Car, Bike { }

final class Car implements Vehicle { }

class Bike implements Vehicle { }
```

Does it compile? If not, give the three possible fixes.

<details>
<summary>Answer</summary>

**Answer:** No. A permitted subclass must declare `final`, `sealed` (with its own `permits`) or `non-sealed`; `Bike` declares none.

**Fixes:** `final class Bike`, `non-sealed class Bike` (anyone may extend `Bike`), or `sealed class Bike permits ElectricBike` (with `ElectricBike` itself final, sealed or non-sealed).

</details>

### P5. Choose the feature

**Difficulty:** Hard · **Type:** Scenario

Pick enum, record, sealed interface, or a regular class for each, and justify: (a) the result of a KYC check — `Approved`, `Rejected(reason)` or `ManualReview(reviewerId)`; (b) blood groups; (c) a customer with changing address and loyalty points; (d) a product search request with filters.

<details>
<summary>Answer</summary>

**Answer:**

- (a) Sealed interface with three records: a closed set of alternatives that carry **different** data.
- (b) Enum: a fixed set of values without per-instance data beyond a label.
- (c) Regular class: identity and mutable lifecycle, with encapsulated updates.
- (d) Record: an immutable data carrier passed from the API layer to the service.

**Explanation:** Enums fit fixed sets of *identical-shaped* values; sealed + records fit fixed sets of *differently-shaped* values.

</details>
