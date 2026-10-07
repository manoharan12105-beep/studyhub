# Mutex

**Module:** Synchronization · **Interview priority:** Core

## Concept

A **mutex** (mutual-exclusion lock) is a lock with two operations:

- **lock / acquire** — if the mutex is free, take it and continue; if another thread holds it, **block** (sleep) until it is released.
- **unlock / release** — give it back; one waiting thread is woken and gets it.

A mutex has **ownership**: only the thread that locked it may unlock it. At most one thread holds it at any time, so the code between lock and unlock — the [critical section](../critical-section-and-mutual-exclusion/content.md) — runs under mutual exclusion.

## Why It Matters

The mutex is the everyday tool for protecting shared data: `synchronized` and `ReentrantLock` in Java, `pthread_mutex_t` in C, `std::mutex` in C++, `Mutex` in Windows. Knowing how it behaves — blocking, ownership, reentrancy, and how it can deadlock — is essential for any backend or systems interview.

## How It Works

### Inside a mutex

```text
 mutex { locked: true/false, owner: thread id, wait queue: [threads] }

 lock():   if not locked → locked = true, owner = me
           else          → add me to the wait queue and sleep (no CPU used)
 unlock(): if waiters   → wake one, it becomes the owner
           else          → locked = false
```

The check-and-set inside `lock()` must itself be atomic; it is built on hardware instructions such as compare-and-swap. Many implementations **spin briefly** first and only then sleep, because a short wait is cheaper than two context switches.

### Using a mutex correctly

1. Every access to the shared data — reads **and** writes — must hold the **same** mutex.
2. Always release it, even when an exception is thrown (`try`/`finally` in Java).
3. Keep the critical section short.
4. When a thread needs several mutexes, acquire them in a **fixed global order** to avoid [deadlock](../../deadlocks/deadlock-fundamentals/content.md).

### Reentrant (recursive) mutex

A **reentrant** mutex can be locked again by the thread that already owns it; it keeps a hold count and is released when the count returns to zero. Java's `synchronized` and `ReentrantLock` are reentrant, so a synchronized method can call another synchronized method on the same object. A non-reentrant mutex locked twice by the same thread deadlocks on itself.

## Example

Two threads deposit into one account 50,000 times each. The mutex makes `balance += amount` safe:

```java
import java.util.concurrent.locks.ReentrantLock;

public class MutexDemo {

    static class Account {
        private final ReentrantLock lock = new ReentrantLock();
        private int balance;

        Account(int balance) {
            this.balance = balance;
        }

        void deposit(int amount) {
            lock.lock();                       // entry section: one thread at a time past here
            try {
                balance += amount;             // critical section
            } finally {
                lock.unlock();                 // exit section: always runs, even on an exception
            }
        }

        int balance() {
            lock.lock();                       // reads use the same lock
            try {
                return balance;
            } finally {
                lock.unlock();
            }
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Account account = new Account(1_000);
        Runnable depositor = () -> {
            for (int i = 0; i < 50_000; i++) {
                account.deposit(1);
            }
        };
        Thread first = new Thread(depositor);
        Thread second = new Thread(depositor);
        first.start();
        second.start();
        first.join();
        second.join();
        System.out.println("Final balance: " + account.balance());

        ReentrantLock lock = new ReentrantLock();
        lock.lock();
        lock.lock();                           // reentrant: the owner may lock again
        System.out.println("Hold count after locking twice: " + lock.getHoldCount());
        lock.unlock();
        lock.unlock();
        System.out.println("Locked after two unlocks: " + lock.isLocked());
    }
}
```

**Output:**

```text
Final balance: 101000
Hold count after locking twice: 2
Locked after two unlocks: false
```

The same protection with Java's built-in monitor lock:

```java
class SynchronizedAccount {
    private int balance;

    synchronized void deposit(int amount) {    // locks this object's monitor
        balance += amount;
    }

    synchronized int balance() {
        return balance;
    }
}
```

## Important Points

- Mutex = lock with ownership; one holder at a time; waiters sleep.
- Only the owner may unlock it.
- Protect every access (reads too) with the same mutex; release in `finally`.
- Reentrant mutexes allow the owner to lock again (hold count).
- Pitfalls: forgetting to unlock, deadlock from inconsistent lock order, holding a lock during slow work, priority inversion.

## Common Confusion

> [!WARNING]
> **"Only writes need the lock."** A reader without the lock can see a half-updated object or a stale value (no visibility guarantee). Readers and writers must use the same lock — or use a read-write lock that lets readers share.

- **Mutex vs binary semaphore:** both allow one holder, but a mutex has ownership and a semaphore does not — see [Mutex vs Semaphore](../mutex-vs-semaphore/content.md).
- **A mutex does not lock data.** It only works if every piece of code that touches the data agrees to acquire it first.

## Interview Perspective

- *"What is a mutex? How does it work?"* — lock/unlock, ownership, wait queue.
- *"What happens if a thread tries to lock a mutex it already holds?"* — reentrant: count increases; non-reentrant: deadlock.
- *"Spinlock vs mutex?"* — busy-wait vs sleep.
- *"What problems can mutexes cause?"* — deadlock, priority inversion, contention, forgetting to unlock.

## Quick Revision

- Mutex: lock → critical section → unlock; one owner; others sleep.
- Owner-only unlock; release in `finally`.
- Reentrant = owner may re-lock (Java `synchronized`, `ReentrantLock`).
- Same lock for all accesses; fixed lock order; short critical sections.
