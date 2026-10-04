# Union-Find Pattern

## What Is the Pattern

The **union-find pattern** groups items into disjoint sets that only ever **merge**. A disjoint set union (DSU) supports `union(a, b)` (merge the groups of a and b) and `find(a)` (a representative of a's group) in nearly O(1) amortized time. Use it whenever the question is "which items end up connected / equivalent" as relationships are added, especially when you also need to detect the moment a relationship is redundant.

Tiny example: relations 1–2, 3–4, 2–3. After 1–2 and 3–4 there are two groups {1, 2}, {3, 4}; after 2–3 one group. Adding 1–4 now would be redundant (already connected) — that edge would close a cycle.

The data structure (parent array, union by rank/size, path compression, complexity) is in [Disjoint Set Union](../../data-structures/disjoint-set-union/content.md); its best-known algorithmic use is [Kruskal's algorithm](../../algorithms/kruskals-algorithm/content.md).

## Why It Works

Each group is a tree of parent pointers whose root is the representative. `union` links one root under the other; `find` walks to the root. Path compression flattens the walked path and union by rank/size keeps trees shallow, giving O(α(n)) amortized per operation — effectively constant. Compared with running BFS/DFS after every new relationship (O(V + E) each), DSU answers incremental connectivity in near-constant time per relationship, and equivalence is transitive automatically.

## Recognition Clues

| Clue in the problem | Why it points here |
|---------------------|--------------------|
| "Group / merge items that share something" (emails, factors, rows/columns, letters) | union items through the shared key |
| Relationships are only **added**, with queries "are x and y connected?" in between | incremental connectivity |
| "Number of connected components / provinces / groups" as edges arrive | count successful unions |
| "Find the redundant edge", "does adding this edge create a cycle" (undirected) | `find(a) == find(b)` before union |
| "Equations": a == b and a != b constraints | union the equalities, then check the inequalities |
| Minimum spanning tree, "connect all with minimum cost" | Kruskal = sort edges + DSU |
| Swaps allowed between linked positions (any number of times) | positions in one component can be freely permuted |

## Typical Problem Structure

- Input: n items and a list of pairs/edges/equivalences, or items with attributes that imply links.
- Output: a count of groups, the groups themselves, a redundant edge, a feasibility answer, or a minimum cost.
- Items that are not integers (strings, coordinates) are mapped to indices with a `HashMap` first.

## Template

```pseudocode
parent[i] ← i; size[i] ← 1 for every item

find(x):
    while parent[x] ≠ x:
        parent[x] ← parent[parent[x]]     // path halving
        x ← parent[x]
    return x

union(a, b):
    ra ← find(a); rb ← find(b)
    if ra = rb: return false              // already connected (redundant link)
    attach the smaller tree under the larger; update size
    return true
```

## Java Template

```java
public class UnionFind {

    private final int[] parent, size;
    private int components;

    UnionFind(int n) {
        parent = new int[n];
        size = new int[n];
        components = n;
        for (int i = 0; i < n; i++) {
            parent[i] = i;
            size[i] = 1;
        }
    }

    int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];             // path halving
            x = parent[x];
        }
        return x;
    }

    boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;                    // redundant
        if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;                               // smaller tree under larger
        size[ra] += size[rb];
        components--;
        return true;
    }

    public static void main(String[] args) {
        UnionFind uf = new UnionFind(5);
        System.out.print(uf.union(1, 2) + " " + uf.union(3, 4) + " " + uf.union(2, 3) + " " + uf.union(1, 4));
        System.out.println(" components=" + uf.components);
    }
}
```

**Output:**

```text
true true true false components=2
```

## Example Problem

**Merge accounts.** Each account is a name followed by emails. Two accounts belong to the same person if they share an email (names alone do not decide it). Merge accounts and return each person's name followed by their emails in sorted order. Example: `[["John", "js@m", "jny@m"], ["John", "js@m", "j00@m"], ["Mary", "mary@m"], ["John", "jb@m"]]` → `[["John", "j00@m", "jny@m", "js@m"], ["Mary", "mary@m"], ["John", "jb@m"]]`.

- **Brute force:** compare every pair of accounts for a shared email and repeat until stable — O(n² × L) per round.
- **Observation:** "share an email" is a link; links are transitive (A shares with B, B with C → same person). Union accounts through a map from email → first account that owned it.

```java
import java.util.*;

public class AccountsMerge {

    static int[] parent;

    static int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }

    static List<List<String>> accountsMerge(List<List<String>> accounts) {
        int n = accounts.size();
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        Map<String, Integer> owner = new HashMap<>();                  // email → first account seen with it
        for (int i = 0; i < n; i++) {
            for (String email : accounts.get(i).subList(1, accounts.get(i).size())) {
                Integer j = owner.putIfAbsent(email, i);
                if (j != null) parent[find(i)] = find(j);              // shared email: same person
            }
        }
        Map<Integer, TreeSet<String>> emailsOf = new LinkedHashMap<>();  // root → sorted emails
        for (int i = 0; i < n; i++) {
            emailsOf.computeIfAbsent(find(i), k -> new TreeSet<>()).addAll(accounts.get(i).subList(1, accounts.get(i).size()));
        }
        List<List<String>> result = new ArrayList<>();
        for (Map.Entry<Integer, TreeSet<String>> e : emailsOf.entrySet()) {
            List<String> merged = new ArrayList<>();
            merged.add(accounts.get(e.getKey()).get(0));
            merged.addAll(e.getValue());
            result.add(merged);
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(accountsMerge(List.of(List.of("John", "js@m", "jny@m"), List.of("John", "js@m", "j00@m"), List.of("Mary", "mary@m"), List.of("John", "jb@m"))));
    }
}
```

**Output:**

```text
[[John, j00@m, jny@m, js@m], [Mary, mary@m], [John, jb@m]]
```

## Dry Run

| Account | Email | Owner before | Action | parent after |
|---------|-------|--------------|--------|--------------|
| 0 | js@m | — | owner[js@m] = 0 | [0, 1, 2, 3] |
| 0 | jny@m | — | owner = 0 | [0, 1, 2, 3] |
| 1 | js@m | 0 | union: parent[find(1)] = find(0) | [0, 0, 2, 3] |
| 1 | j00@m | — | owner = 1 | [0, 0, 2, 3] |
| 2 | mary@m | — | owner = 2 | [0, 0, 2, 3] |
| 3 | jb@m | — | owner = 3 | [0, 0, 2, 3] |

Roots 0, 2, 3 → three people; root 0 collects the emails of accounts 0 and 1. The two "John" accounts 0 and 3 stay separate because they share no email.

## Common Mistakes

- Uniting the items instead of their **roots** (`parent[a] = b` instead of `parent[find(a)] = find(b)`).
- Reading `parent[x]` as the representative without calling `find` (only roots are representatives).
- Forgetting union by size/rank and path compression — degenerate chains make `find` O(n).
- Using DSU for **directed** reachability (it models undirected/symmetric relations only).
- Needing to **remove** links — DSU cannot split groups (process deletions in reverse as additions, if possible).

## Variations

- **Count components:** start with n, decrement on each successful union.
- **Redundant connection / cycle detection:** the first union that returns false.
- **Kruskal's MST:** sort edges by weight, keep those whose union succeeds.
- **Equality constraints:** union all `==`, then any `!=` within one group is a contradiction.
- **Grid DSU:** cell (r, c) → index r × cols + c; "number of islands after each addition".
- **Weighted DSU:** store a ratio/offset to the parent (evaluate division, parity constraints).
- **Offline reverse processing:** turn deletions into additions by processing queries backwards.

## Complexity

| Operation | Time |
|-----------|------|
| `find` / `union` with both optimisations | O(α(n)) amortized — at most 4–5 for any practical n |
| With path compression only | O(log n) amortized |
| No optimisations | O(n) worst case per operation |
| Space | O(n) |

## When Not to Use It

- Shortest paths or distances — use BFS/Dijkstra.
- Directed relationships ("A depends on B") — topological sort / SCC.
- Relationships that are removed over time (online) — DSU cannot undo merges cheaply.
- One static connectivity question on a small graph — a single BFS/DFS is just as simple.

## Key Takeaways

- Merge-only grouping + "same group?" queries → union-find.
- Always union roots; use path compression + union by size for near-O(1) operations.
- A union that finds both items already connected = redundant link / cycle.
