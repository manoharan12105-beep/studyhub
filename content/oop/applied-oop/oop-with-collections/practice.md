# OOP with Collections — Practice

### P1. Which method does each use?

**Difficulty:** Easy · **Type:** MCQ

Which method does `TreeSet.add` use to decide whether an element is already present?

- A) `equals`
- B) `hashCode`
- C) `compareTo` or the comparator's `compare`
- D) `==`

<details>
<summary>Answer</summary>

**Answer:** C) `compareTo` or the comparator's `compare`

**Explanation:** Sorted collections rely solely on the ordering; a result of 0 means "already present".

</details>

### P2. Natural order

**Difficulty:** Easy · **Type:** Coding

Make `Version` (fields `major`, `minor`) sortable in its natural order: by major, then minor.

<details>
<summary>Answer</summary>

```java
final class Version implements Comparable<Version> {
    private final int major;
    private final int minor;

    Version(int major, int minor) {
        this.major = major;
        this.minor = minor;
    }

    @Override
    public int compareTo(Version other) {
        int byMajor = Integer.compare(major, other.major);
        return byMajor != 0 ? byMajor : Integer.compare(minor, other.minor);
    }
}
```

**Explanation:** Compare the most significant field first and fall through to the next only on a tie. For full consistency, also override `equals`/`hashCode` on the same two fields.

</details>

### P3. Leaderboard bug

**Difficulty:** Medium · **Type:** Output-based

```java
import java.util.Comparator;
import java.util.TreeMap;

public class Leaderboard {

    record Player(String name, int score) { }

    public static void main(String[] args) {
        TreeMap<Player, String> board = new TreeMap<>(Comparator.comparingInt(Player::score).reversed());
        board.put(new Player("Ram", 300), "gold");
        board.put(new Player("Sam", 250), "silver");
        board.put(new Player("Tom", 300), "bronze");
        System.out.println(board.size() + " " + board.firstKey().name() + " " + board.firstEntry().getValue());
    }
}
```

<details>
<summary>Hint</summary>

When `TreeMap.put` finds a key that compares as 0, what does it keep — the old key or the new one?

</details>

<details>
<summary>Answer</summary>

**Output:**

```text
2 Ram bronze
```

**Explanation:** `Tom` compares equal to `Ram` (same score), so `put` treats it as the same key: the existing key object `Ram` is kept and its value is replaced with `"bronze"`. Add a tie-breaker (`.thenComparing(Player::name)`).

</details>

### P4. Mutation inside a HashSet

**Difficulty:** Hard · **Type:** Output-based

```java
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

public class MutateInSet {

    static class Badge {
        String code;

        Badge(String code) {
            this.code = code;
        }

        @Override
        public boolean equals(Object o) {
            return o instanceof Badge && ((Badge) o).code.equals(code);
        }

        @Override
        public int hashCode() {
            return Objects.hash(code);
        }
    }

    public static void main(String[] args) {
        Set<Badge> badges = new HashSet<>();
        Badge b = new Badge("GOLD");
        badges.add(b);
        b.code = "SILVER";
        badges.add(new Badge("SILVER"));
        System.out.println(badges.size() + " " + badges.contains(b));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
2 true
```

**Explanation:** After the mutation, `b` still sits in the "GOLD" bucket. Adding a new "SILVER" badge goes to the "SILVER" bucket and finds nothing there, so the set now holds two badges that are equal to each other. `contains(b)` hashes "SILVER" and finds the newly added badge, which `equals` `b`, so it returns `true` — by accident.

</details>
