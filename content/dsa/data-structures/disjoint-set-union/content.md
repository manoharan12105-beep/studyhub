# Disjoint Set Union (Union-Find)

## Definition

A **disjoint set union (DSU)**, or **union-find**, maintains a collection of non-overlapping sets over elements 0..n − 1 and supports two operations: **find(x)** — which set is x in (returned as the set's representative, its **root**) — and **union(x, y)** — merge the sets containing x and y. With **path compression** and **union by rank/size**, both run in O(α(n)) amortized time, where α is the inverse Ackermann function — at most 4 for any practical n.

## Why It Matters

Union-find answers "are these two connected?" while connections keep being **added**, far faster than re-running BFS/DFS after each edge. It is the engine of [Kruskal's MST algorithm](../../algorithms/kruskals-algorithm/content.md), detects cycles in undirected graphs, counts connected components incrementally, and solves grouping problems (accounts merging, equations, network connectivity).

## Core Concept

### A forest of parent pointers

Each set is a tree; every element stores its **parent**, and the root is its own parent. Two elements are in the same set exactly when they have the same root.

```java
int[] parent = new int[n];
for (int i = 0; i < n; i++) parent[i] = i;     // initially every element is its own set
```

- **find(x):** follow `parent` until reaching a root (`parent[r] == r`).
- **union(x, y):** find both roots; if different, make one root the parent of the other.

Without optimisations, trees can become long chains (union 0-1, 1-2, 2-3, … repeatedly attaching under the newer root) and `find` costs O(n).

### Optimisation 1: union by rank or size

Always attach the **smaller** tree under the **larger** one.

- **By size:** track the number of elements in each root's tree.
- **By rank:** track an upper bound on tree height; attach the lower-rank root under the higher; if equal, pick one and increase its rank by 1.

A tree's height only grows when two trees of equal rank merge, which at least doubles the size — so height stays ≤ log₂ n and `find` is O(log n).

### Optimisation 2: path compression

During `find(x)`, make every node on the path point **directly to the root**. Later finds on those nodes take one step.

```java
int find(int x) {
    if (parent[x] != x) {
        parent[x] = find(parent[x]);    // point x straight at the root
    }
    return parent[x];
}
```

### Both together

With both optimisations, any sequence of m operations on n elements takes O(m α(n)) time. α(n) grows so slowly that α(n) ≤ 4 for n far beyond the number of atoms in the universe — effectively constant. (Either optimisation alone gives O(log n) amortized.)

## Visual Explanation

```text
union(0,1), union(2,3), union(1,3) with union by size:

after union(0,1)     after union(2,3)       after union(1,3): roots 0 and 2 have equal size → attach 2 under 0
     0                   0     2                    0
     |                   |     |                  /   \
     1                   1     3                 1     2
                                                       |
                                                       3

find(3) with path compression: 3 → 2 → 0, then parent[3] = 0:
                    0
                  / | \
                 1  2  3
```

## Types

| Variant | find | union | Notes |
|---------|------|-------|-------|
| Naive (quick-union) | O(n) | O(n) | trees may degenerate |
| Quick-find (store set id per element) | O(1) | O(n) | relabel a whole set on union |
| Union by rank/size | O(log n) | O(log n) | balanced trees |
| Path compression only | O(log n) amortized | O(log n) amortized | |
| **Rank/size + path compression** | O(α(n)) amortized | O(α(n)) amortized | the standard choice |

## Operations

### Find (with path compression)

Recursive version above; iterative version for very deep trees (avoids stack overflow before compression has flattened anything):

```java
int findIterative(int x) {
    int root = x;
    while (parent[root] != root) root = parent[root];
    while (parent[x] != root) {          // second pass: compress
        int next = parent[x];
        parent[x] = root;
        x = next;
    }
    return root;
}
```

**Time:** O(α(n)) amortized

### Union (by rank)

```java
boolean union(int a, int b) {
    int rootA = find(a), rootB = find(b);
    if (rootA == rootB) return false;           // already in the same set
    if (rank[rootA] < rank[rootB]) {
        parent[rootA] = rootB;
    } else if (rank[rootA] > rank[rootB]) {
        parent[rootB] = rootA;
    } else {
        parent[rootB] = rootA;
        rank[rootA]++;                          // equal ranks: the new tree is one level taller
    }
    return true;
}
```

**Time:** O(α(n)) amortized. Returning `false` when the elements are already connected is what makes cycle detection a one-liner.

### Connected components

Start with `components = n`; every successful union decreases it by 1.

### Cycle detection (undirected graph)

Process edges one by one; if `union(u, v)` returns `false`, u and v were already connected, so the edge (u, v) closes a cycle. O(E α(V)). (For **directed** graphs use DFS colouring or Kahn's algorithm instead — union-find ignores direction.)

### Connection to Kruskal's algorithm

Kruskal sorts edges by weight and adds an edge only if it joins two different components — exactly `union(u, v) == true`. DSU makes each check O(α(V)), so Kruskal costs O(E log E), dominated by sorting.

## Full Java Implementation

```java
import java.util.*;

public class DisjointSetUnion {

    private final int[] parent;
    private final int[] size;
    private int components;

    public DisjointSetUnion(int n) {
        parent = new int[n];
        size = new int[n];
        components = n;
        for (int i = 0; i < n; i++) {
            parent[i] = i;
            size[i] = 1;
        }
    }

    public int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]);            // path compression
        }
        return parent[x];
    }

    public boolean union(int a, int b) {
        int rootA = find(a), rootB = find(b);
        if (rootA == rootB) return false;
        if (size[rootA] < size[rootB]) {            // union by size: attach smaller under larger
            int temp = rootA;
            rootA = rootB;
            rootB = temp;
        }
        parent[rootB] = rootA;
        size[rootA] += size[rootB];
        components--;
        return true;
    }

    public boolean connected(int a, int b) {
        return find(a) == find(b);
    }

    public int componentSize(int x) {
        return size[find(x)];
    }

    public int components() {
        return components;
    }

    public static void main(String[] args) {
        DisjointSetUnion dsu = new DisjointSetUnion(7);
        int[][] edges = {{0, 1}, {2, 3}, {1, 3}, {4, 5}, {0, 2}};
        for (int[] e : edges) {
            boolean merged = dsu.union(e[0], e[1]);
            System.out.println("union(" + e[0] + "," + e[1] + ") " + (merged ? "merged" : "already connected -> cycle")
                    + ", components=" + dsu.components());
        }
        System.out.println("connected(0,3)=" + dsu.connected(0, 3) + " connected(0,4)=" + dsu.connected(0, 4)
                + " size of 3's set=" + dsu.componentSize(3) + " size of 6's set=" + dsu.componentSize(6));
    }
}
```

**Output:**

```text
union(0,1) merged, components=6
union(2,3) merged, components=5
union(1,3) merged, components=4
union(4,5) merged, components=3
union(0,2) already connected -> cycle, components=3
connected(0,3)=true connected(0,4)=false size of 3's set=4 size of 6's set=1
```

## Dry Run

Union by size on 7 elements, `parent` shown after each step:

| Operation | find results | Action | parent array (0..6) |
|-----------|--------------|--------|---------------------|
| start | — | — | 0 1 2 3 4 5 6 |
| union(0,1) | 0, 1 | sizes 1 = 1 → 1 under 0 | 0 0 2 3 4 5 6 |
| union(2,3) | 2, 3 | 3 under 2 | 0 0 2 2 4 5 6 |
| union(1,3) | find(1)=0, find(3)=2 | sizes 2 = 2 → 2 under 0 | 0 0 0 2 4 5 6 |
| union(4,5) | 4, 5 | 5 under 4 | 0 0 0 2 4 4 6 |
| union(0,2) | 0, find(2)=0 | same root → cycle | 0 0 0 2 4 4 6 |
| connected(0,3) | find(3): 3→2→0, compress parent[3]=0 | — | 0 0 0 0 4 4 6 |

## Complexity Summary

| Operation | Naive | Rank/size only | Rank/size + compression |
|-----------|-------|----------------|-------------------------|
| find | O(n) | O(log n) | O(α(n)) amortized |
| union | O(n) | O(log n) | O(α(n)) amortized |
| connected | O(n) | O(log n) | O(α(n)) amortized |
| Space | O(n) | O(n) | O(n) |

## Advantages

- Near-constant time per operation; tiny, array-based code.
- Handles connectivity incrementally as edges arrive.

## Disadvantages

- Cannot **split** sets or delete edges efficiently.
- Answers "connected?" but not "by which path?" or "how far?" (use BFS/DFS for those).
- Ignores edge direction.

## Comparison

| Question | DSU | BFS / DFS |
|----------|-----|-----------|
| Are u and v connected (static graph)? | O(E α(V)) build + O(α) per query | O(V + E) per traversal, or label components once |
| Connectivity while edges are added | O(α) per edge | rerun traversal: O(V + E) each time |
| Cycle in undirected graph | yes | yes |
| Cycle in directed graph | no | yes (colours) |
| Shortest path | no | BFS (unweighted) |

## Java Collections Equivalent

Not in the JDK — write the ~20-line class. For non-integer elements (emails, strings), map each to an index with a `HashMap<String, Integer>`, or keep `Map<String, String> parent`.

## Real-World Applications

- Kruskal's minimum spanning tree.
- Network connectivity and clustering (merging groups as links appear).
- Image processing: labelling connected regions of pixels.
- Merging duplicate records (accounts sharing an email).
- Detecting cycles while building undirected graphs.

## Common Mistakes

- Comparing `parent[a] == parent[b]` instead of `find(a) == find(b)`.
- Linking `a` to `b` instead of linking their **roots** (`parent[find(a)] = find(b)`).
- Updating `size`/`rank` on a non-root element.
- Forgetting that elements given as 1..n need an array of size n + 1.
- Using recursion for `find` on huge, unoptimised inputs — use the iterative version or ensure union by size.

## Key Takeaways

- Parent-pointer forest; root = representative; same root = same set.
- Union by rank/size keeps trees shallow; path compression flattens them; together O(α(n)) ≈ O(1) amortized.
- `union` returning false = edge closes a cycle (undirected).
- Count components by decrementing on each successful union; DSU powers Kruskal.
