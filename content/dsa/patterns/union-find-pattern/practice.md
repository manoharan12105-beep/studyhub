# Union-Find Pattern — Practice

### P1. Satisfiable equality equations

**Difficulty:** Medium · **Pattern:** Union the equalities, check the inequalities

Each equation is a 4-character string `"a==b"` or `"a!=b"` over lowercase variables. Return whether all equations can hold at once.

**Constraints:** 1 ≤ equations ≤ 500.

Example: `["a==b", "b!=a"]` → `false`; `["a==b", "b==c", "a==c"]` → `true`; `["a==b", "b!=c", "c==a"]` → `false`.

<details>
<summary>Hint</summary>

Equality is transitive, so first union every `==` pair (26 nodes). Then an inequality `x != y` fails exactly when x and y ended in the same group. Processing in input order would miss equalities that appear later.

</details>

<details>
<summary>Answer</summary>

```java
public class EqualityEquations {

    static int[] parent = new int[26];

    static int find(int x) {
        while (parent[x] != x) x = parent[x] = parent[parent[x]];
        return x;
    }

    static boolean equationsPossible(String[] equations) {
        for (int i = 0; i < 26; i++) parent[i] = i;
        for (String e : equations)
            if (e.charAt(1) == '=') parent[find(e.charAt(0) - 'a')] = find(e.charAt(3) - 'a');
        for (String e : equations)
            if (e.charAt(1) == '!' && find(e.charAt(0) - 'a') == find(e.charAt(3) - 'a')) return false;
        return true;
    }

    public static void main(String[] args) {
        System.out.println(equationsPossible(new String[] {"a==b", "b!=a"}) + " " + equationsPossible(new String[] {"a==b", "b==c", "a==c"}) + " "
                + equationsPossible(new String[] {"a==b", "b!=c", "c==a"}) + " " + equationsPossible(new String[] {"a!=a"}));
    }
}
```

**Output:**

```text
false true false false
```

**Complexity:** O(E × α(26)) ≈ O(E) time, O(1) space (26 parents).

</details>

### P2. Smallest string with allowed swaps

**Difficulty:** Medium · **Pattern:** Components of swappable positions, sort each component

`pairs[i] = [a, b]` means positions a and b of `s` may be swapped, any number of times. Return the lexicographically smallest string obtainable.

**Constraints:** 1 ≤ |s| ≤ 10⁵; 0 ≤ pairs ≤ 10⁵.

Example: `"dcab"`, `[[0, 3], [1, 2]]` → `"bacd"`; `"dcab"`, `[[0, 3], [1, 2], [0, 2]]` → `"abcd"`.

<details>
<summary>Hint</summary>

Swaps compose: within a connected group of positions, any permutation is reachable. Union the pairs; for each group, sort its characters and place them into its sorted positions.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class SmallestStringWithSwaps {

    static int[] parent;

    static int find(int x) {
        while (parent[x] != x) x = parent[x] = parent[parent[x]];
        return x;
    }

    static String smallestStringWithSwaps(String s, int[][] pairs) {
        int n = s.length();
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        for (int[] p : pairs) parent[find(p[0])] = find(p[1]);
        Map<Integer, PriorityQueue<Character>> chars = new HashMap<>();   // root → its characters, smallest first
        for (int i = 0; i < n; i++) chars.computeIfAbsent(find(i), k -> new PriorityQueue<>()).add(s.charAt(i));
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) sb.append(chars.get(find(i)).poll());    // positions visited in increasing order
        return sb.toString();
    }

    public static void main(String[] args) {
        System.out.println(smallestStringWithSwaps("dcab", new int[][] {{0, 3}, {1, 2}}) + " " + smallestStringWithSwaps("dcab", new int[][] {{0, 3}, {1, 2}, {0, 2}}) + " "
                + smallestStringWithSwaps("cba", new int[][] {{0, 1}, {1, 2}}));
    }
}
```

**Output:**

```text
bacd abcd abc
```

**Complexity:** O((n + pairs) α(n) + n log n) time, O(n) space. This version uses path halving without union by size, which is O(log n) amortized per operation — still fast here.

</details>

### P3. Remove the most edges while two people can still traverse everything

**Difficulty:** Hard · **Pattern:** Two DSUs, shared edges first

An undirected graph on nodes 1 … n has edges of type 1 (Alice only), type 2 (Bob only) and type 3 (both). Return the maximum number of edges you can remove so that Alice and Bob can each still reach every node, or −1 if that is impossible even with all edges.

**Constraints:** 1 ≤ n ≤ 10⁵; 1 ≤ edges ≤ 10⁵.

Example: n = 4, edges `[[3,1,2],[3,2,3],[1,1,3],[1,2,4],[1,1,2],[2,3,4]]` → `2`; n = 4, `[[3,2,3],[1,1,2],[2,3,4]]` → `-1`.

<details>
<summary>Hint</summary>

A shared (type 3) edge serves both people, so it is never worse to use one first. Keep one DSU per person; add type-3 edges to both, then type-1 to Alice's and type-2 to Bob's. Every edge whose union fails is removable. At the end both DSUs must have one component.

</details>

<details>
<summary>Answer</summary>

**Approach:** Each person needs a spanning tree (n − 1 edges). Taking shared edges first minimises the number of kept edges, because one shared edge replaces two private ones.

```java
public class MaxRemovableEdges {

    static int find(int[] p, int x) {
        while (p[x] != x) x = p[x] = p[p[x]];
        return x;
    }

    static boolean union(int[] p, int a, int b) {
        int ra = find(p, a), rb = find(p, b);
        if (ra == rb) return false;
        p[ra] = rb;
        return true;
    }

    static int maxNumEdgesToRemove(int n, int[][] edges) {
        int[] alice = new int[n + 1], bob = new int[n + 1];
        for (int i = 0; i <= n; i++) alice[i] = bob[i] = i;
        int kept = 0, aliceEdges = 0, bobEdges = 0;
        for (int[] e : edges) {
            if (e[0] != 3) continue;
            boolean a = union(alice, e[1], e[2]), b = union(bob, e[1], e[2]);
            if (a || b) kept++;                                   // useful to at least one person
            if (a) aliceEdges++;
            if (b) bobEdges++;
        }
        for (int[] e : edges) {
            if (e[0] == 1 && union(alice, e[1], e[2])) { kept++; aliceEdges++; }
            if (e[0] == 2 && union(bob, e[1], e[2])) { kept++; bobEdges++; }
        }
        if (aliceEdges != n - 1 || bobEdges != n - 1) return -1;  // someone cannot reach everything
        return edges.length - kept;
    }

    public static void main(String[] args) {
        System.out.println(maxNumEdgesToRemove(4, new int[][] {{3, 1, 2}, {3, 2, 3}, {1, 1, 3}, {1, 2, 4}, {1, 1, 2}, {2, 3, 4}}) + " "
                + maxNumEdgesToRemove(4, new int[][] {{3, 1, 2}, {3, 2, 3}, {1, 1, 4}, {2, 1, 4}}) + " " + maxNumEdgesToRemove(4, new int[][] {{3, 2, 3}, {1, 1, 2}, {2, 3, 4}}));
    }
}
```

**Output:**

```text
2 0 -1
```

**Complexity:** O(E × α(n)) time (O(E log n) with path halving only), O(n) space.

</details>
