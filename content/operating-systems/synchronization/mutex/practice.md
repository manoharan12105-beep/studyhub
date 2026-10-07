# Mutex — Practice

### P1. Who may unlock?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** mutex ownership

A mutex can be unlocked by:

- A) Any thread in the process
- B) Only the thread that locked it
- C) Only the kernel
- D) Any thread waiting for it

<details>
<summary>Answer</summary>

**Answer:** B) Only the thread that locked it

</details>

### P2. Waiting thread state

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** blocking

A thread blocked on a held mutex (not spinning) is in which state?

- A) Running
- B) Ready
- C) Waiting
- D) Terminated

<details>
<summary>Answer</summary>

**Answer:** C) Waiting

It moves to Ready when the mutex is released and handed to it.

</details>

### P3. Find the bug

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** releasing locks

After a few hours in production, every request thread of a service hangs inside `transfer()`. What is the likely cause?

```java
void transfer(Account to, int amount) {
    lock.lock();
    if (balance < amount) {
        throw new IllegalStateException("insufficient funds");
    }
    balance -= amount;
    to.deposit(amount);
    lock.unlock();
}
```

<details>
<summary>Answer</summary>

When the exception is thrown, `unlock()` never runs, so the lock stays held forever and every later caller blocks. Wrap the body in `try { … } finally { lock.unlock(); }`.

</details>

### P4. Output of reentrant locking

**Difficulty:** Medium · **Type:** Output · **Concepts:** reentrant mutex

What does this print?

```java
ReentrantLock lock = new ReentrantLock();
lock.lock();
lock.lock();
lock.unlock();
System.out.println(lock.isHeldByCurrentThread() + " " + lock.getHoldCount());
```

<details>
<summary>Answer</summary>

`true 1` — the lock was acquired twice and released once, so the current thread still holds it with a hold count of 1.

</details>

### P5. Lock order

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** deadlock, lock ordering

`transfer(a, b)` locks account `a` then account `b`. Thread 1 calls `transfer(x, y)` while thread 2 calls `transfer(y, x)`. What can happen, and how would you order the locks to fix it?

<details>
<summary>Answer</summary>

Thread 1 locks x and waits for y; thread 2 locks y and waits for x — deadlock. Fix: always lock the two accounts in a global order independent of the transfer direction, for example the account with the smaller id first. Both threads then lock x (say) first, so one of them simply waits until the other finishes.

</details>
