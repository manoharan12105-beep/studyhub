# Iterator — Interview Questions

## Conceptual

### Q1. What is the Iterator pattern?

<details>
<summary>Answer</summary>

A behavioral pattern that provides sequential access to the elements of a collection without exposing its internal structure. The collection creates an iterator object that tracks the position and offers `hasNext()`/`next()`. In Java, `Iterable<T>` (with `iterator()`) and `Iterator<T>` implement the pattern, and the enhanced `for` loop uses them.

</details>

### Q2. What is a fail-fast iterator?

<details>
<summary>Answer</summary>

An iterator that detects structural modification of its collection made other than through the iterator itself and throws `ConcurrentModificationException` on a best-effort basis. `ArrayList` and `HashMap` iterators are fail-fast (they compare a modification count). Concurrent collections such as `ConcurrentHashMap` provide weakly consistent iterators, and `CopyOnWriteArrayList` provides snapshot iterators that never throw.

</details>

### Q3. How do you remove elements safely while iterating?

<details>
<summary>Answer</summary>

Use the iterator's own `remove()` method in an explicit `while (it.hasNext())` loop, or `collection.removeIf(predicate)`. Calling `list.remove(x)` inside a for-each loop modifies the list behind the iterator's back and usually causes `ConcurrentModificationException` (or silently skips an element in an edge case).

</details>

### Q4. What is the difference between `Iterable` and `Iterator`?

<details>
<summary>Answer</summary>

`Iterable<T>` is the aggregate: something that can produce iterators via `iterator()` (and supports for-each and `forEach`). `Iterator<T>` is the traversal object with the current position (`hasNext`, `next`, optional `remove`). One `Iterable` can create many independent iterators.

</details>

### Q5. Internal vs external iteration?

<details>
<summary>Answer</summary>

External iteration: the client controls the loop by asking the iterator for each element (`for`, `while`). Internal iteration: the client passes behaviour and the collection controls the loop (`forEach(action)`, streams), which allows the library to optimise (laziness, parallelism) but makes early exit and checked exceptions less convenient.

</details>

## Applied

### Q6. How would you make a custom `Matrix` class usable in a for-each loop that visits cells row by row?

<details>
<summary>Answer</summary>

Implement `Iterable<Integer>` (or `Iterable<Cell>`) and return a new iterator from `iterator()` that keeps `row` and `col` indices: `hasNext()` checks `row < rows`; `next()` returns the current value, advances `col`, wraps to the next row at the end of a row, and throws `NoSuchElementException` when exhausted. Return a fresh iterator on each call so loops do not interfere.

</details>
