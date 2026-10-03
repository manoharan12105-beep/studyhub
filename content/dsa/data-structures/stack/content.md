# Stack

## Definition

A **stack** is a linear abstract data type that follows **LIFO** — last in, first out. Elements are added (**push**) and removed (**pop**) at the same end, the **top**; **peek** reads the top without removing it. All three operations are O(1).

## Why It Matters

Whenever the most recent unfinished item must be handled first, a stack is the right tool: matching brackets, undo, the browser back button, evaluating expressions, and — most importantly — **recursion itself**, which runs on the call stack. Any recursive algorithm can be rewritten with an explicit stack. Stacks also power the [Monotonic Stack](../../patterns/monotonic-stack/content.md) pattern for "next greater element" problems.

## Core Concept

The invariant: only the top is accessible. Elements below it are hidden until everything above them is popped. This makes a stack a natural record of **nested** or **pending** work:

- Opening a bracket starts something that must be closed before the outer bracket closes → push on open, pop on close.
- Calling a function suspends the caller until the callee returns → push a frame on call, pop on return.

| Operation | Meaning | Empty-stack behaviour |
|-----------|---------|------------------------|
| `push(x)` | put x on top | — |
| `pop()` | remove and return the top | error (underflow) |
| `peek()` | return the top | error or `null` |
| `isEmpty()` | true if no elements | — |
| `size()` | number of elements | — |

## Visual Explanation

```text
push 10     push 20     push 30     pop → 30    peek → 20
                        ┌────┐
            ┌────┐      │ 30 │ ← top
┌────┐      │ 20 │      │ 20 │      ┌────┐
│ 10 │      │ 10 │      │ 10 │      │ 20 │ ← top
└────┘      └────┘      └────┘      │ 10 │
                                    └────┘
```

## Types

| Implementation | push / pop | Notes |
|----------------|-----------|-------|
| Array with a `top` index (fixed capacity) | O(1) | overflow when full |
| Dynamic array | O(1) amortized | grows when full |
| Singly linked list (push/pop at the head) | O(1) worst case | one node allocation per push |
| `ArrayDeque` (Java) | O(1) amortized | the recommended library choice |
| `java.util.Stack` | O(1) | legacy; synchronized, extends `Vector` |

## Operations

### Array-based stack

`top` is the index of the current top element (−1 when empty).

```java
// Fixed-capacity stack of ints.
int[] data = new int[100];   // capacity chosen up front
int top = -1;

void push(int x) {
    if (top == data.length - 1) throw new IllegalStateException("overflow");
    data[++top] = x;
}

int pop() {
    if (top == -1) throw new IllegalStateException("underflow");
    return data[top--];
}

int peek() {
    if (top == -1) throw new IllegalStateException("empty");
    return data[top];
}
```

**Time:** O(1) each · **Space:** O(capacity)

### Linked-list-based stack

Push and pop at the **head** — both O(1), no capacity limit.

```java
// Node: int val; ListNode next;
ListNode head = null;

void push(int x) {
    ListNode node = new ListNode(x);
    node.next = head;
    head = node;
}

int pop() {
    if (head == null) throw new IllegalStateException("underflow");
    int value = head.val;
    head = head.next;
    return value;
}
```

**Time:** O(1) each · **Space:** O(n)

### Deque as a stack (Java)

```java
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1);            // addFirst
stack.push(2);
int top = stack.peek();   // 2 (null if empty)
int removed = stack.pop();// 2 (NoSuchElementException if empty)
boolean empty = stack.isEmpty();
```

`java.util.Stack` works too, but it is synchronized and inherits list methods such as `get(i)`; see [Java Toolkit: Stack, Queue, Deque and PriorityQueue](../../fundamentals/java-stacks-and-queues/content.md).

### Monotonic stack (overview)

A **monotonic stack** keeps its elements in increasing or decreasing order by popping everything that would break the order before pushing. Each element is pushed and popped at most once, so processing n elements is O(n) in total. It answers "next/previous greater or smaller element" for every position in one pass. Full treatment: [Monotonic Stack](../../patterns/monotonic-stack/content.md).

## Full Java Implementation

A generic linked-list stack plus a classic use — checking balanced brackets:

```java
import java.util.*;

public class StackDemo {

    static class LinkedStack<T> {
        private static class Node<T> {
            T value;
            Node<T> next;
            Node(T value, Node<T> next) {
                this.value = value;
                this.next = next;
            }
        }

        private Node<T> top;
        private int size;

        void push(T value) {
            top = new Node<>(value, top);
            size++;
        }

        T pop() {
            if (top == null) {
                throw new NoSuchElementException("stack is empty");
            }
            T value = top.value;
            top = top.next;
            size--;
            return value;
        }

        T peek() {
            if (top == null) {
                throw new NoSuchElementException("stack is empty");
            }
            return top.value;
        }

        boolean isEmpty() {
            return top == null;
        }

        int size() {
            return size;
        }
    }

    // Each closing bracket must match the most recent unmatched opening bracket.
    static boolean isBalanced(String s) {
        LinkedStack<Character> stack = new LinkedStack<>();
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '[' || c == '{') {
                stack.push(c);
            } else if (c == ')' || c == ']' || c == '}') {
                if (stack.isEmpty()) {
                    return false;                       // closing with nothing open
                }
                char open = stack.pop();
                if ((c == ')' && open != '(') || (c == ']' && open != '[') || (c == '}' && open != '{')) {
                    return false;
                }
            }
        }
        return stack.isEmpty();                         // nothing left unclosed
    }

    public static void main(String[] args) {
        LinkedStack<Integer> stack = new LinkedStack<>();
        stack.push(10);
        stack.push(20);
        stack.push(30);
        System.out.println("pop " + stack.pop() + ", peek " + stack.peek() + ", size " + stack.size());

        for (String s : new String[] {"{[()()]}", "([)]", "((", ")("}) {
            System.out.println(s + " -> " + isBalanced(s));
        }
    }
}
```

**Output:**

```text
pop 30, peek 20, size 2
{[()()]} -> true
([)] -> false
(( -> false
)( -> false
```

## Dry Run

`isBalanced("{[()]}")`:

| Char | Action | Stack (bottom → top) |
|------|--------|----------------------|
| `{` | push | `{` |
| `[` | push | `{ [` |
| `(` | push | `{ [ (` |
| `)` | pop `(` — matches | `{ [` |
| `]` | pop `[` — matches | `{` |
| `}` | pop `{` — matches | empty |
| end | stack empty → **true** | |

For `"([)]"`: after `(` and `[` are pushed, `)` pops `[` — mismatch → false.

## Complexity Summary

| Operation | Array (fixed) | Dynamic array / `ArrayDeque` | Linked list |
|-----------|---------------|------------------------------|-------------|
| push | O(1) | O(1) amortized | O(1) |
| pop | O(1) | O(1) | O(1) |
| peek | O(1) | O(1) | O(1) |
| search | O(n) | O(n) | O(n) |
| Space | O(capacity) | O(n) | O(n) + node overhead |

## Advantages

- O(1) operations; trivial to implement.
- Naturally models nesting, backtracking and recursion.

## Disadvantages

- Access only at the top; finding anything else is O(n).
- Fixed-size array stacks can overflow.

## Comparison

| | Stack | Queue |
|---|-------|-------|
| Order | LIFO | FIFO |
| Insert / remove | same end (top) | opposite ends (rear / front) |
| Typical uses | recursion, DFS, undo, parsing | BFS, scheduling, buffering |
| Java | `Deque` via `ArrayDeque` (`push`/`pop`) | `Queue` via `ArrayDeque` (`offer`/`poll`) |

## Java Collections Equivalent

`Deque<T> stack = new ArrayDeque<>()` with `push`, `pop`, `peek`, `isEmpty`. Avoid `Stack` in new code; know that it exists and iterates bottom-to-top.

## Real-World Applications

- The call stack of every program (and `StackOverflowError` when it runs out).
- Undo/redo in editors (two stacks).
- Browser back/forward navigation.
- Expression evaluation and syntax checking in compilers.
- Iterative DFS and backtracking.

## Common Mistakes

- Popping or peeking an empty stack — check `isEmpty()` first.
- Forgetting the final `isEmpty()` check in bracket matching (unclosed brackets).
- Using `Stack` or `ArrayList.remove(0)`-style code instead of `ArrayDeque`.
- Pushing indices vs values inconsistently in monotonic-stack problems.

## Key Takeaways

- LIFO; push, pop, peek in O(1).
- Implement with an array + top index or a linked list at the head; use `ArrayDeque` in Java.
- Stacks model nesting and pending work: brackets, recursion, DFS, undo.
- Monotonic stacks answer next-greater/smaller queries in O(n) total.
