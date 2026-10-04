# Java Templates

Reusable Java 17 skeletons for the most common patterns. Each compiles as written (inside a class with `import java.util.*;`); adapt names and conditions to the problem.

## Searching

### Binary search — first index where a condition holds

```java
static int firstTrue(int lo, int hi, java.util.function.IntPredicate ok) {   // search [lo, hi)
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (ok.test(mid)) hi = mid;            // mid may be the answer
        else lo = mid + 1;
    }
    return lo;                                 // hi if no index satisfies ok
}
```

- Lower bound: `ok = i -> a[i] >= x`; upper bound: `a[i] > x`.
- On the answer: search values instead of indices, with `ok = feasible`.

## Arrays and Strings

### Variable sliding window — longest valid window

```java
static int longestWindow(int[] a, int limit) {          // example: sum ≤ limit, values ≥ 0
    int left = 0, best = 0;
    long sum = 0;
    for (int right = 0; right < a.length; right++) {
        sum += a[right];                                // expand
        while (sum > limit) sum -= a[left++];           // shrink until valid
        best = Math.max(best, right - left + 1);
    }
    return best;
}
```

### Prefix sums + hash map — count subarrays with sum k

```java
static int countSumK(int[] a, int k) {
    Map<Long, Integer> seen = new HashMap<>();
    seen.put(0L, 1);                                    // empty prefix
    long prefix = 0;
    int count = 0;
    for (int x : a) {
        prefix += x;
        count += seen.getOrDefault(prefix - k, 0);      // look up before inserting
        seen.merge(prefix, 1, Integer::sum);
    }
    return count;
}
```

### Monotonic stack — next greater element

```java
static int[] nextGreater(int[] a) {
    int[] res = new int[a.length];
    Arrays.fill(res, -1);
    Deque<Integer> stack = new ArrayDeque<>();          // indices, values decreasing
    for (int i = 0; i < a.length; i++) {
        while (!stack.isEmpty() && a[stack.peek()] < a[i]) res[stack.pop()] = a[i];
        stack.push(i);
    }
    return res;
}
```

## Graphs

### BFS on a grid — minimum steps

```java
static int bfs(char[][] g, int sr, int sc, int tr, int tc) {
    int rows = g.length, cols = g[0].length;
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    boolean[][] seen = new boolean[rows][cols];
    Deque<int[]> q = new ArrayDeque<>();
    q.offer(new int[] {sr, sc});
    seen[sr][sc] = true;                                // mark on enqueue
    for (int steps = 0; !q.isEmpty(); steps++) {
        for (int size = q.size(); size > 0; size--) {
            int[] cur = q.poll();
            if (cur[0] == tr && cur[1] == tc) return steps;
            for (int[] d : dirs) {
                int r = cur[0] + d[0], c = cur[1] + d[1];
                if (r >= 0 && r < rows && c >= 0 && c < cols && g[r][c] != '#' && !seen[r][c]) {
                    seen[r][c] = true;
                    q.offer(new int[] {r, c});
                }
            }
        }
    }
    return -1;
}
```

### DFS — count connected components (adjacency list)

```java
static int components(List<List<Integer>> adj) {
    boolean[] seen = new boolean[adj.size()];
    int count = 0;
    for (int s = 0; s < adj.size(); s++) {
        if (seen[s]) continue;
        count++;
        Deque<Integer> stack = new ArrayDeque<>(List.of(s));   // iterative: no stack overflow
        seen[s] = true;
        while (!stack.isEmpty()) {
            int u = stack.pop();
            for (int v : adj.get(u)) if (!seen[v]) { seen[v] = true; stack.push(v); }
        }
    }
    return count;
}
```

### Topological sort — Kahn's algorithm

```java
static List<Integer> topoSort(int n, int[][] edges) {            // edge {u, v}: u before v
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    int[] indeg = new int[n];
    for (int[] e : edges) { adj.get(e[0]).add(e[1]); indeg[e[1]]++; }
    Deque<Integer> q = new ArrayDeque<>();
    for (int i = 0; i < n; i++) if (indeg[i] == 0) q.offer(i);
    List<Integer> order = new ArrayList<>();
    while (!q.isEmpty()) {
        int u = q.poll();
        order.add(u);
        for (int v : adj.get(u)) if (--indeg[v] == 0) q.offer(v);
    }
    return order.size() == n ? order : List.of();                // empty: cycle
}
```

### Union-find

```java
static int[] parent, size;

static void init(int n) {
    parent = new int[n];
    size = new int[n];
    for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
}

static int find(int x) {
    while (parent[x] != x) x = parent[x] = parent[parent[x]];    // path halving
    return x;
}

static boolean union(int a, int b) {
    int ra = find(a), rb = find(b);
    if (ra == rb) return false;                                  // already connected
    if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }
    parent[rb] = ra;
    size[ra] += size[rb];
    return true;
}
```

### Dijkstra — lazy deletion

```java
static long[] dijkstra(List<List<int[]>> adj, int src) {         // adj.get(u) = {v, w}, w ≥ 0
    long[] dist = new long[adj.size()];
    Arrays.fill(dist, Long.MAX_VALUE);
    dist[src] = 0;
    PriorityQueue<long[]> pq = new PriorityQueue<>(Comparator.comparingLong(x -> x[0]));
    pq.offer(new long[] {0, src});
    while (!pq.isEmpty()) {
        long[] top = pq.poll();
        int u = (int) top[1];
        if (top[0] > dist[u]) continue;                          // stale entry
        for (int[] e : adj.get(u)) {
            if (dist[u] + e[1] < dist[e[0]]) {
                dist[e[0]] = dist[u] + e[1];
                pq.offer(new long[] {dist[e[0]], e[0]});
            }
        }
    }
    return dist;
}
```

## Recursion and DP

### Backtracking — subsets / combinations

```java
static void backtrack(int[] nums, int start, Deque<Integer> path, List<List<Integer>> out) {
    out.add(new ArrayList<>(path));                              // record a copy
    for (int i = start; i < nums.length; i++) {
        if (i > start && nums[i] == nums[i - 1]) continue;       // skip duplicates (nums sorted)
        path.addLast(nums[i]);                                   // choose
        backtrack(nums, i + 1, path, out);                       // explore
        path.removeLast();                                       // unchoose
    }
}
```

### Memoised recursion (top-down DP)

```java
static long[] memo;                                              // fill with -1 before the first call

static long ways(int n) {                                        // example: stairs with steps 1 and 2
    if (n <= 1) return 1;
    if (memo[n] != -1) return memo[n];
    return memo[n] = ways(n - 1) + ways(n - 2);
}
```

### 0/1 knapsack — 1D table

```java
static int knapsack(int[] weight, int[] value, int capacity) {
    int[] dp = new int[capacity + 1];                            // dp[c] = best value with capacity c
    for (int i = 0; i < weight.length; i++)
        for (int c = capacity; c >= weight[i]; c--)              // downward: each item used once
            dp[c] = Math.max(dp[c], dp[c - weight[i]] + value[i]);
    return dp[capacity];
}
```

- Unbounded knapsack / coin change: iterate `c` **upward** so an item can be reused.
