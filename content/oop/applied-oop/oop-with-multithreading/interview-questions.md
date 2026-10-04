# OOP with Multithreading — Interview Questions

## Conceptual

### Q1. What makes a class thread-safe?

<details>
<summary>Answer</summary>

Its objects behave correctly when accessed by multiple threads simultaneously, without callers adding synchronisation. A class achieves this by not sharing mutable state (confinement), making state immutable, or coordinating every access to shared mutable state (synchronisation, atomics, concurrent collections) — with all such state encapsulated so outside code cannot bypass the coordination.

</details>

### Q2. Why are immutable objects thread-safe?

<details>
<summary>Answer</summary>

Data races need a write to shared state; immutable objects are never written after construction. Java's memory model also guarantees that `final` fields of a properly constructed object (one whose `this` did not escape the constructor) are visible to all threads. So immutable objects can be shared freely without locks.

</details>

### Q3. What is a race condition? Give an example.

<details>
<summary>Answer</summary>

A bug where the result depends on the relative timing of threads. Example: `count++` is a read, an add and a write; two threads can both read 41 and both write 42, losing an update. Another example is check-then-act: `if (!map.containsKey(k)) map.put(k, v)` — another thread can insert between the check and the put.

</details>

### Q4. How does encapsulation help in writing thread-safe classes?

<details>
<summary>Answer</summary>

Thread safety requires every access to shared state to follow the same locking policy. If fields are private and internal objects never leak, all access goes through the class's methods, so the class can enforce that policy in one place. Public fields or getters returning mutable internals let other code bypass the locks.

</details>

### Q5. Is a class composed of thread-safe objects automatically thread-safe?

<details>
<summary>Answer</summary>

No. If the class has an invariant that spans several components (for example `lower <= upper` stored in two `AtomicInteger`s), each component's atomicity does not make the combined check-and-update atomic. The class must guard the invariant with a single lock or store the related values in one immutable object replaced atomically. Delegation alone is enough only when the components are independent.

</details>

### Q6. Why prefer a private lock object over `synchronized` methods?

<details>
<summary>Answer</summary>

`synchronized` methods lock on `this`, which any code holding a reference can also lock on — accidentally or maliciously — causing contention or deadlock that the class cannot control. A `private final Object lock` is encapsulated: only the class can use it, and the locking policy stays an implementation detail.

</details>

## Applied

### Q7. A Spring `@Service` (a singleton) has a field `private Cart currentCart;` that each request sets and then uses. What is the problem?

<details>
<summary>Answer</summary>

The service instance is shared by all request threads, so `currentCart` is shared mutable state: one request can overwrite another's cart between setting and using it, mixing up customers' data. Services should be stateless — pass the cart as a method parameter (or load it per request) so it lives on each thread's stack, i.e. thread confinement.

</details>

### Q8. How would you design a thread-safe `BankAccount.transfer(BankAccount to, long amount)` that cannot deadlock?

<details>
<summary>Answer</summary>

Each account protects its balance with its own lock. A transfer needs both locks; to avoid two opposite transfers deadlocking, always acquire the locks in a consistent global order, for example by account id: lock the lower-id account first, then the higher. Inside both locks, check the balance and move the money, so the check and the update are atomic. Alternatively use `ReentrantLock.tryLock` with a timeout and retry.

</details>
