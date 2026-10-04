# Encapsulation — Practice

### P1. Most restrictive modifier

**Difficulty:** Easy · **Type:** MCQ

A helper method should be callable by other classes in the same package but not from any other package, including subclasses there. Which modifier?

- A) `private`
- B) no modifier (package-private)
- C) `protected`
- D) `public`

<details>
<summary>Answer</summary>

**Answer:** B) no modifier (package-private)

**Explanation:** `protected` would also open it to subclasses in other packages; `private` would hide it from the rest of the package.

</details>

### P2. Which top-level class declaration is legal?

**Difficulty:** Easy · **Type:** MCQ

- A) `private class Engine { }`
- B) `protected class Engine { }`
- C) `class Engine { }`
- D) `static class Engine { }`

<details>
<summary>Answer</summary>

**Answer:** C) `class Engine { }`

**Explanation:** Top-level types may only be `public` or package-private. `private`, `protected` and `static` are allowed only on nested types.

</details>

### P3. Leak through the constructor

**Difficulty:** Medium · **Type:** Output-based

```java
import java.util.ArrayList;
import java.util.List;

public class ConstructorLeak {

    static class Playlist {
        private final List<String> songs;

        Playlist(List<String> songs) {
            this.songs = songs;
        }

        int size() {
            return songs.size();
        }
    }

    public static void main(String[] args) {
        List<String> songs = new ArrayList<>(List.of("A", "B"));
        Playlist playlist = new Playlist(songs);
        songs.add("C");
        songs.add("D");
        System.out.println(playlist.size());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
4
```

**Explanation:** The playlist stores the caller's list, so later changes to `songs` change the playlist. A copy in the constructor (`new ArrayList<>(songs)`) would keep the size at 2.

</details>

### P4. Encapsulate a temperature sensor

**Difficulty:** Medium · **Type:** Coding

Write `Thermostat` with a target temperature that must stay between 16 and 30 (inclusive). Provide `increase()` and `decrease()` that change the target by 1 but never leave the range, and a getter. There must be no way to set an out-of-range value.

<details>
<summary>Hint</summary>

Validate in the constructor; let the step methods check the bounds before changing the field. No public setter.

</details>

<details>
<summary>Answer</summary>

```java
class Thermostat {
    private static final int MIN = 16;
    private static final int MAX = 30;
    private int target;

    Thermostat(int initialTarget) {
        if (initialTarget < MIN || initialTarget > MAX) {
            throw new IllegalArgumentException("target must be between " + MIN + " and " + MAX);
        }
        this.target = initialTarget;
    }

    void increase() {
        if (target < MAX) {
            target++;
        }
    }

    void decrease() {
        if (target > MIN) {
            target--;
        }
    }

    int target() {
        return target;
    }
}
```

**Explanation:** The invariant 16 ≤ target ≤ 30 is established by the constructor and preserved by both mutators, and no other code can write `target`.

</details>

### P5. Spot every problem

**Difficulty:** Hard · **Type:** Code analysis

```java
import java.util.List;

public class Course {
    public String code;
    protected int seats;
    private List<String> enrolled;

    public void setSeats(int seats) {
        this.seats = seats;
    }

    public List<String> getEnrolled() {
        return enrolled;
    }

    public void setEnrolled(List<String> enrolled) {
        this.enrolled = enrolled;
    }
}
```

List the encapsulation problems and propose a better public API.

<details>
<summary>Hint</summary>

Look at every way state can change without the class noticing.

</details>

<details>
<summary>Answer</summary>

**Problems:**

1. `code` is public — any code can change or blank it.
2. `seats` is protected — subclasses and the whole package can write it, and `setSeats` accepts negative values or fewer seats than enrolled students.
3. `getEnrolled` returns the internal list — callers can add students beyond capacity.
4. `setEnrolled` stores the caller's list — the caller keeps a handle to the internals, and the whole roster can be replaced, bypassing the seat check.
5. `enrolled` starts as `null`.

**Better API:** a constructor `Course(String code, int seats)` that validates both and initialises an empty list; `final` code; `boolean enroll(String studentId)` that rejects duplicates and full courses; `void drop(String studentId)`; `int availableSeats()`; and `List<String> enrolled()` returning `List.copyOf(...)`.

</details>
