# Immutability — Practice

### P1. Which is immutable?

**Difficulty:** Easy · **Type:** MCQ

- A) `StringBuilder`
- B) `ArrayList<String>`
- C) `LocalDate`
- D) `java.util.Date`

<details>
<summary>Answer</summary>

**Answer:** C) `LocalDate`

**Explanation:** The `java.time` types are immutable. The others have methods that change their state.

</details>

### P2. final and mutation

**Difficulty:** Easy · **Type:** Output-based

```java
public class FinalArray {
    public static void main(String[] args) {
        final int[] scores = {10, 20, 30};
        scores[1] = 99;
        System.out.println(scores[0] + scores[1] + scores[2]);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
139
```

**Explanation:** `final` prevents reassigning `scores`, not changing its elements. 10 + 99 + 30 = 139 (all `int`, so it adds rather than concatenates).

</details>

### P3. View or copy?

**Difficulty:** Medium · **Type:** Output-based

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ViewQuestion {
    public static void main(String[] args) {
        List<Integer> base = new ArrayList<>(List.of(1, 2));
        List<Integer> view = Collections.unmodifiableList(base);
        List<Integer> copy = List.copyOf(base);
        base.add(3);
        base.set(0, 100);
        System.out.println(view + " " + copy);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
[100, 2, 3] [1, 2]
```

**Explanation:** The view reflects every later change to `base`; the copy was taken before the changes.

</details>

### P4. Make it immutable

**Difficulty:** Medium · **Type:** Coding

```java
public class Coordinates {
    public double latitude;
    public double longitude;

    public void move(double dLat, double dLon) {
        latitude += dLat;
        longitude += dLon;
    }
}
```

Rewrite `Coordinates` as an immutable class that validates latitude (−90 to 90) and longitude (−180 to 180), and replace `move` with a method that returns a new object.

<details>
<summary>Answer</summary>

```java
public final class Coordinates {
    private final double latitude;
    private final double longitude;

    public Coordinates(double latitude, double longitude) {
        if (latitude < -90 || latitude > 90) {
            throw new IllegalArgumentException("latitude out of range: " + latitude);
        }
        if (longitude < -180 || longitude > 180) {
            throw new IllegalArgumentException("longitude out of range: " + longitude);
        }
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public double latitude() {
        return latitude;
    }

    public double longitude() {
        return longitude;
    }

    public Coordinates movedBy(double dLat, double dLon) {
        return new Coordinates(latitude + dLat, longitude + dLon);   // validated again
    }
}
```

**Explanation:** Every instance passes validation once and can never change; `movedBy` produces a new validated instance. A record with a compact constructor would be equally good.

</details>

### P5. Hidden mutability

**Difficulty:** Hard · **Type:** Code analysis

```java
import java.util.List;

public final class Classroom {
    private final List<StringBuilder> names;

    public Classroom(List<StringBuilder> names) {
        this.names = List.copyOf(names);
    }

    public List<StringBuilder> names() {
        return names;
    }
}
```

The list is copied and unmodifiable. Is `Classroom` immutable?

<details>
<summary>Answer</summary>

**Answer:** No. The list structure cannot change, but its elements are mutable `StringBuilder`s shared with the caller: `classroom.names().get(0).append("X")` changes the classroom.

**Fix:** store immutable elements (`List<String>`, converting each builder with `toString()`), or deep-copy each element in and out.

</details>
