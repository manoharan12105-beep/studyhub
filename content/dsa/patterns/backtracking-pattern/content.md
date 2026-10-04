# Backtracking Pattern

## What Is the Pattern

**Backtracking** builds candidate solutions one choice at a time, recursing deeper after each choice and **undoing** it when the recursion returns, so that every combination is explored exactly once. A **pruning** check abandons a partial candidate as soon as it cannot lead to a valid answer.

Every backtracking solution answers three questions:

1. **State:** what has been chosen so far (a path, a partially filled board)?
2. **Choices:** what can be added next?
3. **Goal / prune:** when is the candidate complete, and when is it hopeless?

Tiny example: all subsets of {a, b}: choose a or not → choose b or not → {a, b}, {a}, {b}, {}.

The mechanics (recursion tree, choose–explore–unchoose, subsets/permutations/combinations, N-Queens, Sudoku, word search) are in [Backtracking](../../algorithms/backtracking/content.md) and [Backtracking Problems](../../algorithms/backtracking-problems/content.md).

## Why It Works

The search space is a tree: each level is a decision, each leaf a complete candidate. Depth-first traversal with undo visits every leaf while storing only one path (O(depth) memory). Pruning cuts whole subtrees: if a prefix already violates a constraint, none of its exponentially many extensions are generated. Backtracking stays exponential in the worst case, but it is the right tool when the problem asks for **all** solutions (the output itself is exponential) or when constraints prune heavily.

## Recognition Clues

| Clue in the problem | Why it points here |
|---------------------|--------------------|
| "Return **all** subsets / permutations / combinations / partitions / arrangements" | the output must be enumerated |
| "Generate all valid strings" (parentheses, IP addresses, phone letter combinations) | build character by character with validity checks |
| Placement puzzles: N-Queens, Sudoku, crosswords, word search in a grid | constraints prune partial placements |
| Small n (≤ 10–20) with exponential-looking structure | 2ⁿ or n! is affordable |
| "Find one valid assignment" under many constraints | search with pruning, stop at the first success |

## Typical Problem Structure

- Input: a set/array of candidates, a string to split, a board, or a number n.
- Output: a list of all valid candidates, a count, or one solution.
- Duplicates in the input usually require **sorting + skipping equal siblings** to avoid repeated outputs.

## Template

```pseudocode
backtrack(state):
    if state is complete:
        record a copy of state
        return
    for choice in choices(state):
        if not valid(state, choice): continue        // prune
        apply choice to state
        backtrack(state)
        undo choice                                  // restore for the next sibling
```

## Java Template

```java
import java.util.*;

public class BacktrackingTemplate {

    // All combinations of k numbers from 1..n.
    static void combine(int n, int k, int start, Deque<Integer> path, List<List<Integer>> out) {
        if (path.size() == k) {
            out.add(new ArrayList<>(path));            // copy: path keeps changing
            return;
        }
        for (int x = start; x <= n - (k - path.size()) + 1; x++) {   // prune: leave room for the rest
            path.addLast(x);
            combine(n, k, x + 1, path, out);
            path.removeLast();                         // undo
        }
    }

    public static void main(String[] args) {
        List<List<Integer>> out = new ArrayList<>();
        combine(4, 2, 1, new ArrayDeque<>(), out);
        System.out.println(out);
    }
}
```

**Output:**

```text
[[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]]
```

## Example Problem

**Restore IP addresses.** Given a string of digits, return every valid IPv4 address formed by inserting three dots. Each of the four parts must be 0–255 with no leading zeros (except `"0"` itself). Example: `"25525511135"` → `["255.255.11.135", "255.255.111.35"]`.

- **State:** the parts chosen so far and the position in the string.
- **Choices:** the next part has length 1, 2 or 3.
- **Prune:** the part is invalid (leading zero, > 255), or the remaining characters cannot fill the remaining parts (need between 1 and 3 characters per part).
- **Goal:** four parts and the whole string used.

```java
import java.util.*;

public class RestoreIpAddresses {

    static List<String> restoreIpAddresses(String s) {
        List<String> out = new ArrayList<>();
        backtrack(s, 0, new ArrayList<>(), out);
        return out;
    }

    static void backtrack(String s, int pos, List<String> parts, List<String> out) {
        int remainingParts = 4 - parts.size(), remainingChars = s.length() - pos;
        if (remainingParts == 0) {
            if (remainingChars == 0) out.add(String.join(".", parts));
            return;
        }
        if (remainingChars < remainingParts || remainingChars > 3 * remainingParts) return;   // prune
        for (int len = 1; len <= 3 && pos + len <= s.length(); len++) {
            String part = s.substring(pos, pos + len);
            if (part.length() > 1 && part.charAt(0) == '0') break;          // leading zero: longer parts also invalid
            if (Integer.parseInt(part) > 255) break;
            parts.add(part);
            backtrack(s, pos + len, parts, out);
            parts.remove(parts.size() - 1);                                 // undo
        }
    }

    public static void main(String[] args) {
        System.out.println(restoreIpAddresses("25525511135"));
        System.out.println(restoreIpAddresses("0000") + " " + restoreIpAddresses("101023"));
    }
}
```

**Output:**

```text
[255.255.11.135, 255.255.111.35]
[0.0.0.0] [1.0.10.23, 1.0.102.3, 10.1.0.23, 10.10.2.3, 101.0.2.3]
```

## Dry Run

`s = "0000"` (each row is one call; parts shown so far):

| Call | pos | parts | Choices tried | Result |
|------|-----|-------|---------------|--------|
| 1 | 0 | [] | "0" ✓; "00" leading zero → break | recurse |
| 2 | 1 | [0] | "0" ✓; "00" → break | recurse |
| 3 | 2 | [0, 0] | "0" ✓; "00" → break | recurse |
| 4 | 3 | [0, 0, 0] | "0" ✓ | recurse |
| 5 | 4 | [0, 0, 0, 0] | goal: 4 parts, no chars left | record "0.0.0.0" |

The leading-zero rule prunes every longer part, so only one address exists.

## Common Mistakes

- Recording `path` itself instead of a **copy** — every stored result ends up identical (and empty).
- Forgetting to undo the choice, so siblings see stale state.
- Generating duplicates when the input has repeated values — sort and skip `nums[i] == nums[i − 1]` at the same depth.
- Pruning too late (after building the whole candidate) — check constraints as early as possible.
- Using backtracking to **count** or **optimise** when subproblems repeat — memoise or use [DP](../dp-pattern/content.md).

## Variations

- **Subsets:** at each index choose include/exclude, or loop `start … n − 1`.
- **Combinations / combination sum:** loop from `start`; pass `i` (reuse allowed) or `i + 1` (no reuse).
- **Permutations:** a `used[]` array, or swap elements into position.
- **Partitioning a string:** choose the next cut; validate the piece (palindrome, number range, dictionary word).
- **Grid search:** mark the cell visited, explore 4 neighbours, unmark.
- **Constraint satisfaction:** N-Queens, Sudoku, graph colouring — maintain fast lookups (sets/bitmasks) for O(1) validity checks.

## Complexity

| Problem | Time | Extra space |
|---------|------|-------------|
| All subsets of n | O(2ⁿ × n) | O(n) recursion |
| All permutations of n | O(n! × n) | O(n) |
| Combinations C(n, k) | O(C(n, k) × k) | O(k) |
| With pruning | problem-dependent; worst case still exponential | O(depth) |

The `× n` factor is the cost of copying each solution into the output.

## When Not to Use It

- Only a count or an optimum is needed and subproblems overlap — DP is polynomial where backtracking is exponential.
- A greedy rule or a direct formula exists.
- n is large (e.g. 10⁵) — exponential search is impossible regardless of pruning.

## Key Takeaways

- Choose → explore → unchoose; record copies at the goal.
- Prune early using constraints; sort and skip equal siblings to avoid duplicates.
- Use it when all solutions are required or n is small; switch to DP when subproblems repeat.
