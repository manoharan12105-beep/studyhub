# Heap Sort — Practice

### P1. Which statement about heap sort is true?

**Difficulty:** Easy · **Pattern:** Properties

- A) It is stable because heaps preserve insertion order
- B) It needs O(n) extra memory
- C) It is O(n log n) in the worst case and uses O(1) extra space
- D) It runs in O(n) on already sorted input

<details>
<summary>Hint</summary>

Which sorts combine in-place and guaranteed n log n?

</details>

<details>
<summary>Answer</summary>

**Answer:** C) It is O(n log n) in the worst case and uses O(1) extra space

**Explanation:** Heap sort works inside the array (O(1) extra) and every extraction is O(log n). It is not stable (the root swap jumps elements over equal keys) and not adaptive.

</details>

### P2. Sort in descending order in place

**Difficulty:** Medium · **Pattern:** Min-heap variant

Modify heap sort to sort an `int[]` in **descending** order in place.

**Constraints:** 1 ≤ n ≤ 10⁵.

Example: `[3, 9, 1, 7]` → `[9, 7, 3, 1]`.

<details>
<summary>Hint</summary>

The element moved to the end of the array in each step should be the **minimum**, so build a min-heap.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.Arrays;

public class HeapSortDescending {

    static void sortDescending(int[] arr) {
        int n = arr.length;
        for (int i = n / 2 - 1; i >= 0; i--) siftDown(arr, i, n);
        for (int end = n - 1; end > 0; end--) {
            int t = arr[0]; arr[0] = arr[end]; arr[end] = t;   // current minimum goes to the end
            siftDown(arr, 0, end);
        }
    }

    static void siftDown(int[] arr, int i, int size) {      // min-heap version
        while (true) {
            int l = 2 * i + 1, r = l + 1, smallest = i;
            if (l < size && arr[l] < arr[smallest]) smallest = l;
            if (r < size && arr[r] < arr[smallest]) smallest = r;
            if (smallest == i) return;
            int t = arr[i]; arr[i] = arr[smallest]; arr[smallest] = t;
            i = smallest;
        }
    }

    public static void main(String[] args) {
        int[] a = {3, 9, 1, 7};
        sortDescending(a);
        System.out.println(Arrays.toString(a));
    }
}
```

**Output:**

```text
[9, 7, 3, 1]
```

**Complexity:** O(n log n) time, O(1) space.

</details>

### P3. Top k largest with partial heap sort

**Difficulty:** Medium · **Pattern:** Build once, extract k times

Return the k largest elements in descending order by building a max-heap in place and extracting only k times. Compare the cost with a full sort and with a size-k min-heap.

**Constraints:** 1 ≤ k ≤ n ≤ 10⁶.

Example: `[5, 12, 11, -1, 12, 3]`, k = 3 → `[12, 12, 11]`.

<details>
<summary>Hint</summary>

After the heapify, each extraction places the next largest value at the end of the array.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.Arrays;

public class PartialHeapSort {

    static int[] topK(int[] input, int k) {
        int[] arr = input.clone();
        int n = arr.length;
        for (int i = n / 2 - 1; i >= 0; i--) siftDown(arr, i, n);    // O(n)
        int[] result = new int[k];
        for (int t = 0; t < k; t++) {                                  // k × O(log n)
            int end = n - 1 - t;
            result[t] = arr[0];
            arr[0] = arr[end];
            siftDown(arr, 0, end);
        }
        return result;
    }

    static void siftDown(int[] arr, int i, int size) {
        while (true) {
            int l = 2 * i + 1, r = l + 1, largest = i;
            if (l < size && arr[l] > arr[largest]) largest = l;
            if (r < size && arr[r] > arr[largest]) largest = r;
            if (largest == i) return;
            int tmp = arr[i]; arr[i] = arr[largest]; arr[largest] = tmp;
            i = largest;
        }
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(topK(new int[] {5, 12, 11, -1, 12, 3}, 3)));
    }
}
```

**Output:**

```text
[12, 12, 11]
```

**Complexity:** O(n + k log n) time, O(n) for the copy. Full sort: O(n log n). Size-k min-heap: O(n log k) time but only O(k) memory and works on streams — prefer it when the data does not fit in memory or arrives over time.

</details>
