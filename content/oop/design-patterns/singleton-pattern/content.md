# Singleton

**Category:** Creational · **Interview priority:** Core

## Intent

Ensure a class has **exactly one instance** and provide a **global point of access** to it.

## The Problem

Some resources should exist only once per application: a configuration loaded at startup, a connection pool, an in-memory cache, a registry of plugins. Creating several instances would waste resources (several pools opening connections) or cause inconsistency (two caches disagreeing).

## Why the Naive Solution Fails

```java
class AppConfig {
    AppConfig() {
        // reads config files: expensive
    }
}

// Every caller does: new AppConfig()
```

- Nothing stops callers from creating many instances.
- Passing one instance around manually through every layer is tedious in large code bases (which is what dependency injection containers later solved).
- A `public static AppConfig INSTANCE` field alone does not stop `new AppConfig()` elsewhere.

## The Pattern Idea

Let the **class itself** control its instantiation: make the constructor `private`, keep the single instance in a `static` field, and expose it through a static method (or a public static final field).

## Structure

```text
┌───────────────────────────────┐
│ Singleton                     │
├───────────────────────────────┤
│ - {static} instance: Singleton│
├───────────────────────────────┤
│ - Singleton()                 │  ← private constructor
│ + {static} getInstance()      │  ← the only way to obtain it
│ + businessMethod()            │
└───────────────────────────────┘
```

| Participant | Role |
|-------------|------|
| Singleton | Holds its own unique instance; prevents outside construction; provides access |
| Client | Obtains the instance through `getInstance()` (or the enum constant) |

## Java Implementation

Five common variants, from simplest to most robust:

```java
public class SingletonVariants {

    // 1. Eager initialisation: created when the class is initialised; thread-safe by class-loading rules
    static final class EagerConfig {
        private static final EagerConfig INSTANCE = new EagerConfig();

        private EagerConfig() { }

        static EagerConfig getInstance() {
            return INSTANCE;
        }
    }

    // 2. Lazy initialisation: created on first use — NOT thread-safe
    static final class LazyConfig {
        private static LazyConfig instance;

        private LazyConfig() { }

        static LazyConfig getInstance() {
            if (instance == null) {                 // two threads can both see null here
                instance = new LazyConfig();
            }
            return instance;
        }
    }

    // 3. Thread-safe lazy: synchronised method — correct, but locks on every call
    static final class SynchronizedConfig {
        private static SynchronizedConfig instance;

        private SynchronizedConfig() { }

        static synchronized SynchronizedConfig getInstance() {
            if (instance == null) {
                instance = new SynchronizedConfig();
            }
            return instance;
        }
    }

    // 4. Double-checked locking: lock only while creating; the field MUST be volatile
    static final class DclConfig {
        private static volatile DclConfig instance;

        private DclConfig() { }

        static DclConfig getInstance() {
            DclConfig result = instance;            // one volatile read on the fast path
            if (result == null) {
                synchronized (DclConfig.class) {
                    result = instance;
                    if (result == null) {            // second check inside the lock
                        result = new DclConfig();
                        instance = result;
                    }
                }
            }
            return result;
        }
    }

    // 4b. Initialisation-on-demand holder: lazy and thread-safe without explicit locking
    static final class HolderConfig {
        private HolderConfig() { }

        private static final class Holder {          // loaded only when getInstance() first runs
            static final HolderConfig INSTANCE = new HolderConfig();
        }

        static HolderConfig getInstance() {
            return Holder.INSTANCE;
        }
    }

    // 5. Enum singleton: thread-safe, serialisation-safe, reflection-safe
    enum IdGenerator {
        INSTANCE;

        private long next = 1;

        synchronized long nextId() {                 // the instance is single; its state still needs thread safety
            return next++;
        }
    }

    public static void main(String[] args) {
        System.out.println(EagerConfig.getInstance() == EagerConfig.getInstance());
        System.out.println(LazyConfig.getInstance() == LazyConfig.getInstance());
        System.out.println(SynchronizedConfig.getInstance() == SynchronizedConfig.getInstance());
        System.out.println(DclConfig.getInstance() == DclConfig.getInstance());
        System.out.println(HolderConfig.getInstance() == HolderConfig.getInstance());
        System.out.println(IdGenerator.INSTANCE.nextId() + " " + IdGenerator.INSTANCE.nextId());
    }
}
```

**Output:**

```text
true
true
true
true
true
1 2
```

(The lazy, non-thread-safe variant also prints `true` here because `main` is single-threaded; under concurrent first access it can create two instances.)

### Comparing the variants

| Variant | Lazy | Thread-safe | Cost / caveat |
|---------|------|-------------|---------------|
| Eager | No | Yes (class initialisation is thread-safe) | Created even if never used; fine when creation is cheap |
| Lazy (unsynchronised) | Yes | **No** | Race on first access can create two instances |
| Synchronised method | Yes | Yes | Every call takes a lock |
| Double-checked locking | Yes | Yes, **only with `volatile`** | Subtle; without `volatile` another thread may see a partially constructed object |
| Holder idiom | Yes | Yes | Relies on lazy class initialisation; simple and fast |
| Enum | No (created when the enum initialises) | Yes | Cannot extend another class; also safe against reflection and serialisation creating extra instances |

### Why `volatile` matters in double-checked locking

`instance = new DclConfig()` involves allocating memory, running the constructor and publishing the reference. Without `volatile`, the Java Memory Model allows another thread to observe the reference **before** the constructor's writes are visible, and use a half-initialised object on the fast path (which takes no lock). `volatile` establishes the needed happens-before ordering.

### Ways a classic singleton can be broken (awareness)

- **Reflection:** `constructor.setAccessible(true)` can call the private constructor (guard by throwing if the instance already exists; enums are protected by the JVM).
- **Serialisation:** deserialising creates a new object unless the class implements `readResolve()` returning the instance (enums handle this automatically).
- **Cloning:** do not implement `Cloneable` (or throw from `clone`).
- **Multiple class loaders:** each loader can have its own copy of the class and therefore its own "single" instance.

## Execution Flow

1. The client calls `HolderConfig.getInstance()`.
2. The first call triggers initialisation of the nested `Holder` class, which creates the single instance (the JVM guarantees this happens once, even with concurrent callers).
3. Later calls return the same reference without locking.

## Real-World Examples

- `java.lang.Runtime.getRuntime()` returns the single `Runtime` for the JVM.
- `java.awt.Desktop.getDesktop()` and similar platform-access objects.
- Logging frameworks typically return shared logger instances per name from a factory method (a registry of singletons per key).
- **Spring beans are singleton-scoped by default** — one instance per application context — but they are **injected**, not obtained through a static `getInstance()`. This keeps the benefit (one instance) without the main drawback (global access).

## When to Use

- There must be exactly one instance for correctness or resource reasons (a hardware or OS resource, a process-wide registry).
- You are **not** using a DI container and need a single shared, stateless or thread-safe service.
- An enum singleton for stateless utilities or simple shared counters.

## When Not to Use

- Just to make an object "easy to reach from anywhere" — that is global state.
- For objects whose "only one" assumption may change (one database today, two tomorrow; per-tenant configuration).
- When the code must be unit-tested with substitutes — prefer creating one instance and injecting it.
- For mutable shared state accessed by many threads, unless it is carefully made thread-safe.

## Advantages

- Guarantees a single instance and controlled access.
- Lazy variants avoid creating expensive objects until needed.
- Simple to implement (especially enum and holder forms).

## Disadvantages

- **Global state** and **hidden dependencies**: callers' signatures do not reveal they use it.
- **Hard to test:** cannot easily substitute a fake; state leaks between tests.
- **Violates SRP:** the class manages both its job and its own lifecycle.
- **Concurrency:** mutable singletons need careful synchronisation.
- **Inflexible:** changing to "one per tenant" or "one per request" requires touching every caller.

## Related Patterns

- **Abstract Factory, Builder, Facade** objects are often single instances.
- **Flyweight** shares many instances by key; Singleton shares one.
- **Dependency Injection** (not a GoF pattern) is the modern alternative: the container ensures one instance and injects it.
- **Monostate** (awareness): many instances sharing static state — same problems as global state.

## SOLID Connection

Singleton tends to **work against** SOLID: it mixes lifecycle management with business behaviour (SRP), and callers depend on a concrete class through a static method instead of an injected abstraction (DIP). Using a single instance created once and passed through constructors keeps the "only one" property while following DIP.

## Common Mistakes

- Forgetting `volatile` in double-checked locking.
- Using the unsynchronised lazy version in multithreaded code.
- Assuming the singleton's **state** is thread-safe just because there is one instance.
- Keeping request-specific data (current user) in a singleton.
- Calling `getInstance()` deep inside business logic instead of injecting the instance.
- Confusing Singleton with a class of static methods (a static utility class has no instance, cannot implement interfaces or be substituted).

## Key Takeaways

- Private constructor + static instance + static accessor.
- Prefer enum or holder idiom; eager is fine when creation is cheap; DCL needs `volatile`.
- One instance is often right; **global access** is the problem — inject the single instance instead.
- Spring's singleton scope gives you one instance per context without static access.
