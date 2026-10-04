# Java Cheat Sheet

The library calls you will type in almost every solution, with the traps next to them.

## Stacks, Queues and Heaps

```java
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1); stack.peek(); stack.pop();                     // top = front

Deque<Integer> queue = new ArrayDeque<>();
queue.offer(1); queue.peek(); queue.poll();                   // FIFO; poll() returns null when empty

PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
PriorityQueue<int[]> byFirst = new PriorityQueue<>((x, y) -> Integer.compare(x[0], y[0]));
```

- Never use `java.util.Stack`; `ArrayDeque` rejects `null`.
- Heap iteration order is not sorted — only `poll` is.

## Maps and Sets

```java
Map<String, Integer> count = new HashMap<>();
count.merge("a", 1, Integer::sum);                            // increment
int c = count.getOrDefault("b", 0);
Map<Integer, List<Integer>> groups = new HashMap<>();
groups.computeIfAbsent(7, key -> new ArrayList<>()).add(1);   // multimap

TreeMap<Integer, String> tm = new TreeMap<>();
tm.put(10, "x");
Integer floor = tm.floorKey(12), ceil = tm.ceilingKey(12);    // null when absent
Map<Integer, Integer> lru = new LinkedHashMap<>(16, 0.75f, true);   // access order
```

## Arrays, Lists and Sorting

```java
int[] a = {5, 2, 9};
Arrays.sort(a);                                               // primitives: ascending only
Integer[] boxed = {5, 2, 9};
Arrays.sort(boxed, Collections.reverseOrder());               // descending needs objects
int[][] pairs = {{1, 9}, {1, 3}, {0, 5}};
Arrays.sort(pairs, (x, y) -> x[0] != y[0] ? Integer.compare(x[0], y[0]) : Integer.compare(y[1], x[1]));
List<Integer> nums = new ArrayList<>(List.of(3, 1, 2));
nums.sort(Comparator.naturalOrder());
nums.remove(Integer.valueOf(3));                              // by value; remove(0) is by index
int[] filled = new int[5];
Arrays.fill(filled, -1);
int pos = Arrays.binarySearch(a, 6);                          // −(insertion point) − 1 if absent
```

## Strings and Characters

```java
StringBuilder sb = new StringBuilder();
sb.append('x').append(42).reverse();
String text = sb.toString();
char[] chars = "hello".toCharArray();
int[] freq = new int[26];
for (char ch : chars) freq[ch - 'a']++;
boolean digit = Character.isDigit('7'), letter = Character.isLetter('q');
String joined = String.join(",", List.of("a", "b"));
String[] parts = "a  b c".trim().split("\\s+");
```

- Compare strings with `equals`, never `==`.

## Numbers and Bits

```java
long big = (long) Integer.MAX_VALUE * 2;                      // cast before multiplying
int mod = Math.floorMod(-7, 3);                               // 2, never negative
int cmp = Integer.compare(5, 9);                              // safe comparator
int ones = Integer.bitCount(29), low = Integer.numberOfTrailingZeros(8);
long mask = 1L << 40;                                         // 1 << 40 would wrap in int
int mid = (0 + 1_000_000_000) >>> 1;                          // overflow-safe midpoint
final int MOD = 1_000_000_007;
```
