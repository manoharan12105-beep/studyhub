# Trie — Practice

### P1. Longest common prefix

**Difficulty:** Easy · **Pattern:** Walk while there is exactly one child

Return the longest common prefix of an array of lowercase words.

**Constraints:** 1 ≤ n ≤ 200; 0 ≤ word length ≤ 200.

Example: `["flower", "flow", "flight"]` → `"fl"`; `["dog", "car"]` → `""`.

<details>
<summary>Hint</summary>

Insert all words. From the root, keep descending while the node has exactly one child and is not the end of a word.

</details>

<details>
<summary>Answer</summary>

**Approach:** The trie makes the idea visible; comparing characters column by column (vertical scanning) is equally O(total characters) without building a trie — mention both.

```java
public class LongestCommonPrefix {

    static class Node {
        Node[] children = new Node[26];
        int childCount;
        boolean end;
    }

    static String lcp(String[] words) {
        Node root = new Node();
        for (String w : words) {
            Node node = root;
            for (char c : w.toCharArray()) {
                int i = c - 'a';
                if (node.children[i] == null) {
                    node.children[i] = new Node();
                    node.childCount++;
                }
                node = node.children[i];
            }
            node.end = true;
        }
        StringBuilder prefix = new StringBuilder();
        Node node = root;
        while (node.childCount == 1 && !node.end) {
            for (int i = 0; i < 26; i++) {
                if (node.children[i] != null) {
                    prefix.append((char) ('a' + i));
                    node = node.children[i];
                    break;
                }
            }
        }
        return prefix.toString();
    }

    public static void main(String[] args) {
        System.out.println("[" + lcp(new String[] {"flower", "flow", "flight"}) + "] [" + lcp(new String[] {"dog", "car"}) + "] [" + lcp(new String[] {"ab", "abc"}) + "]");
    }
}
```

**Output:**

```text
[fl] [] [ab]
```

**Complexity:** O(total characters) time and space.

</details>

### P2. Dictionary with wildcard search

**Difficulty:** Medium · **Pattern:** Trie + DFS on wildcard

Design `addWord(word)` and `search(pattern)`, where the pattern may contain `.` matching any single letter.

**Constraints:** words up to 25 letters; at most 2 dots per pattern; up to 10⁴ calls.

Example: add "bad", "dad", "mad"; search "pad" → false, ".ad" → true, "b.." → true.

<details>
<summary>Hint</summary>

A normal character follows one child. A `.` must try **all** existing children — recursion.

</details>

<details>
<summary>Answer</summary>

```java
public class WordDictionary {

    private static class Node {
        Node[] children = new Node[26];
        boolean end;
    }

    private final Node root = new Node();

    void addWord(String word) {
        Node node = root;
        for (char c : word.toCharArray()) {
            int i = c - 'a';
            if (node.children[i] == null) node.children[i] = new Node();
            node = node.children[i];
        }
        node.end = true;
    }

    boolean search(String pattern) {
        return match(root, pattern, 0);
    }

    private boolean match(Node node, String p, int pos) {
        if (pos == p.length()) return node.end;
        char c = p.charAt(pos);
        if (c == '.') {
            for (Node child : node.children) {
                if (child != null && match(child, p, pos + 1)) return true;
            }
            return false;
        }
        Node child = node.children[c - 'a'];
        return child != null && match(child, p, pos + 1);
    }

    public static void main(String[] args) {
        WordDictionary d = new WordDictionary();
        d.addWord("bad");
        d.addWord("dad");
        d.addWord("mad");
        System.out.println(d.search("pad") + " " + d.search(".ad") + " " + d.search("b..") + " " + d.search("b."));
    }
}
```

**Output:**

```text
false true true false
```

**Complexity:** `addWord` O(L). `search` O(L) without dots; with d dots up to O(26ᵈ × L) in the worst case.

</details>

### P3. Replace words with their shortest root

**Difficulty:** Medium · **Pattern:** Shortest prefix that is a word

Given a dictionary of roots and a sentence, replace each word by the shortest root that is a prefix of it (leave it unchanged if none).

**Constraints:** up to 1000 roots and 10⁶ characters in the sentence.

Example: roots `["cat", "bat", "rat"]`, sentence `"the cattle was rattled by the battery"` → `"the cat was rat by the bat"`.

<details>
<summary>Hint</summary>

Walk each word through the trie and stop at the first end-of-word node.

</details>

<details>
<summary>Answer</summary>

```java
public class ReplaceWords {

    static class Node {
        Node[] children = new Node[26];
        boolean end;
    }

    static String replace(String[] roots, String sentence) {
        Node trie = new Node();
        for (String r : roots) {
            Node node = trie;
            for (char c : r.toCharArray()) {
                int i = c - 'a';
                if (node.children[i] == null) node.children[i] = new Node();
                node = node.children[i];
            }
            node.end = true;
        }
        StringBuilder out = new StringBuilder();
        for (String word : sentence.split(" ")) {
            if (out.length() > 0) out.append(' ');
            out.append(shortestRoot(trie, word));
        }
        return out.toString();
    }

    private static String shortestRoot(Node trie, String word) {
        Node node = trie;
        for (int i = 0; i < word.length(); i++) {
            node = node.children[word.charAt(i) - 'a'];
            if (node == null) return word;                  // no root matches
            if (node.end) return word.substring(0, i + 1);  // first (shortest) root found
        }
        return word;
    }

    public static void main(String[] args) {
        System.out.println(replace(new String[] {"cat", "bat", "rat"}, "the cattle was rattled by the battery"));
    }
}
```

**Output:**

```text
the cat was rat by the bat
```

**Complexity:** O(total root characters + sentence length).

</details>

### P4. Maximum XOR of two numbers

**Difficulty:** Hard · **Pattern:** Binary trie, greedy on bits

Return the maximum value of `a[i] XOR a[j]` over all pairs.

**Constraints:** 1 ≤ n ≤ 2 × 10⁵; 0 ≤ a[i] < 2³¹.

Example: `[3, 10, 5, 25, 2, 8]` → `28` (5 XOR 25).

<details>
<summary>Hint</summary>

Insert numbers as 31-bit strings from the most significant bit. For each number, walk the trie preferring the **opposite** bit at every level — a 1 in a higher bit beats anything in lower bits.

</details>

<details>
<summary>Answer</summary>

**Approach:** Brute force tries all pairs: O(n²). A trie over bits (alphabet size 2) lets each number find its best partner greedily in 31 steps: O(31 n).

```java
public class MaxXor {

    static class Node {
        Node[] child = new Node[2];
    }

    static int findMaximumXor(int[] nums) {
        Node root = new Node();
        for (int x : nums) {
            Node node = root;
            for (int bit = 30; bit >= 0; bit--) {
                int b = (x >> bit) & 1;
                if (node.child[b] == null) node.child[b] = new Node();
                node = node.child[b];
            }
        }
        int best = 0;
        for (int x : nums) {
            Node node = root;
            int value = 0;
            for (int bit = 30; bit >= 0; bit--) {
                int b = (x >> bit) & 1;
                if (node.child[1 - b] != null) {         // opposite bit gives a 1 in the XOR
                    value |= 1 << bit;
                    node = node.child[1 - b];
                } else {
                    node = node.child[b];
                }
            }
            best = Math.max(best, value);
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(findMaximumXor(new int[] {3, 10, 5, 25, 2, 8}) + " " + findMaximumXor(new int[] {7}));
    }
}
```

**Output:**

```text
28 0
```

**Complexity:** O(31 n) time, O(31 n) space.

</details>

### P5. Find all dictionary words in a grid

**Difficulty:** Hard · **Pattern:** Trie-guided backtracking

Given an r × c board of letters and a list of words, return all words that can be formed by sequentially adjacent cells (up/down/left/right), using each cell at most once per word.

**Constraints:** 1 ≤ r, c ≤ 12; up to 3 × 10⁴ words of length ≤ 10.

Example: board
```text
o a a n
e t a e
i h k r
i f l v
```
words `["oath", "pea", "eat", "rain"]` → `["oath", "eat"]` (any order).

<details>
<summary>Hint</summary>

Searching each word separately repeats work. Build a trie of the words, DFS from every cell, and stop as soon as the current path is not a prefix in the trie. Store the full word at its end node to collect it easily, and clear it once found to avoid duplicates.

</details>

<details>
<summary>Answer</summary>

**Approach:** Backtracking on the grid (mark a cell visited by temporarily replacing its letter), guided by the trie node for the current prefix. Pruning: remove a trie child once it has no remaining words below it, so later searches skip exhausted branches.

```java
import java.util.*;

public class WordSearchTwo {

    static class Node {
        Node[] children = new Node[26];
        String word;                                   // set at the node where a word ends
    }

    static List<String> findWords(char[][] board, String[] words) {
        Node root = new Node();
        for (String w : words) {
            Node node = root;
            for (char c : w.toCharArray()) {
                int i = c - 'a';
                if (node.children[i] == null) node.children[i] = new Node();
                node = node.children[i];
            }
            node.word = w;
        }
        List<String> found = new ArrayList<>();
        for (int r = 0; r < board.length; r++) {
            for (int c = 0; c < board[0].length; c++) {
                dfs(board, r, c, root, found);
            }
        }
        return found;
    }

    private static void dfs(char[][] board, int r, int c, Node parent, List<String> found) {
        if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) return;
        char letter = board[r][c];
        if (letter == '#') return;                     // already on the current path
        Node node = parent.children[letter - 'a'];
        if (node == null) return;                      // no word continues this way: prune
        if (node.word != null) {
            found.add(node.word);
            node.word = null;                          // report each word once
        }
        board[r][c] = '#';                             // choose
        dfs(board, r + 1, c, node, found);             // explore
        dfs(board, r - 1, c, node, found);
        dfs(board, r, c + 1, node, found);
        dfs(board, r, c - 1, node, found);
        board[r][c] = letter;                          // undo
        if (isEmpty(node)) parent.children[letter - 'a'] = null;   // prune exhausted branch
    }

    private static boolean isEmpty(Node node) {
        if (node.word != null) return false;
        for (Node child : node.children) if (child != null) return false;
        return true;
    }

    public static void main(String[] args) {
        char[][] board = {
            {'o', 'a', 'a', 'n'},
            {'e', 't', 'a', 'e'},
            {'i', 'h', 'k', 'r'},
            {'i', 'f', 'l', 'v'}};
        System.out.println(findWords(board, new String[] {"oath", "pea", "eat", "rain"}));
    }
}
```

**Output:**

```text
[oath, eat]
```

**Complexity:** O(r × c × 4 × 3^(L−1)) in the worst case for maximum word length L (4 directions first, then at most 3 because you cannot step back); the trie and pruning make it much faster in practice. Space O(total word characters) for the trie plus O(L) recursion.

</details>
