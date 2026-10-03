# Graph

## Definition

A **graph** G = (V, E) is a set of **vertices** (nodes) V connected by a set of **edges** E. Edges may have a direction (**directed** graph) or not (**undirected**), and may carry a **weight** (cost, distance, capacity). Unlike a tree, a graph can contain cycles, disconnected parts and multiple paths between two vertices.

## Why It Matters

Graphs model relationships: road maps, social networks, the web, task dependencies, network routing, state machines, even grids and puzzles. Many interview problems that do not mention graphs are graph problems in disguise ("course prerequisites", "word ladder", "islands in a grid"). Choosing a representation is the first decision in every graph solution.

## Core Concept

### Terminology

| Term | Meaning |
|------|---------|
| Vertex (node) | an entity, usually numbered 0..V − 1 |
| Edge | a connection (u, v); in a directed graph u → v differs from v → u |
| Adjacent / neighbour | v is adjacent to u if the edge (u, v) exists |
| Weighted / unweighted | edges carry numbers, or all count as 1 |
| Degree | number of edges at a vertex (undirected) |
| In-degree / out-degree | number of edges coming in / going out (directed) |
| Path | a sequence of vertices joined by edges; **simple** if no vertex repeats |
| Cycle | a path that starts and ends at the same vertex |
| Cyclic / acyclic | contains a cycle / does not; a **DAG** is a directed acyclic graph |
| Connected (undirected) | every vertex can reach every other |
| Connected component | a maximal set of mutually reachable vertices |
| Strongly connected (directed) | every vertex can reach every other following edge directions |
| Self-loop / multi-edge | an edge from a vertex to itself / several edges between the same pair |
| Dense / sparse | E close to V² / E close to V |
| Tree | a connected, acyclic undirected graph — exactly V − 1 edges |

### Useful facts

- **Handshake lemma:** in an undirected graph the sum of all degrees is 2E (each edge adds 1 to two vertices).
- Maximum edges without self-loops/multi-edges: V(V − 1)/2 undirected, V(V − 1) directed.
- A graph with V vertices and fewer than V − 1 edges cannot be connected; a connected graph with exactly V − 1 edges is a tree.

### Implicit graphs

Sometimes the graph is never stored. In a grid, each cell is a vertex and its 4 neighbours are its edges. In a word ladder, each word is a vertex and words differing by one letter are adjacent. You generate neighbours on the fly instead of building lists.

## Visual Explanation

```text
Undirected, unweighted                 Directed, weighted

   0 ─── 1                             0 ──5──▶ 1
   │     │                             │        │
   │     │                             2        1
   3 ─── 2      4 ─── 5                ▼        ▼
                                       3 ◀──3── 2
components: {0,1,2,3}, {4,5}
degree(0) = 2; sum of degrees = 10 = 2 × 5 edges
```

## Types

| Type | Example |
|------|---------|
| Undirected | friendships, roads that go both ways |
| Directed | follows on social media, web links, prerequisites |
| Weighted | road distances, flight costs, latencies |
| Unweighted | "connected or not" relationships |
| Cyclic | road networks |
| Acyclic (DAG) | task dependencies, course prerequisites, build systems |
| Bipartite | vertices split into two groups, edges only between groups (jobs ↔ applicants) — see [Bipartite Graph](../../algorithms/bipartite-graph/content.md) |

## Operations

### Representation 1: adjacency matrix

A V × V array where `matrix[u][v]` is 1 (or the weight) if the edge exists.

```java
int[][] matrix = new int[V][V];
matrix[u][v] = 1;
matrix[v][u] = 1;          // undirected: store both directions
```

- Edge check O(1); iterating neighbours O(V); space O(V²).
- Good for dense graphs, small V (≤ a few thousand), and Floyd–Warshall.

### Representation 2: adjacency list

For each vertex, a list of its neighbours. The default choice for interview problems.

```java
List<List<Integer>> adj = new ArrayList<>();
for (int i = 0; i < V; i++) {
    adj.add(new ArrayList<>());
}
adj.get(u).add(v);
adj.get(v).add(u);         // omit for a directed graph
```

Weighted version — store pairs:

```java
List<List<int[]>> adj = new ArrayList<>();   // int[] {neighbour, weight}
for (int i = 0; i < V; i++) adj.add(new ArrayList<>());
adj.get(u).add(new int[] {v, w});
```

- Edge check O(deg(u)); iterating neighbours O(deg(u)); space O(V + E).
- Traversing the whole graph is O(V + E).
- When vertex ids are not 0..V − 1 (strings, large numbers), use `Map<String, List<String>>` with `computeIfAbsent`.

### Representation 3: edge list

An array of edges `{u, v}` or `{u, v, w}`.

```java
int[][] edges = {{0, 1, 4}, {1, 2, 3}, {0, 2, 7}};
```

- Space O(E); edge check and neighbour lookup O(E).
- Natural for algorithms that process edges in a global order: [Kruskal](../../algorithms/kruskals-algorithm/content.md) (sort by weight) and [Bellman–Ford](../../algorithms/bellman-ford/content.md) (relax every edge).
- Problems usually give input as an edge list; convert it to an adjacency list before traversing.

### Degrees

Out-degree of u = `adj.get(u).size()`. In-degrees are counted in one pass over all edges — used by [Topological Sort](../../algorithms/topological-sort/content.md) (Kahn's algorithm).

### Connected components

Start a traversal ([BFS](../../algorithms/bfs/content.md) or [DFS](../../algorithms/dfs/content.md)) from every vertex not yet visited; each start discovers one component. Total O(V + E). [Disjoint Set Union](../disjoint-set-union/content.md) solves the same question incrementally as edges arrive.

## Full Java Implementation

```java
import java.util.*;

public class GraphBasics {

    private final int vertices;
    private final List<List<Integer>> adj = new ArrayList<>();
    private int edgeCount;

    GraphBasics(int vertices) {
        this.vertices = vertices;
        for (int i = 0; i < vertices; i++) adj.add(new ArrayList<>());
    }

    void addUndirectedEdge(int u, int v) {
        adj.get(u).add(v);
        adj.get(v).add(u);
        edgeCount++;
    }

    int degree(int u) {
        return adj.get(u).size();
    }

    boolean hasEdge(int u, int v) {
        return adj.get(u).contains(v);          // O(deg(u)) on a list
    }

    int[][] toMatrix() {
        int[][] m = new int[vertices][vertices];
        for (int u = 0; u < vertices; u++) {
            for (int v : adj.get(u)) m[u][v] = 1;
        }
        return m;
    }

    List<List<Integer>> components() {
        boolean[] seen = new boolean[vertices];
        List<List<Integer>> result = new ArrayList<>();
        for (int start = 0; start < vertices; start++) {
            if (seen[start]) continue;
            List<Integer> component = new ArrayList<>();
            Deque<Integer> stack = new ArrayDeque<>(List.of(start));
            seen[start] = true;
            while (!stack.isEmpty()) {           // iterative DFS
                int u = stack.pop();
                component.add(u);
                for (int v : adj.get(u)) {
                    if (!seen[v]) {
                        seen[v] = true;
                        stack.push(v);
                    }
                }
            }
            Collections.sort(component);
            result.add(component);
        }
        return result;
    }

    public static void main(String[] args) {
        GraphBasics g = new GraphBasics(6);
        int[][] edges = {{0, 1}, {1, 2}, {2, 3}, {3, 0}, {4, 5}};
        for (int[] e : edges) g.addUndirectedEdge(e[0], e[1]);

        int degreeSum = 0;
        for (int u = 0; u < 6; u++) degreeSum += g.degree(u);
        System.out.println("edges=" + g.edgeCount + " degree sum=" + degreeSum);
        System.out.println("edge 0-2? " + g.hasEdge(0, 2) + ", edge 0-3? " + g.hasEdge(0, 3));
        System.out.println("matrix row 0: " + Arrays.toString(g.toMatrix()[0]));
        System.out.println("components: " + g.components());

        // Directed, weighted graph from an edge list; in-degrees in one pass.
        int[][] weighted = {{0, 1, 5}, {0, 3, 2}, {1, 2, 1}, {2, 3, 3}};
        List<List<int[]>> out = new ArrayList<>();
        int[] inDegree = new int[4];
        for (int i = 0; i < 4; i++) out.add(new ArrayList<>());
        for (int[] e : weighted) {
            out.get(e[0]).add(new int[] {e[1], e[2]});
            inDegree[e[1]]++;
        }
        StringBuilder sb = new StringBuilder();
        for (int[] edge : out.get(0)) sb.append("0->").append(edge[0]).append(" (w=").append(edge[1]).append(") ");
        System.out.println(sb.toString().trim() + "; in-degrees " + Arrays.toString(inDegree));
    }
}
```

**Output:**

```text
edges=5 degree sum=10
edge 0-2? false, edge 0-3? true
matrix row 0: [0, 1, 0, 1, 0, 0]
components: [[0, 1, 2, 3], [4, 5]]
0->1 (w=5) 0->3 (w=2); in-degrees [0, 1, 1, 2]
```

## Dry Run

Building the adjacency list for edges (0,1), (1,2), (2,3), (3,0), (4,5):

| Edge | adj[u] after | adj[v] after |
|------|--------------|--------------|
| (0,1) | 0: [1] | 1: [0] |
| (1,2) | 1: [0, 2] | 2: [1] |
| (2,3) | 2: [1, 3] | 3: [2] |
| (3,0) | 3: [2, 0] | 0: [1, 3] |
| (4,5) | 4: [5] | 5: [4] |

Each undirected edge appears twice — total list entries 2E = 10.

## Complexity Summary

| Operation | Adjacency matrix | Adjacency list | Edge list |
|-----------|------------------|----------------|-----------|
| Space | O(V²) | O(V + E) | O(E) |
| Add edge | O(1) | O(1) | O(1) |
| Remove edge | O(1) | O(deg) | O(E) |
| Check edge (u, v) | O(1) | O(deg(u)) | O(E) |
| Iterate neighbours of u | O(V) | O(deg(u)) | O(E) |
| Visit all edges | O(V²) | O(V + E) | O(E) |

## Advantages

- Expressive: models any pairwise relationship.
- Adjacency lists make traversal O(V + E), proportional to the input.

## Disadvantages

- Representation choice matters: a matrix for V = 10⁵ needs 10¹⁰ cells.
- Cycles require "visited" tracking in every traversal.

## Comparison

| | Tree | Graph |
|---|------|-------|
| Cycles | never | allowed |
| Root | one | none in general |
| Paths between two nodes | exactly one | zero, one or many |
| Edges with V vertices | V − 1 | 0 to V(V − 1)/2 (undirected) |
| Traversal needs `visited`? | no (from the root, following children) | yes |

## Java Collections Equivalent

No graph class in the JDK. Use `List<List<Integer>>` (or `List<Integer>[]`), `List<List<int[]>>` for weights, `Map<K, List<K>>` for non-integer ids, `boolean[]`/`int[]` for visited and distances.

## Real-World Applications

- Maps and navigation (weighted graphs, shortest paths).
- Social networks (friend suggestions, communities).
- Dependency resolution in build tools and package managers (DAGs).
- Network routing, web crawling, recommendation systems.

## Common Mistakes

- Adding only one direction for an undirected edge.
- Using an adjacency matrix for large sparse graphs.
- Forgetting isolated vertices: create a list for every vertex 0..V − 1, not only those that appear in edges.
- Treating 1-indexed input vertices as 0-indexed (allocate V + 1 lists or subtract 1).
- Ignoring disconnected graphs — start traversals from every unvisited vertex.

## Key Takeaways

- Graph = vertices + edges; directed/undirected, weighted/unweighted, cyclic/acyclic.
- Adjacency list (O(V + E)) is the default; matrix for dense graphs and O(1) edge checks; edge list for Kruskal and Bellman–Ford.
- Sum of degrees = 2E; a tree has V − 1 edges.
- Grids and state spaces are implicit graphs — generate neighbours on the fly.
