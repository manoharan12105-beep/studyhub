# Introduction to Data Structures and Algorithms — Practice

### P1. Which of these is an abstract data type rather than a data structure?

**Difficulty:** Easy · **Pattern:** ADT vs implementation

- A) `ArrayList`
- B) Queue
- C) Circular array
- D) Singly linked list

<details>
<summary>Hint</summary>

An ADT only promises operations; it does not say how they are stored.

</details>

<details>
<summary>Answer</summary>

**Answer:** B) Queue

**Explanation:** A queue is a contract (offer, poll, peek in FIFO order). `ArrayList`, a circular array and a singly linked list are concrete layouts in memory that can implement various ADTs.

</details>

### P2. A program needs to check "has this email already registered?" millions of times and never needs the emails in order. Which structure fits best?

**Difficulty:** Easy · **Pattern:** Choose by operation

- A) Unsorted array
- B) Sorted array
- C) Hash set
- D) Linked list

<details>
<summary>Hint</summary>

The only frequent operation is membership testing, and order does not matter.

</details>

<details>
<summary>Answer</summary>

**Answer:** C) Hash set

**Explanation:** Membership in a hash set is O(1) on average. A sorted array gives O(log n) lookups but O(n) insertion to keep it sorted; an unsorted array or list needs O(n) per lookup.

</details>

### P3. Which operation is cheap in an array but expensive in a linked list?

**Difficulty:** Easy · **Pattern:** Layout trade-off

- A) Inserting after a node you already hold a reference to
- B) Reading the element at index i
- C) Removing the first element
- D) Adding an element at the front

<details>
<summary>Hint</summary>

Think about how each layout finds position i.

</details>

<details>
<summary>Answer</summary>

**Answer:** B) Reading the element at index i

**Explanation:** An array computes the address of element i directly (O(1)). A linked list must follow i `next` references (O(n)). Options A, C and D are O(1) for a linked list but O(n) at the front of an array, because every element shifts.

</details>

### P4. A task scheduler repeatedly inserts tasks and always removes the task with the smallest deadline. Which ADT describes what it needs, and which data structure usually implements it?

**Difficulty:** Medium · **Pattern:** Choose by operation

<details>
<summary>Hint</summary>

"Always remove the smallest" is the defining operation.

</details>

<details>
<summary>Answer</summary>

**Answer:** The ADT is a **priority queue**; it is usually implemented with a **binary heap** (`PriorityQueue` in Java).

**Explanation:** A heap gives O(log n) insert and O(log n) remove-min. A sorted array would make remove-min O(1) but insertion O(n); an unsorted array makes insertion O(1) but remove-min O(n). With many of both operations, the heap's O(log n) for each wins. See [Heap](../../data-structures/heap/content.md).

</details>

### P5. Why is `List<Integer> list = new ArrayList<>();` preferred over `ArrayList<Integer> list = new ArrayList<>();` in most Java code?

**Difficulty:** Medium · **Pattern:** ADT vs implementation

<details>
<summary>Hint</summary>

Which type does the rest of the code depend on?

</details>

<details>
<summary>Answer</summary>

**Answer:** It programs to the ADT (`List`) instead of the implementation.

**Explanation:** The rest of the code can only use `List` operations, so switching to `LinkedList` later changes one line. Use the concrete type only when you need a method that exists only on the class (rare in interview code).

</details>

### P6. You must store 10⁶ numbers, frequently ask for the k-th smallest among those inserted so far, and also insert new numbers. A teammate suggests re-sorting an array after every insert. Estimate the cost of n inserts with that approach and name a better one.

**Difficulty:** Hard · **Pattern:** Total cost estimation

<details>
<summary>Hint</summary>

Total cost = number of operations × cost of each operation.

</details>

<details>
<summary>Answer</summary>

**Answer:** Re-sorting each time costs O(n log n) per insert, so O(n² log n) in total — about 10¹³ steps for n = 10⁶, far too slow.

**Better:** Insert into an already-sorted array with binary search + shift (O(n) per insert, O(n²) total — still too slow at 10⁶). For dynamic order statistics, use an order-statistic balanced BST, or a [Fenwick tree](../../data-structures/fenwick-tree/content.md) over compressed values when all values are known in advance: O(log n) per insert and per k-th query, O(n log n) total. If k is fixed, a max-heap holding the k smallest values is enough (see [Heap Applications](../../data-structures/heap-applications/content.md)).

</details>
