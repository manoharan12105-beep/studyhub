# Trie

## Definition

A **trie** (prefix tree, pronounced "try") is a tree that stores strings character by character: each edge represents one character, so every path from the root spells a **prefix**, and nodes marked **end-of-word** complete a stored word. Insert, search and prefix queries take **O(L)** time for a string of length L, independent of how many words are stored.

## Why It Matters

Tries answer prefix questions that hash maps cannot answer efficiently: "which words start with *pre*?", "how many words share this prefix?", "what is the longest prefix of this string that is a word?". They power autocomplete, spell checkers, IP routing (longest prefix match), and word games. In interviews they appear in word-search, dictionary and XOR problems.

## Core Concept

### Node structure

```java
class TrieNode {
    TrieNode[] children = new TrieNode[26];   // one slot per letter 'a'..'z'
    boolean isEndOfWord;                      // a stored word ends here
}
```

- The root represents the empty prefix and stores no character.
- Shared prefixes are stored **once**: "car", "cart" and "care" share the path c → a → r.
- The end-of-word flag distinguishes a stored word ("car") from a mere prefix of other words ("ca").

### Children: array vs map

| Children as | Lookup | Memory per node | Use when |
|-------------|--------|-----------------|----------|
| `TrieNode[26]` | O(1), direct index `c − 'a'` | 26 references even if mostly empty | small fixed alphabet (lowercase letters, digits, bits) |
| `HashMap<Character, TrieNode>` | O(1) average | only existing children | large or unknown alphabets (Unicode, URLs) |

## Visual Explanation

```text
Words: car, cart, care, cat, dog          (* = end of word)

            (root)
           /      \
          c        d
          |        |
          a        o
        /   \      |
       r*    t*    g*
      /  \
     t*   e*

startsWith("ca") → reach node "ca" → words below: car, cart, care, cat
search("ca")     → node exists but is not marked * → false
```

## Operations

### Insert

1. Start at the root.
2. For each character, move to the child for that character, creating it if missing.
3. Mark the last node as end-of-word.

```java
void insert(TrieNode root, String word) {
    TrieNode node = root;
    for (char c : word.toCharArray()) {
        int i = c - 'a';
        if (node.children[i] == null) {
            node.children[i] = new TrieNode();
        }
        node = node.children[i];
    }
    node.isEndOfWord = true;
}
```

**Time:** O(L) · **Space:** up to O(L) new nodes

### Search and prefix search

Walk the characters; if a child is missing, the word/prefix is absent. **Search** additionally requires the final node to be end-of-word; **startsWith** does not.

**Time:** O(L) · **Space:** O(1)

### Delete

Unmark end-of-word, then remove nodes that are no longer needed — those with no children and not ending another word — working back up from the end (naturally done recursively).

1. Recurse to the last character's node; if not end-of-word, the word is absent.
2. Unmark it.
3. On the way back, delete a child pointer if that child has no children and is not end-of-word.

**Time:** O(L)

### Counting words with a prefix

Store `prefixCount` in each node and increment it along the insertion path. Then "how many words start with p?" is the `prefixCount` of p's node: O(len(p)).

### Dictionary and autocomplete

Walk to the prefix's node, then DFS below it collecting words (append characters while descending, record at end-of-word nodes). Visiting children in index order returns suggestions in **alphabetical** order. For "top 3 suggestions" store the best few words in each node, or limit the DFS.

### Word search on a grid (multiple words)

To find which dictionary words appear in a letter grid, build a trie of the dictionary and run a DFS from each cell, moving to a neighbour only while the path is still a prefix in the trie. The trie prunes every path that cannot become a word — searching each word separately would repeat that work for every word. Worked solution: practice P5.

## Full Java Implementation

```java
import java.util.*;

public class Trie {

    private static class Node {
        Node[] children = new Node[26];
        boolean isEndOfWord;
        int prefixCount;                         // words passing through this node
    }

    private final Node root = new Node();

    public void insert(String word) {
        if (search(word)) return;                // keep prefix counts exact for duplicates
        Node node = root;
        for (char c : word.toCharArray()) {
            int i = c - 'a';
            if (node.children[i] == null) node.children[i] = new Node();
            node = node.children[i];
            node.prefixCount++;
        }
        node.isEndOfWord = true;
    }

    private Node walk(String s) {
        Node node = root;
        for (char c : s.toCharArray()) {
            node = node.children[c - 'a'];
            if (node == null) return null;
        }
        return node;
    }

    public boolean search(String word) {
        Node node = walk(word);
        return node != null && node.isEndOfWord;
    }

    public boolean startsWith(String prefix) {
        return walk(prefix) != null;
    }

    public int countWithPrefix(String prefix) {
        Node node = walk(prefix);
        return node == null ? 0 : node.prefixCount;
    }

    public List<String> autocomplete(String prefix) {
        List<String> out = new ArrayList<>();
        Node node = walk(prefix);
        if (node != null) collect(node, new StringBuilder(prefix), out);
        return out;
    }

    private void collect(Node node, StringBuilder path, List<String> out) {
        if (node.isEndOfWord) out.add(path.toString());
        for (int i = 0; i < 26; i++) {
            if (node.children[i] != null) {
                path.append((char) ('a' + i));
                collect(node.children[i], path, out);
                path.deleteCharAt(path.length() - 1);   // backtrack
            }
        }
    }

    public boolean delete(String word) {
        if (!search(word)) return false;
        delete(root, word, 0);
        return true;
    }

    // Returns true if the child at this depth can be removed by its parent.
    private boolean delete(Node node, String word, int depth) {
        if (depth == word.length()) {
            node.isEndOfWord = false;
        } else {
            int i = word.charAt(depth) - 'a';
            Node child = node.children[i];
            child.prefixCount--;
            if (delete(child, word, depth + 1)) node.children[i] = null;
        }
        return node != root && !node.isEndOfWord && node.prefixCount == 0;
    }

    public static void main(String[] args) {
        Trie trie = new Trie();
        for (String w : new String[] {"car", "cart", "care", "cat", "dog"}) trie.insert(w);

        System.out.println("search car=" + trie.search("car") + " ca=" + trie.search("ca") + " cars=" + trie.search("cars"));
        System.out.println("startsWith ca=" + trie.startsWith("ca") + " do=" + trie.startsWith("do") + " x=" + trie.startsWith("x"));
        System.out.println("count ca=" + trie.countWithPrefix("ca") + " car=" + trie.countWithPrefix("car"));
        System.out.println("autocomplete ca -> " + trie.autocomplete("ca"));

        trie.delete("car");
        System.out.println("after delete car: search car=" + trie.search("car") + " cart=" + trie.search("cart") + " count car=" + trie.countWithPrefix("car"));
        trie.delete("dog");
        System.out.println("after delete dog: startsWith d=" + trie.startsWith("d"));
    }
}
```

**Output:**

```text
search car=true ca=false cars=false
startsWith ca=true do=true x=false
count ca=4 car=3
autocomplete ca -> [car, care, cart, cat]
after delete car: search car=false cart=true count car=2
after delete dog: startsWith d=false
```

## Dry Run

`insert("care")` after "car" and "cart" exist:

| Char | Node exists? | Action | prefixCount after |
|------|--------------|--------|-------------------|
| c | yes | move | 3 |
| a | yes | move | 3 |
| r | yes | move | 3 |
| e | no | create, move | 1 |
| end | — | mark end-of-word | — |

Only one new node was created: the shared prefix "car" is reused.

## Complexity Summary

| Operation | Time | Space |
|-----------|------|-------|
| Insert | O(L) | O(L) new nodes worst case |
| Search / startsWith | O(L) | O(1) |
| Delete | O(L) | O(L) recursion |
| Count with prefix (stored counts) | O(L) | O(1) |
| Autocomplete | O(L + size of the subtree below the prefix) | O(depth) |
| Total memory | — | O(total characters × alphabet) worst case with arrays |

## Advantages

- O(L) operations regardless of the number of words.
- Prefix queries, autocomplete and sorted enumeration come for free.
- No hash collisions; shared prefixes are stored once.

## Disadvantages

- High memory use, especially with 26-slot arrays in sparse tries.
- Slower than a `HashSet` for plain "is this exact word present?" checks in practice (many small objects, pointer chasing).

## Comparison

| | Trie | `HashSet<String>` | Sorted list + binary search |
|---|------|-------------------|-----------------------------|
| Exact lookup | O(L) | O(L) average (hashing the string) | O(L log n) |
| Prefix exists / count | O(L) | O(n × L) scan | O(L log n) |
| All words with prefix (k results) | O(L + output) | O(n × L) | O(L log n + output) |
| Sorted enumeration | O(total chars) | O(n log n) sort | O(n) |
| Memory | high | moderate | low |

Choose a hash set for exact membership only; choose a trie when prefixes matter.

## Java Collections Equivalent

There is no trie in the JDK. A `TreeSet<String>` with `ceiling(prefix)`/`subSet(prefix, prefix + Character.MAX_VALUE)` can answer prefix queries in O(L log n) — an acceptable shortcut in some interviews.

## Real-World Applications

- Search-box autocomplete and spell checking.
- IP routing tables (longest prefix match on bits).
- T9-style predictive text, word games (Boggle, Scrabble solvers).
- Binary tries for "maximum XOR" queries.

## Common Mistakes

- Forgetting the end-of-word flag: "ca" would be reported as a word because "car" exists.
- `search` returning true at the end of the walk without checking the flag.
- Deleting nodes still used by other words (check children and end-of-word before removing).
- Using `c - 'a'` with uppercase or non-letter input.

## Key Takeaways

- Each node = one character position; paths = prefixes; end-of-word marks complete words.
- Insert, search and prefix checks are O(L).
- Arrays for small alphabets, maps for large ones.
- Use a trie when the problem is about prefixes; a hash set when it is only about exact words.
