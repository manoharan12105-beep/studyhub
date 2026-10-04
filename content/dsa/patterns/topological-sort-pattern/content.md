# Topological Sort Pattern

## What Is the Pattern

The **topological sort pattern** orders items so that every dependency comes before the items that depend on it. Model the problem as a directed graph with an edge **u → v meaning "u must come before v"**; if the graph has no cycle (a DAG), a topological order exists. **Kahn's algorithm** repeatedly removes items with no remaining prerequisites (in-degree 0); if some items are never removed, a cycle makes the task impossible.

Tiny example: tasks a → c, b → c, c → d. In-degrees a:0, b:0, c:2, d:1. Take a, b (c's in-degree drops to 0), then c, then d: order a, b, c, d.

Both algorithms (Kahn's BFS and DFS post-order) and proofs are in [Topological Sort](../../algorithms/topological-sort/content.md); cycle detection in [Cycle Detection](../../algorithms/cycle-detection/content.md).

## Why It Works

An item with in-degree 0 has no unmet prerequisites, so it can go next. Removing it cannot create new dependencies, only satisfy them. In a DAG there is always at least one in-degree-0 node (otherwise following edges backwards forever would revisit a node — a cycle). So Kahn's algorithm keeps going until every node is placed; if it gets stuck with nodes left, those nodes lie on or behind a cycle. Each node and edge is processed once: O(V + E).

Processing nodes **level by level** (all current in-degree-0 nodes form one level) also gives the minimum number of rounds when independent tasks can run in parallel, and running a DP along the order gives longest/critical-path answers.

## Recognition Clues

| Clue in the problem | Why it points here |
|---------------------|--------------------|
| "Prerequisites", "must be done before", "depends on", "build order" | precedence edges |
| "Is it possible to finish all tasks?" | cycle check via Kahn's count |
| "Return a valid order" (courses, compilation, recipes) | the topological order itself |
| "Minimum number of semesters/rounds" with parallel work | BFS levels |
| "Earliest finish time", "longest path" in a dependency graph | DP over the topological order |
| Derive an ordering from pairwise comparisons (alien alphabet, sequence reconstruction) | build edges from comparisons, then sort |
| Trees/graphs "trimmed from the leaves inward" | Kahn-style peeling by degree |

## Typical Problem Structure

- Input: n items and a list of pairs (prerequisite, item), or data from which pairs can be derived.
- Output: an order (any or lexicographically smallest), a boolean, a number of rounds, or a time.
- Build: adjacency list + in-degree array; watch the edge direction in the input (`[a, b]` may mean "b before a").

## Template

```pseudocode
build adjacency list and indegree[] from the dependency pairs
queue ← all nodes with indegree 0
order ← []
while queue not empty:
    u ← queue.pop(); append u to order
    for v in adj[u]:
        indegree[v] ← indegree[v] − 1
        if indegree[v] = 0: queue.push(v)
if size(order) < n: there is a cycle (impossible)
```

## Java Template

```java
import java.util.*;

public class TopoTemplate {

    // edges[i] = {before, after}. Returns an order, or an empty list if there is a cycle.
    static List<Integer> topoOrder(int n, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        int[] indegree = new int[n];
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            indegree[e[1]]++;
        }
        Deque<Integer> queue = new ArrayDeque<>();
        for (int v = 0; v < n; v++) if (indegree[v] == 0) queue.offer(v);
        List<Integer> order = new ArrayList<>();
        while (!queue.isEmpty()) {
            int u = queue.poll();
            order.add(u);
            for (int v : adj.get(u)) if (--indegree[v] == 0) queue.offer(v);
        }
        return order.size() == n ? order : List.of();
    }

    public static void main(String[] args) {
        System.out.println(topoOrder(4, new int[][] {{0, 2}, {1, 2}, {2, 3}}) + " " + topoOrder(2, new int[][] {{0, 1}, {1, 0}}));
    }
}
```

**Output:**

```text
[0, 1, 2, 3] []
```

## Example Problem

**Which recipes can be made?** You have unlimited `supplies`. Recipe i needs all of `ingredients[i]`, which may be supplies or other recipes. Return every recipe you can make. Example: recipes `["bread", "sandwich", "burger"]`, ingredients `[["yeast", "flour"], ["bread", "meat"], ["sandwich", "meat", "bread"]]`, supplies `["yeast", "flour", "meat"]` → `[bread, sandwich, burger]`.

- **Brute force:** repeatedly scan all recipes, marking any whose ingredients are available, until nothing changes — O(R × total ingredients) per round, up to R rounds.
- **Observation:** an ingredient → recipe edge means "must be available before". Supplies are the starting in-degree-0 nodes. A recipe becomes makeable exactly when its in-degree (missing ingredients) reaches 0. Recipes on a cycle (each needing the other) never reach 0.

```java
import java.util.*;

public class FindRecipes {

    static List<String> findAllRecipes(String[] recipes, List<List<String>> ingredients, String[] supplies) {
        Map<String, List<String>> usedBy = new HashMap<>();      // ingredient → recipes needing it
        Map<String, Integer> missing = new HashMap<>();          // recipe → ingredients not yet available
        for (int i = 0; i < recipes.length; i++) {
            missing.put(recipes[i], ingredients.get(i).size());
            for (String ing : ingredients.get(i)) usedBy.computeIfAbsent(ing, k -> new ArrayList<>()).add(recipes[i]);
        }
        Deque<String> queue = new ArrayDeque<>(Arrays.asList(supplies));
        List<String> made = new ArrayList<>();
        while (!queue.isEmpty()) {
            String item = queue.poll();
            for (String recipe : usedBy.getOrDefault(item, List.of())) {
                if (missing.merge(recipe, -1, Integer::sum) == 0) {   // last missing ingredient arrived
                    made.add(recipe);
                    queue.offer(recipe);                            // a made recipe is itself an ingredient
                }
            }
        }
        return made;
    }

    public static void main(String[] args) {
        System.out.println(findAllRecipes(new String[] {"bread", "sandwich", "burger"},
                List.of(List.of("yeast", "flour"), List.of("bread", "meat"), List.of("sandwich", "meat", "bread")), new String[] {"yeast", "flour", "meat"}));
        System.out.println(findAllRecipes(new String[] {"a", "b"}, List.of(List.of("b"), List.of("a")), new String[] {"salt"}));
    }
}
```

**Output:**

```text
[bread, sandwich, burger]
[]
```

## Dry Run

Missing counts start at bread 2, sandwich 2, burger 3; queue = [yeast, flour, meat].

| Pop | Recipes updated (missing) | Newly made | Queue after |
|-----|---------------------------|------------|-------------|
| yeast | bread 1 | — | [flour, meat] |
| flour | bread 0 | bread | [meat, bread] |
| meat | sandwich 1, burger 2 | — | [bread] |
| bread | sandwich 0, burger 1 | sandwich | [sandwich] |
| sandwich | burger 0 | burger | [burger] |
| burger | — | — | [] |

In the second call, a needs b and b needs a: neither count ever reaches 0, so nothing is made — the cycle is detected implicitly.

## Common Mistakes

- Reversing edge direction (input `[course, prerequisite]` means prerequisite → course).
- Forgetting to check `order.size() == n` (silently returning a partial order when there is a cycle).
- Counting duplicate edges inconsistently between the adjacency list and the in-degree array.
- Using plain DFS without three colours for cycle detection in directed graphs (a "visited" set alone flags cross edges as cycles).
- Using a `Queue` when the problem wants the **lexicographically smallest** order — use a `PriorityQueue`.

## Variations

- **Lexicographically smallest order:** min-heap instead of a FIFO queue (O((V + E) log V)).
- **Parallel rounds:** process the queue level by level; the number of levels is the minimum number of rounds.
- **Longest path / earliest finish:** `finish[v] = time[v] + max(finish[u])` over prerequisites u, computed in topological order.
- **Ordering from comparisons:** alien dictionary (adjacent words give one edge each).
- **Unique order check:** the order is unique iff the queue never holds more than one node.
- **Leaf trimming on undirected trees:** peel degree-1 nodes layer by layer (centres of a tree).

## Complexity

| Variant | Time | Space |
|---------|------|-------|
| Kahn's algorithm | O(V + E) | O(V + E) |
| With a priority queue | O((V + E) log V) | O(V + E) |
| DP along the order | O(V + E) | O(V) |

## When Not to Use It

- The graph is undirected (no notion of "before") — except for leaf-trimming tricks.
- Dependencies have cycles by design and you need strongly connected groups — [Strongly Connected Components](../../algorithms/strongly-connected-components/content.md).
- Weighted shortest paths in general graphs — [Shortest Path Pattern](../shortest-path-pattern/content.md) (though on a DAG, relaxing edges in topological order gives shortest paths in O(V + E)).

## Key Takeaways

- "Before/after" constraints → directed edges → topological order; leftover nodes mean a cycle.
- Kahn: start from in-degree 0, decrement neighbours, enqueue at 0. O(V + E).
- Levels give parallel rounds; DP along the order gives earliest finish times and longest paths.
