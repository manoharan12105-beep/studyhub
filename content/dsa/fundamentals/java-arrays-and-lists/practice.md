# Java Toolkit: Arrays, ArrayList and LinkedList — Practice

### P1. What does this print?

**Difficulty:** Easy · **Pattern:** Output prediction

```java
List<Integer> list = new ArrayList<>(List.of(5, 6, 7));
list.remove(2);
System.out.println(list);
```

- A) [5, 6, 7]
- B) [5, 6]
- C) [5, 7]
- D) [6, 7]

<details>
<summary>Hint</summary>

Which `remove` overload does an `int` literal pick?

</details>

<details>
<summary>Answer</summary>

**Answer:** B) [5, 6]

**Explanation:** `remove(2)` matches `remove(int index)` and removes the element at index 2, which is 7.

</details>

### P2. What is the time complexity of this loop over an `ArrayList` of n elements?

**Difficulty:** Easy · **Pattern:** Hidden cost

```java
while (!list.isEmpty()) {
    process(list.remove(0));
}
```

- A) O(n)
- B) O(n log n)
- C) O(n²)
- D) O(1)

<details>
<summary>Hint</summary>

What happens to the remaining elements when index 0 is removed?

</details>

<details>
<summary>Answer</summary>

**Answer:** C) O(n²)

**Explanation:** Each `remove(0)` shifts all remaining elements left: (n − 1) + (n − 2) + … ≈ n²/2. Use `ArrayDeque.poll()` (O(1)) for queue behaviour.

</details>

### P3. What does this print?

**Difficulty:** Medium · **Pattern:** Integer cache

```java
List<Integer> a = List.of(100, 200);
List<Integer> b = List.of(100, 200);
System.out.println((a.get(0) == b.get(0)) + " " + (a.get(1) == b.get(1)));
```

- A) true true
- B) true false
- C) false false
- D) false true

<details>
<summary>Hint</summary>

Autoboxing uses `Integer.valueOf`, which caches a range of values.

</details>

<details>
<summary>Answer</summary>

**Answer:** B) true false

**Explanation:** 100 is in the cache (−128 to 127), so both lists hold the same object. 200 is not cached, so two different objects are compared by reference. Always compare boxed numbers with `equals` (or unbox to `int`).

</details>

### P4. You need to sort an `int[]` in descending order. Which approach compiles and works?

**Difficulty:** Medium · **Pattern:** Sorting primitives

- A) `Arrays.sort(arr, Collections.reverseOrder());`
- B) `Arrays.sort(arr); reverse the array in place with two pointers`
- C) `Arrays.sort(arr, (x, y) -> y - x);`
- D) `Collections.sort(arr);`

<details>
<summary>Hint</summary>

Comparators work on objects, not primitives.

</details>

<details>
<summary>Answer</summary>

**Answer:** B) Sort ascending, then reverse in place

**Explanation:** A and C do not compile — there is no `Arrays.sort(int[], Comparator)`. D does not compile because `Collections.sort` takes a `List`. Sorting ascending and reversing is O(n log n) and avoids boxing. (Alternatively box into `Integer[]` and use `Collections.reverseOrder()`.)

</details>

### P5. Implement `removeDuplicatesKeepOrder(List<Integer> list)` that returns a new list with duplicates removed, keeping first occurrences in order, in O(n) expected time.

**Difficulty:** Medium · **Pattern:** List + hash set

<details>
<summary>Hint</summary>

`list.contains` in the loop would make it O(n²). Track what you have seen in a set.

</details>

<details>
<summary>Answer</summary>

**Approach:** One pass with a `HashSet` of seen values; append each value the first time it appears.

```java
import java.util.*;

public class RemoveDuplicates {

    static List<Integer> removeDuplicatesKeepOrder(List<Integer> list) {
        Set<Integer> seen = new HashSet<>();
        List<Integer> result = new ArrayList<>();
        for (int value : list) {
            if (seen.add(value)) {          // add returns false if already present
                result.add(value);
            }
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(removeDuplicatesKeepOrder(List.of(4, 2, 4, 1, 2, 9)));
        System.out.println(removeDuplicatesKeepOrder(List.of()));
    }
}
```

**Output:**

```text
[4, 2, 1, 9]
[]
```

**Complexity:** O(n) expected time, O(n) space. (`new ArrayList<>(new LinkedHashSet<>(list))` does the same in one line.)

</details>

### P6. Rotate an `int[]` right by k positions in place (O(1) extra space). Example: `[1,2,3,4,5,6,7]`, k = 3 → `[5,6,7,1,2,3,4]`.

**Difficulty:** Hard · **Pattern:** Reversal trick

<details>
<summary>Hint</summary>

Reverse the whole array, then reverse the first k and the remaining n − k elements. Handle k ≥ n.

</details>

<details>
<summary>Answer</summary>

**Approach:** Reversing everything puts the last k elements at the front but backwards; reversing each part fixes their order.

```java
import java.util.Arrays;

public class RotateRight {

    static void rotate(int[] arr, int k) {
        int n = arr.length;
        if (n == 0) {
            return;
        }
        k %= n;                          // rotating by n changes nothing
        reverse(arr, 0, n - 1);
        reverse(arr, 0, k - 1);
        reverse(arr, k, n - 1);
    }

    static void reverse(int[] arr, int left, int right) {
        while (left < right) {
            int temp = arr[left];
            arr[left] = arr[right];
            arr[right] = temp;
            left++;
            right--;
        }
    }

    public static void main(String[] args) {
        int[] a = {1, 2, 3, 4, 5, 6, 7};
        rotate(a, 3);
        System.out.println(Arrays.toString(a));
        int[] b = {1, 2};
        rotate(b, 5);
        System.out.println(Arrays.toString(b));
    }
}
```

**Output:**

```text
[5, 6, 7, 1, 2, 3, 4]
[2, 1]
```

**Complexity:** O(n) time, O(1) extra space. Rotation is covered in depth in [Arrays](../../data-structures/arrays/content.md).

</details>
