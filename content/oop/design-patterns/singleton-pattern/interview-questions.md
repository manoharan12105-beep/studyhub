# Singleton — Interview Questions

## Conceptual

### Q1. What is the Singleton pattern and how do you implement it?

<details>
<summary>Answer</summary>

A creational pattern that ensures a class has only one instance and provides a global access point. Implementation: a private constructor, a private static field holding the instance, and a public static `getInstance()` method (or an enum with a single constant). Variants differ in when the instance is created (eager vs lazy) and how thread safety is achieved.

</details>

### Q2. How do you make a lazy singleton thread-safe?

<details>
<summary>Answer</summary>

Options: synchronise `getInstance()` (simple, but locks on every call); double-checked locking with a `volatile` field (locks only during creation); the initialisation-on-demand holder idiom (a nested static class whose initialisation creates the instance — lazy and thread-safe through the JVM's class-initialisation guarantees, no explicit locks); or an enum singleton.

</details>

### Q3. Why must the instance field be `volatile` in double-checked locking?

<details>
<summary>Answer</summary>

Without `volatile`, the write of the reference can become visible to another thread before the writes performed by the constructor. That thread's first, unlocked check sees a non-null reference and uses a partially initialised object. `volatile` guarantees that the constructor's writes happen-before any read that sees the reference.

</details>

### Q4. Why is the enum singleton often recommended?

<details>
<summary>Answer</summary>

The JVM guarantees each enum constant is created exactly once, thread-safely; serialisation preserves the single instance without `readResolve`; and reflection cannot create new enum instances. It is concise. Its limitations: it cannot extend another class and it is created eagerly when the enum initialises.

</details>

### Q5. What are the disadvantages of Singleton?

<details>
<summary>Answer</summary>

It introduces global (often mutable) state, hides dependencies, makes unit testing with fakes difficult, couples callers to a concrete class, mixes lifecycle management with the class's responsibility, needs care for thread safety, and hard-codes the assumption "only one ever". Many teams prefer a single instance managed by a DI container and injected.

</details>

### Q6. Singleton vs a class with only static methods?

<details>
<summary>Answer</summary>

A singleton is an object: it can implement interfaces, be passed as a parameter, be replaced by another implementation (if accessed through an interface), hold state with controlled lifecycle, and be lazily created. A static utility class has no instance, cannot implement interfaces or be substituted, and is suited to stateless helpers like `Math`. If the behaviour might need substitution or holds resources, prefer an (injected) instance.

</details>

### Q7. How can a singleton be broken, and how do you prevent it?

<details>
<summary>Answer</summary>

Reflection can call the private constructor — throw from the constructor if an instance already exists, or use an enum. Serialisation creates a new instance on deserialisation — implement `readResolve()` returning the instance, or use an enum. Cloning — do not implement `Cloneable`. Different class loaders each load their own copy — design around one loader or accept per-loader instances.

</details>

### Q8. Are Spring beans singletons in the GoF sense?

<details>
<summary>Answer</summary>

Spring's default singleton scope means one instance **per application context**, created and injected by the container. It is not the GoF Singleton: the class has a normal constructor, there is no static `getInstance()`, tests can create other instances freely, and dependencies are explicit through injection. It provides the "one shared instance" benefit without global access.

</details>

## Applied

### Q9. What is wrong with this singleton in a web application?

```java
public final class SessionHolder {
    private static final SessionHolder INSTANCE = new SessionHolder();
    private String currentUser;

    private SessionHolder() { }

    public static SessionHolder getInstance() {
        return INSTANCE;
    }

    public void setCurrentUser(String user) {
        currentUser = user;
    }

    public String getCurrentUser() {
        return currentUser;
    }
}
```

<details>
<summary>Answer</summary>

The singleton itself is created safely, but it stores **request-specific** state in a field shared by all threads. Concurrent requests overwrite `currentUser`, so one user can act as another. Per-request data must live in request-scoped objects or be passed as parameters (frameworks provide security contexts bound to the request thread for this).

</details>
