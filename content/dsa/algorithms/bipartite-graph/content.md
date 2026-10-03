# Bipartite Graph Check

## Definition

A graph is **bipartite** if its vertices can be split into two groups so that every edge connects a vertex in one group to a vertex in the other — no edge stays inside a group. Equivalently, the graph can be **2-coloured**, and equivalently it has **no odd-length cycle**. BFS or DFS colouring checks this in **O(V + E)**.

## Why It Matters

Bipartite structure appears whenever there are two kinds of things with relationships only between kinds: applicants and jobs, students and courses, users and items. Many problems reduce to "can we split these into two groups so that conflicting pairs are separated?" (possible bipartition, team division). Bipartiteness is also the precondition for matching algorithms.

## Prerequisites

- [BFS](../bfs/content.md) or [DFS](../dfs/content.md)

## Intuition

Colour the start vertex red. Its neighbours must be blue, their neighbours red, and so on — the colouring is forced. If you ever find an edge whose two endpoints already have the **same** colour, no valid split exists. That happens exactly when you walk around an odd cycle: going around a cycle alternates colours, so you return to the start with the right colour only if the cycle has even length.

## How It Works

1. `colour[v] = −1` (uncoloured) for all v.
2. For each uncoloured vertex s (to cover every component): colour it 0 and BFS.
3. For each edge (u, v) seen during the BFS:
   - If v is uncoloured, give it `1 − colour[u]` and enqueue it.
   - If `colour[v] == colour[u]`, return **false**.
4. If no conflict appears, return **true**; the colour classes are the two groups.

## Visual Explanation

```text
Bipartite (even cycle):           Not bipartite (odd cycle):

  0(R) ─── 1(B)                         0(R)
   │        │                          /    \
  3(B) ─── 2(R)                     1(B) ─── 2(B)   ← edge 1–2 joins two blues: conflict
groups: {0, 2} and {1, 3}           triangle = cycle of length 3
```

## Pseudocode

```pseudocode
isBipartite(graph):
    colour[all] ← −1
    for s in vertices:
        if colour[s] ≠ −1: continue
        colour[s] ← 0; queue ← [s]
        while queue not empty:
            u ← dequeue
            for v in neighbours(u):
                if colour[v] = −1: colour[v] ← 1 − colour[u]; enqueue v
                else if colour[v] = colour[u]: return false
    return true
```

## Java Implementation

```java
import java.util.*;

public class Bipartite {

    // Graph given as adjacency lists, graph[u] = neighbours of u (undirected).
    static int[] colouring(int[][] graph) {
        int n = graph.length;
        int[] colour = new int[n];
        Arrays.fill(colour, -1);
        for (int s = 0; s < n; s++) {
            if (colour[s] != -1) continue;                 // already coloured in another BFS
            colour[s] = 0;
            Queue<Integer> q = new ArrayDeque<>(List.of(s));
            while (!q.isEmpty()) {
                int u = q.poll();
                for (int v : graph[u]) {
                    if (colour[v] == -1) {
                        colour[v] = 1 - colour[u];         // forced: opposite colour
                        q.offer(v);
                    } else if (colour[v] == colour[u]) {
                        return null;                       // edge inside one group: not bipartite
                    }
                }
            }
        }
        return colour;
    }

    public static void main(String[] args) {
        int[][] square = {{1, 3}, {0, 2}, {1, 3}, {0, 2}};
        int[][] triangle = {{1, 2}, {0, 2}, {0, 1}};
        int[][] twoParts = {{1}, {0}, {3}, {2, 4}, {3}};   // two components, both paths
        System.out.println("square: " + Arrays.toString(colouring(square)));
        System.out.println("triangle: " + Arrays.toString(colouring(triangle)));
        System.out.println("disconnected: " + Arrays.toString(colouring(twoParts)));
    }
}
```

**Output:**

```text
square: [0, 1, 0, 1]
triangle: null
disconnected: [0, 1, 0, 1, 0]
```

## Dry Run

Triangle 0–1, 0–2, 1–2:

| Dequeue | Edge | Neighbour colour | Action |
|---------|------|------------------|--------|
| 0 (colour 0) | 0–1 | uncoloured | colour 1 ← 1 |
| | 0–2 | uncoloured | colour 2 ← 1 |
| 1 (colour 1) | 1–0 | 0, different | fine |
| | 1–2 | **1, same** | return not bipartite |

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Best / Average / Worst | O(V + E) | standard BFS over every component |

**Space:** O(V) for colours and the queue.

## Properties

- Bipartite ⇔ 2-colourable ⇔ no odd cycle.
- Every tree (and every forest) is bipartite; every even cycle is; no odd cycle is.
- A graph is bipartite iff each of its connected components is.

## Variations

- **DFS colouring** — same logic recursively.
- **Union-find version** — for each vertex, union all its neighbours together, and check that a vertex is never in the same set as one of its neighbours.
- **Possible bipartition / two teams from a dislike list** — build the graph from conflicts and check.
- **Maximum bipartite matching** (Hungarian/Hopcroft–Karp, awareness) — assign jobs to applicants.

## Comparison

| Question | Algorithm |
|----------|-----------|
| Can vertices be split into 2 conflict-free groups? | bipartite check, O(V + E) |
| Can they be split into k ≥ 3 groups? | graph colouring — NP-hard; [backtracking](../backtracking-problems/content.md) for small graphs |

## Edge Cases

- Disconnected graphs — start a BFS from every uncoloured vertex.
- Isolated vertices — trivially fine.
- Self-loop — never bipartite (an edge from a vertex to itself joins a group to itself).

## Advantages

- Linear time; gives the actual partition.

## Disadvantages

- Only answers the two-group question.

## When to Use

- "Split into two groups such that …", "two teams", "is the graph 2-colourable", "odd cycle?".

## Common Mistakes

- Checking only from vertex 0 (missing other components).
- Recolouring an already-coloured vertex instead of checking it.
- Building a directed graph from symmetric relationships (dislikes are mutual — add both directions).

## Key Takeaways

- Colour greedily with alternating colours via BFS/DFS; a same-colour edge means not bipartite.
- Bipartite ⇔ no odd cycle; O(V + E); check every component.
