# Recursion — Practice

### P1. Reverse a string recursively

**Difficulty:** Easy · **Pattern:** Two indices moving inward

Reverse a `char[]` in place using recursion (no loops).

**Constraints:** 0 ≤ n ≤ 10⁴.

Example: `['h','e','l','l','o']` → `['o','l','l','e','h']`.

<details>
<summary>Hint</summary>

Swap the two ends, then reverse the inside. Base case: the indices meet or cross.

</details>

<details>
<summary>Answer</summary>

```java
public class ReverseRecursive {

    static void reverse(char[] s, int left, int right) {
        if (left >= right) return;
        char temp = s[left];
        s[left] = s[right];
        s[right] = temp;
        reverse(s, left + 1, right - 1);
    }

    public static void main(String[] args) {
        char[] s = "hello".toCharArray();
        reverse(s, 0, s.length - 1);
        System.out.println(new String(s));
    }
}
```

**Output:**

```text
olleh
```

**Complexity:** O(n) time, O(n) stack space (n/2 frames) — the iterative loop is O(1) space.

</details>

### P2. Tower of Hanoi

**Difficulty:** Medium · **Pattern:** Trust the smaller problem

Move n disks from peg A to peg C using peg B. Only one disk moves at a time, and a larger disk may never sit on a smaller one. Print the moves and return their count.

**Constraints:** 1 ≤ n ≤ 20.

<details>
<summary>Hint</summary>

To move n disks A → C: move the top n − 1 disks A → B (using C), move the largest disk A → C, then move the n − 1 disks B → C (using A).

</details>

<details>
<summary>Answer</summary>

**Approach:** The leap of faith — assume `hanoi(n − 1, …)` correctly moves a tower of n − 1 disks. The count satisfies T(n) = 2T(n − 1) + 1, so T(n) = 2ⁿ − 1, which is also the minimum possible.

```java
public class TowerOfHanoi {

    static int hanoi(int n, char from, char to, char via, StringBuilder moves) {
        if (n == 0) return 0;
        int count = hanoi(n - 1, from, via, to, moves);
        moves.append(from).append("->").append(to).append(' ');
        count++;
        count += hanoi(n - 1, via, to, from, moves);
        return count;
    }

    public static void main(String[] args) {
        StringBuilder moves = new StringBuilder();
        int count = hanoi(3, 'A', 'C', 'B', moves);
        System.out.println(moves.toString().trim());
        System.out.println(count + " moves; n=10 needs " + hanoi(10, 'A', 'C', 'B', new StringBuilder()));
    }
}
```

**Output:**

```text
A->C A->B C->B A->C B->A B->C A->C
7 moves; n=10 needs 1023
```

**Complexity:** O(2ⁿ) time (output size), O(n) stack depth.

</details>

### P3. Binary strings without consecutive ones

**Difficulty:** Medium · **Pattern:** Recursion with a constraint on the last choice

Generate all binary strings of length n that contain no two consecutive '1's, in lexicographic order.

**Constraints:** 1 ≤ n ≤ 20.

Example: n = 3 → `000 001 010 100 101`.

<details>
<summary>Hint</summary>

At each position you can always place '0'; you can place '1' only if the previous character is not '1'. Pass the previous character down.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class NoConsecutiveOnes {

    static void generate(int n, StringBuilder current, List<String> out) {
        if (current.length() == n) {
            out.add(current.toString());
            return;
        }
        current.append('0');
        generate(n, current, out);
        current.deleteCharAt(current.length() - 1);
        if (current.length() == 0 || current.charAt(current.length() - 1) != '1') {
            current.append('1');
            generate(n, current, out);
            current.deleteCharAt(current.length() - 1);
        }
    }

    public static void main(String[] args) {
        List<String> out = new ArrayList<>();
        generate(3, new StringBuilder(), out);
        System.out.println(out + " count=" + out.size());
        List<String> four = new ArrayList<>();
        generate(4, new StringBuilder(), four);
        System.out.println("n=4 count=" + four.size());
    }
}
```

**Output:**

```text
[000, 001, 010, 100, 101] count=5
n=4 count=8
```

**Complexity:** The number of valid strings is F(n + 2) (Fibonacci: 5, 8, 13, …), and each costs O(n) to copy, so O(n × F(n + 2)) time; O(n) stack depth.

</details>

### P4. Josephus problem

**Difficulty:** Medium · **Pattern:** Recurrence on a smaller circle

n people stand in a circle numbered 0..n − 1. Starting from person 0, every k-th person is eliminated until one remains. Return the survivor's number.

**Constraints:** 1 ≤ n, k ≤ 10⁴.

Example: n = 5, k = 2 → eliminated 1, 3, 0, 4 → survivor `2`.

<details>
<summary>Hint</summary>

After the first elimination (person k − 1), the circle has n − 1 people and starts at person k. If you know the survivor's position J(n − 1) in that smaller circle, shift it by k.

</details>

<details>
<summary>Answer</summary>

**Approach:** Simulating with a list costs O(n²) (removals) or O(n × k). The recurrence J(1) = 0, J(n) = (J(n − 1) + k) mod n renumbers the smaller circle back into the original numbering.

```java
public class Josephus {

    static int survivor(int n, int k) {
        if (n == 1) return 0;
        return (survivor(n - 1, k) + k) % n;
    }

    public static void main(String[] args) {
        System.out.println(survivor(5, 2) + " " + survivor(7, 3) + " " + survivor(1, 9));
    }
}
```

**Output:**

```text
2 3 0
```

**Complexity:** O(n) time, O(n) stack (a loop computes the same recurrence in O(1) space).

</details>
