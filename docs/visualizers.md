# Visualizer Registry

Interactive visualizations that topics are **candidates** for. A topic opts in by setting its metadata `visualizer` to one of these ids. Nothing here is implemented yet; the app (Phase 3+) shows a visualizer only once `js/visualizers/<id>.js` exists.

Rules for every visualizer (see also `.claude/skills/ui-ux/SKILL.md`):

- The topic must be fully understandable without it — it is an enhancement.
- Controls: Step · Play/Pause · Reset, plus custom input where listed. Keyboard operable.
- A text description of the current step is always visible (screen readers, reduced motion).
- Several topics may share one id.

## Aptitude

| Id | Topics | What it shows | Custom input |
|----|--------|---------------|--------------|
| `unit-digit-cycles` | number-system | The repeating cycle of last digits of aⁿ for a chosen base, highlighting which position n lands on (n mod cycle length, with 0 → last position). | base, exponent |
| `percentage-bar-model` | percentages | A bar for the base value; increases/decreases drawn as segments, successive changes applied to the *new* bar so the "base changes" idea is visible. | base, changes |
| `ratio-bar-model` | ratio-and-proportion | Equal-sized unit blocks split between parties; dividing a total by ratio and how ratios change when quantities are added. | ratio, total |
| `alligation-cross` | mixtures-and-alligation | The alligation cross: two component values, the mean, and the differences that give the mixing ratio, with a slider for the mean. | two values, mean |
| `interest-growth-chart` | simple-interest, compound-interest | Year-by-year bars of simple vs. compound interest on the same principal, showing interest-on-interest growing. | P, R, T, compounding |
| `work-units-timeline` | time-and-work | Total work as LCM units; each worker/pipe as a per-day rate filling (or emptying) the tank day by day. | workers' days, leaves/joins |
| `relative-motion-track` | time-speed-distance | Two objects on a track: same/opposite directions, trains crossing poles/platforms/each other, boats with stream speed, race head starts. | speeds, lengths, direction |
| `arrangement-builder` | permutation-and-combination | Filling slots one by one, showing choices per slot (multiplication principle), and how order-not-mattering divides by r!. | n, r, constraints |
| `sample-space-explorer` | probability | Full sample space for coins/dice/cards as a grid, highlighting favourable outcomes for a chosen event. | experiment, event |
| `di-chart-explorer` | data-interpretation | One dataset shown as table / bar / line / pie; selecting values shows the percentage-change and share calculations. | dataset |
| `family-tree-builder` | blood-relations | Builds the family tree from statements one at a time using the standard symbols (gender, generation levels). | statements |
| `direction-tracer` | direction-sense | Draws the path on a grid step by step, then shows the straight-line distance and final direction from the start. | moves |
| `seating-arrangement-builder` | seating-arrangement | Linear and circular seats filled clue by clue, with left/right resolved relative to facing direction. | clues |
| `puzzle-elimination-grid` | puzzles | Elimination grid (people × attributes) where each clue ticks or crosses cells. | clues |
| `venn-builder` | syllogisms, logical-venn-diagrams | Draws the minimal diagrams for statements and tests each conclusion against all possible diagrams. | statements |
| `clock-angle` | clocks | An analogue clock; hands move with time and the angle between them is shown with the 30H − 5.5M calculation. | time |

## Data Structures & Algorithms

| Id | Topics | What it shows | Custom input |
|----|--------|---------------|--------------|
| `array-operations` | arrays | Cells with indices; insert, delete and search animate the shifting of elements and count the moves, contrasting access O(1) with middle insertion O(n). | array, operation, index |
| `two-pointer-scan` | two-pointers | Left and right pointers over a sorted array; each step shows the comparison with the target and which pointer moves and why. | array, target |
| `sliding-window` | sliding-window | A highlighted window expanding and shrinking over an array or string, with the running summary (sum, counts) and the best window so far. | array or string, condition |
| `linked-list-pointers` | linked-list, linked-list-techniques, fast-and-slow-pointers | Nodes and arrows; each step of insertion, deletion, reversal or fast/slow traversal redraws the changed pointers and highlights prev/curr/next. | values, operation |
| `stack-operations` | stack | A vertical stack with push, pop and peek, and a bracket-matching or monotonic-stack trace that shows each push and pop. | operations or input array |
| `queue-operations` | queue | A circular array with front and rear indices wrapping around, plus deque operations at both ends. | operations, capacity |
| `binary-search-steps` | binary-search, binary-search-variations, binary-search-pattern | lo, mid and hi markers over a sorted array; the discarded half greys out each step until the boundary is found. | sorted array, target or predicate |
| `sorting-visualizer` | bubble-sort, selection-sort, insertion-sort, merge-sort, quick-sort, heap-sort, counting-sort, radix-sort, bucket-sort | Bars for the array with the comparisons, swaps or writes of the chosen sort, step by step, with counters for comparisons and moves and a stability marker for equal keys. | array, algorithm |
| `recursion-tree` | recursion | The call tree of a recursive function growing and returning, with the call stack beside it and repeated subcalls highlighted. | function, n |
| `backtracking-tree` | backtracking, backtracking-problems, backtracking-pattern | The decision tree of choose/explore/unchoose with pruned branches marked, alongside the current partial solution (subset, permutation or board). | problem, size |
| `tree-traversal` | tree-traversals | A binary tree with the visit order of preorder, inorder, postorder or level order, showing the stack or queue at each step. | tree values, traversal |
| `bst-operations` | binary-search-tree | Search, insert and delete in a BST, highlighting the comparison path and the three deletion cases (leaf, one child, two children). | keys, operation |
| `heap-operations` | heap | The heap as both a tree and an array; offer and poll show sift-up and sift-down swaps, and heapify works bottom-up. | values, operation |
| `trie-builder` | trie | Words inserted character by character into a trie, end-of-word marks, and prefix search following edges. | words, query |
| `graph-traversal` | bfs, dfs, bfs-pattern, dfs-pattern | A graph or grid explored by BFS (queue, distance layers) or DFS (stack, discovery order), with visited marks and the traversal tree. | graph, start, algorithm |
| `dijkstra-steps` | dijkstra, shortest-path-pattern | Tentative distances, the priority queue and settled vertices; each relaxation updates a distance and the shortest-path tree. | weighted graph, source |
| `mst-builder` | prims-algorithm, kruskals-algorithm | Kruskal (edges in sorted order, cycle check with components) or Prim (growing tree, cheapest crossing edge) building a minimum spanning tree. | weighted graph, algorithm |
| `union-find-forest` | disjoint-set-union, union-find-pattern | The parent-pointer forest during union by rank and path compression, alongside the parent array. | elements, unions |
| `topological-sort-steps` | topological-sort, topological-sort-pattern | In-degrees updating as Kahn's algorithm removes vertices, the queue of ready vertices and the growing order; cycles leave vertices behind. | DAG |
| `dp-table` | dynamic-programming, dp-2d-grid, knapsack-dp, subsequence-dp, string-dp, dp-pattern | A DP table filled cell by cell, highlighting the cells each value depends on and the reconstructed optimal path at the end. | problem, inputs |
