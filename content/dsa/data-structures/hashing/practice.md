# Hashing — Practice

### P1. Contains duplicate

**Difficulty:** Easy · **Pattern:** Hash set membership

Return `true` if any value appears at least twice in the array.

**Constraints:** 1 ≤ n ≤ 10⁵.

Example: `[1, 2, 3, 1]` → `true`; `[1, 2, 3, 4]` → `false`.

<details>
<summary>Hint</summary>

Brute force compares all pairs (O(n²)). Sorting brings duplicates together (O(n log n)). A set answers "seen before?" in O(1) average.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class ContainsDuplicate {

    static boolean containsDuplicate(int[] arr) {
        Set<Integer> seen = new HashSet<>();
        for (int value : arr) {
            if (!seen.add(value)) {          // add returns false if already present
                return true;
            }
        }
        return false;
    }

    public static void main(String[] args) {
        System.out.println(containsDuplicate(new int[] {1, 2, 3, 1}) + " " + containsDuplicate(new int[] {1, 2, 3, 4}));
    }
}
```

**Output:**

```text
true false
```

**Complexity:** O(n) average time, O(n) space. Trade-off: the sorting approach uses O(1)–O(log n) extra space but O(n log n) time and mutates the input.

</details>

### P2. Ransom note

**Difficulty:** Easy · **Pattern:** Frequency counting

Can `note` be built from the letters of `magazine`, using each letter of the magazine at most once?

**Constraints:** 1 ≤ lengths ≤ 10⁵, lowercase letters.

Example: note `"aab"`, magazine `"baa"` → `true`; note `"aa"`, magazine `"ab"` → `false`.

<details>
<summary>Hint</summary>

Count the magazine's letters, then spend them on the note.

</details>

<details>
<summary>Answer</summary>

```java
public class RansomNote {

    static boolean canConstruct(String note, String magazine) {
        int[] available = new int[26];               // array = perfect hash for 'a'..'z'
        for (char c : magazine.toCharArray()) {
            available[c - 'a']++;
        }
        for (char c : note.toCharArray()) {
            if (--available[c - 'a'] < 0) {
                return false;
            }
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(canConstruct("aab", "baa") + " " + canConstruct("aa", "ab"));
    }
}
```

**Output:**

```text
true false
```

**Complexity:** O(m + n) time, O(1) space.

</details>

### P3. Isomorphic strings

**Difficulty:** Medium · **Pattern:** Two-way mapping

Two strings are isomorphic if the characters of `s` can be replaced to get `t`, where each character maps to exactly one character and no two characters map to the same one.

**Constraints:** 1 ≤ length ≤ 5 × 10⁴; same length; ASCII.

Example: `"egg"`, `"add"` → `true`; `"foo"`, `"bar"` → `false`; `"badc"`, `"baba"` → `false`.

<details>
<summary>Hint</summary>

A one-directional map misses the case where two different characters map to the same target. Check both directions.

</details>

<details>
<summary>Answer</summary>

**Approach:** Record the last position (+1) at which each character was seen in `s` and in `t`. At every index, both characters must have been last seen at the same position — that enforces a consistent mapping in both directions.

```java
public class Isomorphic {

    static boolean isIsomorphic(String s, String t) {
        int[] lastInS = new int[128];
        int[] lastInT = new int[128];
        for (int i = 0; i < s.length(); i++) {
            char a = s.charAt(i), b = t.charAt(i);
            if (lastInS[a] != lastInT[b]) {
                return false;
            }
            lastInS[a] = i + 1;                      // +1 so that 0 means "never seen"
            lastInT[b] = i + 1;
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(isIsomorphic("egg", "add") + " " + isIsomorphic("foo", "bar") + " " + isIsomorphic("badc", "baba") + " " + isIsomorphic("paper", "title"));
    }
}
```

**Output:**

```text
true false false true
```

**Complexity:** O(n) time, O(1) space (fixed alphabet). Two `HashMap<Character, Character>` work equally for larger alphabets.

</details>

### P4. Longest consecutive sequence

**Difficulty:** Medium · **Pattern:** Hash set + start-of-run detection

Return the length of the longest run of consecutive integers that appear in the (unsorted) array, in O(n) time.

**Constraints:** 0 ≤ n ≤ 10⁵; values fit in `int`.

Example: `[100, 4, 200, 1, 3, 2]` → `4` (1, 2, 3, 4).

<details>
<summary>Hint</summary>

Sorting gives O(n log n). With a set, only start counting at numbers x where x − 1 is **not** present — the start of a run.

</details>

<details>
<summary>Answer</summary>

**Approach:** Put all values in a set. For each value that starts a run, walk x + 1, x + 2, … while present. Each number is visited by at most one walk, so the total is O(n).

```java
import java.util.*;

public class LongestConsecutive {

    static int longestConsecutive(int[] arr) {
        Set<Integer> values = new HashSet<>();
        for (int v : arr) {
            values.add(v);
        }
        int best = 0;
        for (int v : values) {
            if (!values.contains(v - 1)) {           // v starts a run
                int length = 1;
                while (values.contains(v + length)) {
                    length++;
                }
                best = Math.max(best, length);
            }
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(longestConsecutive(new int[] {100, 4, 200, 1, 3, 2}));
        System.out.println(longestConsecutive(new int[] {0, 3, 7, 2, 5, 8, 4, 6, 0, 1}));
        System.out.println(longestConsecutive(new int[] {}));
    }
}
```

**Output:**

```text
4
9
0
```

**Complexity:** O(n) average time, O(n) space. Iterating over the set (not the array) avoids repeated walks for duplicates.

</details>

### P5. Hash set with open addressing

**Difficulty:** Hard · **Pattern:** Linear probing with tombstones

Implement `add`, `remove` and `contains` for non-negative integer keys using a single array with **linear probing** (no Java collections). Deleting must not break lookups of keys inserted later in the same probe chain. Grow the array when it becomes more than half full (counting tombstones).

**Constraints:** up to 10⁴ operations; keys 0 ≤ key ≤ 10⁶.

<details>
<summary>Hint</summary>

Use special markers: `EMPTY` (never used) and `DELETED` (tombstone). A lookup stops only at `EMPTY`; an insert may reuse the first `DELETED` it passes.

</details>

<details>
<summary>Answer</summary>

**Approach:** Slots hold a key, `EMPTY` (−1) or `DELETED` (−2). `contains` probes until it finds the key or an `EMPTY` slot. `remove` replaces the key with `DELETED` so later chains stay connected. `add` checks for the key first, then writes into the first tombstone or empty slot seen. Resizing re-inserts live keys only, clearing all tombstones.

```java
public class OpenAddressingSet {

    private static final int EMPTY = -1, DELETED = -2;
    private int[] slots = newTable(8);
    private int used = 0;                               // live keys + tombstones

    private static int[] newTable(int capacity) {
        int[] t = new int[capacity];
        java.util.Arrays.fill(t, EMPTY);
        return t;
    }

    private int home(int key, int capacity) {
        return (key * 31 + 7) % capacity;              // simple hash for non-negative keys
    }

    public boolean contains(int key) {
        int i = home(key, slots.length);
        while (slots[i] != EMPTY) {                     // tombstones do not stop the search
            if (slots[i] == key) {
                return true;
            }
            i = (i + 1) % slots.length;
        }
        return false;
    }

    public void add(int key) {
        if (contains(key)) {
            return;
        }
        if (used + 1 > slots.length / 2) {
            resize();
        }
        int i = home(key, slots.length);
        while (slots[i] != EMPTY && slots[i] != DELETED) {
            i = (i + 1) % slots.length;
        }
        if (slots[i] == EMPTY) {
            used++;                                     // reusing a tombstone does not add to used
        }
        slots[i] = key;
    }

    public void remove(int key) {
        int i = home(key, slots.length);
        while (slots[i] != EMPTY) {
            if (slots[i] == key) {
                slots[i] = DELETED;
                return;
            }
            i = (i + 1) % slots.length;
        }
    }

    private void resize() {
        int[] old = slots;
        slots = newTable(old.length * 2);
        used = 0;
        for (int key : old) {
            if (key >= 0) {
                int i = home(key, slots.length);
                while (slots[i] != EMPTY) {
                    i = (i + 1) % slots.length;
                }
                slots[i] = key;
                used++;
            }
        }
    }

    public static void main(String[] args) {
        OpenAddressingSet set = new OpenAddressingSet();
        set.add(1);
        set.add(9);                                     // 1 and 9 share a home slot in a table of 8
        set.add(17);
        set.remove(9);                                  // tombstone between 1 and 17
        System.out.println(set.contains(1) + " " + set.contains(9) + " " + set.contains(17));
        for (int k = 100; k < 120; k++) {
            set.add(k);                                 // forces several resizes
        }
        System.out.println(set.contains(17) + " " + set.contains(119) + " " + set.contains(120));
    }
}
```

**Output:**

```text
true false true
true true false
```

**Complexity:** O(1) expected per operation while the table is at most half full; resizes are O(n) but amortized O(1).

</details>
