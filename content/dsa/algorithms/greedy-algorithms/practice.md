# Greedy Algorithms — Practice

### P1. Assign cookies

**Difficulty:** Easy · **Pattern:** Sort both, match smallest sufficient

Child i is content with a cookie of size ≥ `greed[i]`; each child gets at most one cookie. Maximise the number of content children.

**Constraints:** 1 ≤ children, cookies ≤ 3 × 10⁴.

Example: greed `[1, 2, 3]`, cookies `[1, 1]` → `1`; greed `[1, 2]`, cookies `[1, 2, 3]` → `2`.

<details>
<summary>Hint</summary>

Give each cookie to the least greedy child it can satisfy; never waste a big cookie on a child a smaller cookie could satisfy.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.Arrays;

public class AssignCookies {

    static int findContent(int[] greed, int[] cookies) {
        Arrays.sort(greed);
        Arrays.sort(cookies);
        int child = 0;
        for (int c = 0; c < cookies.length && child < greed.length; c++) {
            if (cookies[c] >= greed[child]) child++;      // satisfies the least greedy unsatisfied child
        }
        return child;
    }

    public static void main(String[] args) {
        System.out.println(findContent(new int[] {1, 2, 3}, new int[] {1, 1}) + " " + findContent(new int[] {1, 2}, new int[] {1, 2, 3}));
    }
}
```

**Output:**

```text
1 2
```

**Complexity:** O(n log n + m log m) time, O(1) extra space besides sorting.

</details>

### P2. For which coin set does the "largest coin first" greedy fail to give the minimum number of coins for some amount?

**Difficulty:** Easy · **Pattern:** Counterexample for greedy

- A) {1, 2, 5, 10}
- B) {1, 5, 10, 25}
- C) {1, 3, 4}
- D) {1, 2, 4, 8}

<details>
<summary>Hint</summary>

Try small amounts such as 6.

</details>

<details>
<summary>Answer</summary>

**Answer:** C) {1, 3, 4}

**Explanation:** For 6, greedy takes 4 + 1 + 1 = 3 coins, but 3 + 3 = 2 coins. The other sets are **canonical** (greedy is always optimal for them). For arbitrary coin sets use DP — see [Knapsack DP](../knapsack-dp/content.md).

</details>

### P3. Boats to save people

**Difficulty:** Medium · **Pattern:** Sort + two pointers

Each boat carries at most two people with total weight ≤ `limit`. Return the minimum number of boats.

**Constraints:** 1 ≤ n ≤ 5 × 10⁴; every weight ≤ limit.

Example: `[3, 2, 2, 1]`, limit 3 → `3`.

<details>
<summary>Hint</summary>

The heaviest person must take a boat. Pair them with the lightest person if that fits; otherwise they go alone.

</details>

<details>
<summary>Answer</summary>

**Approach:** Exchange argument: if the heaviest can share with anyone, sharing with the lightest is never worse (the lightest is the easiest to pair). Two pointers after sorting.

```java
import java.util.Arrays;

public class BoatsToSave {

    static int numBoats(int[] people, int limit) {
        Arrays.sort(people);
        int light = 0, heavy = people.length - 1, boats = 0;
        while (light <= heavy) {
            if (people[light] + people[heavy] <= limit) light++;   // lightest rides along
            heavy--;                                               // heaviest always leaves
            boats++;
        }
        return boats;
    }

    public static void main(String[] args) {
        System.out.println(numBoats(new int[] {3, 2, 2, 1}, 3) + " " + numBoats(new int[] {3, 5, 3, 4}, 5) + " " + numBoats(new int[] {1, 2}, 3));
    }
}
```

**Output:**

```text
3 4 1
```

**Complexity:** O(n log n) time, O(1) extra space.

</details>

### P4. Candy distribution

**Difficulty:** Hard · **Pattern:** Two greedy passes

Children stand in a line with ratings. Each child gets at least one candy, and a child with a higher rating than an immediate neighbour must get more candies than that neighbour. Return the minimum total.

**Constraints:** 1 ≤ n ≤ 2 × 10⁴.

Example: `[1, 0, 2]` → `5` (2, 1, 2); `[1, 2, 2]` → `4` (1, 2, 1).

<details>
<summary>Hint</summary>

Satisfy the left-neighbour rule with a left-to-right pass, then the right-neighbour rule with a right-to-left pass, taking the max so the first rule stays satisfied.

</details>

<details>
<summary>Answer</summary>

**Approach:** Each pass assigns the minimum required by one side; taking the maximum of both requirements gives the minimum that satisfies both.

```java
public class Candy {

    static int candy(int[] ratings) {
        int n = ratings.length;
        int[] candies = new int[n];
        java.util.Arrays.fill(candies, 1);
        for (int i = 1; i < n; i++) {
            if (ratings[i] > ratings[i - 1]) candies[i] = candies[i - 1] + 1;
        }
        for (int i = n - 2; i >= 0; i--) {
            if (ratings[i] > ratings[i + 1]) candies[i] = Math.max(candies[i], candies[i + 1] + 1);
        }
        int total = 0;
        for (int c : candies) total += c;
        return total;
    }

    public static void main(String[] args) {
        System.out.println(candy(new int[] {1, 0, 2}) + " " + candy(new int[] {1, 2, 2}) + " " + candy(new int[] {1, 3, 4, 5, 2}));
    }
}
```

**Output:**

```text
5 4 11
```

**Complexity:** O(n) time, O(n) space.

</details>
