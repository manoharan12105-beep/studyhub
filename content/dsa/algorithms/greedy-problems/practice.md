# Greedy Problems — Practice

### P1. Can one person attend all meetings?

**Difficulty:** Easy · **Pattern:** Sort by start, check neighbours

Given meeting intervals [start, end), return `true` if no two overlap.

**Constraints:** 0 ≤ n ≤ 10⁴.

Example: `[[0,30],[5,10],[15,20]]` → `false`; `[[7,10],[2,4]]` → `true`.

<details>
<summary>Hint</summary>

After sorting by start, only adjacent meetings can be the first overlapping pair.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class MeetingRoomsOne {

    static boolean canAttendAll(int[][] meetings) {
        int[][] s = meetings.clone();
        Arrays.sort(s, Comparator.comparingInt(a -> a[0]));
        for (int i = 1; i < s.length; i++) {
            if (s[i][0] < s[i - 1][1]) return false;      // starts before the previous one ends
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(canAttendAll(new int[][] {{0, 30}, {5, 10}, {15, 20}}) + " " + canAttendAll(new int[][] {{7, 10}, {2, 4}}));
    }
}
```

**Output:**

```text
false true
```

**Complexity:** O(n log n) time, O(n) space for the copy.

</details>

### P2. Partition labels

**Difficulty:** Medium · **Pattern:** Extend the current part to the last occurrence

Split a lowercase string into as many parts as possible so that each letter appears in at most one part. Return the part sizes.

**Constraints:** 1 ≤ n ≤ 500.

Example: `"ababcbacadefegdehijhklij"` → `[9, 7, 8]`.

<details>
<summary>Hint</summary>

Record the last index of each letter. Scan, extending the current part's end to the last occurrence of every letter seen; when the scan index reaches that end, close the part.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class PartitionLabels {

    static List<Integer> partition(String s) {
        int[] last = new int[26];
        for (int i = 0; i < s.length(); i++) last[s.charAt(i) - 'a'] = i;
        List<Integer> sizes = new ArrayList<>();
        int start = 0, end = 0;
        for (int i = 0; i < s.length(); i++) {
            end = Math.max(end, last[s.charAt(i) - 'a']);
            if (i == end) {                              // every letter so far ends inside this part
                sizes.add(end - start + 1);
                start = i + 1;
            }
        }
        return sizes;
    }

    public static void main(String[] args) {
        System.out.println(partition("ababcbacadefegdehijhklij") + " " + partition("eccbbbbdec"));
    }
}
```

**Output:**

```text
[9, 7, 8] [10]
```

**Complexity:** O(n) time, O(1) space (26 letters).

</details>

### P3. Minimum number of meeting rooms

**Difficulty:** Medium · **Pattern:** Min-heap of end times

Given meeting intervals [start, end), return the minimum number of rooms required.

**Constraints:** 1 ≤ n ≤ 10⁴.

Example: `[[0,30],[5,10],[15,20]]` → `2`.

<details>
<summary>Hint</summary>

Process meetings by start time. A min-heap holds the end times of rooms in use; if the earliest-ending room is free by the time the next meeting starts, reuse it.

</details>

<details>
<summary>Answer</summary>

**Approach:** Equivalent to minimum platforms; the heap version reports how many rooms are open at once.

```java
import java.util.*;

public class MeetingRoomsTwo {

    static int minRooms(int[][] meetings) {
        int[][] s = meetings.clone();
        Arrays.sort(s, Comparator.comparingInt(a -> a[0]));
        PriorityQueue<Integer> endTimes = new PriorityQueue<>();
        for (int[] m : s) {
            if (!endTimes.isEmpty() && endTimes.peek() <= m[0]) {
                endTimes.poll();                      // that room is free again: reuse it
            }
            endTimes.offer(m[1]);
        }
        return endTimes.size();
    }

    public static void main(String[] args) {
        System.out.println(minRooms(new int[][] {{0, 30}, {5, 10}, {15, 20}}) + " " + minRooms(new int[][] {{1, 5}, {2, 6}, {3, 7}, {6, 8}}));
    }
}
```

**Output:**

```text
2 3
```

**Complexity:** O(n log n) time, O(n) space.

</details>

### P4. Minimum refuelling stops

**Difficulty:** Hard · **Pattern:** Greedy with a max-heap of skipped options

A car starts with `startFuel` litres and must travel `target` km (1 litre per km). Stations `[position, fuel]` are sorted by position. Return the minimum number of stops to reach the target, or −1.

**Constraints:** 0 ≤ stations ≤ 500; values up to 10⁹.

Example: target 100, startFuel 10, stations `[[10,60],[20,30],[30,30],[60,40]]` → `2` (refuel at 10 and 60).

<details>
<summary>Hint</summary>

Drive as far as possible. Whenever you cannot reach the next point, refuel retroactively at the best (largest-fuel) station you already passed — a max-heap of passed stations.

</details>

<details>
<summary>Answer</summary>

**Approach:** Deciding at each station is hard; deciding **only when stuck** is easy: the best fix is the largest fuel amount among passed stations (exchange argument — any solution using a smaller one could swap it for the larger one).

```java
import java.util.*;

public class MinRefuelStops {

    static int minStops(int target, int startFuel, int[][] stations) {
        PriorityQueue<Integer> passed = new PriorityQueue<>(Comparator.reverseOrder());
        long reach = startFuel;
        int stops = 0, i = 0;
        while (reach < target) {
            while (i < stations.length && stations[i][0] <= reach) {
                passed.offer(stations[i++][1]);       // stations we could have stopped at
            }
            if (passed.isEmpty()) return -1;          // stuck with no fuel options
            reach += passed.poll();                   // refuel at the best one passed
            stops++;
        }
        return stops;
    }

    public static void main(String[] args) {
        System.out.println(minStops(100, 10, new int[][] {{10, 60}, {20, 30}, {30, 30}, {60, 40}}) + " "
                + minStops(100, 1, new int[][] {{10, 100}}) + " " + minStops(1, 1, new int[][] {}));
    }
}
```

**Output:**

```text
2 -1 0
```

**Complexity:** O(n log n) time, O(n) space.

</details>
