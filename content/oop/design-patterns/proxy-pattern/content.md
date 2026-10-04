# Proxy

**Category:** Structural · **Interview priority:** Core

## Intent

Provide a **surrogate or placeholder** for another object to **control access** to it. The proxy implements the same interface as the real object (the *subject*), so clients cannot tell the difference, and decides when, whether and how the call reaches the real object.

## The Problem

A payroll application has a `SalaryReportService` that loads and computes a full salary report — slow (seconds) and sensitive:

- Many screens hold a reference to the service but most users never open the report — creating it eagerly wastes startup time.
- Only HR managers may generate it — every caller would otherwise have to check permissions.

## Why the Naive Solution Fails

- Creating the expensive object at startup slows every launch even when the report is never used.
- Putting `if (user.isHrManager())` in every caller scatters security checks; one forgotten check is a data leak.
- Putting the checks inside `SalaryReportService` mixes security with report logic (SRP) and makes the service harder to reuse in contexts with different rules.

## The Pattern Idea

Put an object in front of the real subject that implements the **same interface**. The proxy holds (or knows how to obtain) the real subject and adds **access control** around each call: create it lazily, check permissions, call it remotely, cache results, log, count references.

## Structure

```text
 Client ──uses──▶ «interface» ReportService (Subject)
                        ▲                 ▲
                        ┆                 ┆
              SalaryReportService   SecureLazyReportProxy (Proxy)
              (RealSubject:          - real: SalaryReportService (created on demand)
               expensive, sensitive) - user: User
                                     + generate(): checks role → creates real if needed → delegates
```

### Kinds of proxies

| Kind | Controls | Example |
|------|----------|---------|
| **Virtual proxy** | Creation — lazy instantiation of an expensive object | Image placeholders, lazy-loaded ORM associations |
| **Protection proxy** | Permissions — who may call what | Role checks before sensitive operations |
| **Remote proxy** | Location — a local object representing a remote one | RPC/RMI stubs, generated HTTP API clients |
| **Caching proxy** | Repetition — returns stored results | Caching expensive queries |
| **Smart reference / logging proxy** | Extra bookkeeping on access | Counting references, audit logs, metrics |

## Java Implementation

```java
public class ProxyDemo {

    interface ReportService {
        String generate(String month);
    }

    record User(String name, String role) { }

    // Real subject: expensive to create and sensitive
    static class SalaryReportService implements ReportService {
        SalaryReportService() {
            System.out.println("  (loading payroll data - expensive)");
        }

        public String generate(String month) {
            return "Salary report for " + month + ": 142 employees, total Rs 1.9 Cr";
        }
    }

    // Proxy: same interface; adds lazy creation (virtual) + permission check (protection)
    static class SecureLazyReportProxy implements ReportService {
        private final User user;
        private SalaryReportService real;                 // not created until needed

        SecureLazyReportProxy(User user) {
            this.user = user;
        }

        public String generate(String month) {
            if (!"HR_MANAGER".equals(user.role())) {
                throw new SecurityException(user.name() + " may not view salary reports");
            }
            if (real == null) {
                real = new SalaryReportService();          // lazy initialisation
            }
            return real.generate(month);
        }
    }

    static void open(ReportService service, String month) {   // client: knows only ReportService
        try {
            System.out.println(service.generate(month));
        } catch (SecurityException e) {
            System.out.println("Denied: " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        System.out.println("Creating proxies...");
        ReportService forClerk = new SecureLazyReportProxy(new User("Ilango", "CLERK"));
        ReportService forHr = new SecureLazyReportProxy(new User("Deepa", "HR_MANAGER"));

        open(forClerk, "2026-03");
        open(forHr, "2026-03");
        open(forHr, "2026-04");                            // real subject already created
    }
}
```

**Output:**

```text
Creating proxies...
Denied: Ilango may not view salary reports
  (loading payroll data - expensive)
Salary report for 2026-03: 142 employees, total Rs 1.9 Cr
Salary report for 2026-04: 142 employees, total Rs 1.9 Cr
```

The expensive object is created only when an authorised user first needs it, and no client contains a permission check. (In a multithreaded server, the lazy creation would need synchronisation.)

### Dynamic proxies in the JDK

Writing a proxy class per interface is repetitive for cross-cutting concerns such as timing or logging. `java.lang.reflect.Proxy` creates a proxy object **at runtime** for any interface, routing every call to an `InvocationHandler`:

```java
import java.lang.reflect.Proxy;

public class DynamicProxyDemo {

    interface Greeter {
        String greet(String name);
    }

    static class SimpleGreeter implements Greeter {
        public String greet(String name) {
            return "Vanakkam, " + name;
        }
    }

    @SuppressWarnings("unchecked")
    static <T> T logging(T target, Class<T> type) {
        return (T) Proxy.newProxyInstance(
                type.getClassLoader(),
                new Class<?>[] {type},
                (proxy, method, args) -> {
                    System.out.println("-> " + method.getName() + "(" + args[0] + ")");
                    Object result = method.invoke(target, args);    // delegate to the real object
                    System.out.println("<- " + result);
                    return result;
                });
    }

    public static void main(String[] args) {
        Greeter greeter = logging(new SimpleGreeter(), Greeter.class);
        greeter.greet("Meena");
    }
}
```

**Output:**

```text
-> greet(Meena)
<- Vanakkam, Meena
```

Frameworks use the same idea at scale: Spring creates proxies around beans to apply `@Transactional`, `@Cacheable`, security and other aspects (JDK dynamic proxies for interfaces, or generated subclasses for classes).

## Execution Flow

1. The client calls `generate` on a `ReportService` reference that is actually the proxy.
2. The proxy performs its control step (permission check, lazy creation, cache lookup, remote call setup).
3. If allowed, it delegates to the real subject and returns the result (possibly after post-processing).

## Real-World Examples

- Spring AOP proxies for transactions, caching, security and async execution.
- JPA/Hibernate lazy-loading proxies for entity associations (a virtual proxy).
- Remote service clients (RMI stubs, generated HTTP clients) that look like local objects.
- `Collections.unmodifiableList` is often described as a protection proxy as well as a decorator: it controls access (rejects writes) while keeping the interface.

## When to Use

- You need to control access to an object without changing it or its clients: lazy creation, permissions, remoting, caching, logging, rate limiting.
- The real object is expensive, remote, or sensitive.

## When Not to Use

- No access control is needed — a proxy only adds indirection.
- Callers rely on the concrete class or object identity (proxies change both).
- The control logic is complex business logic that deserves its own service rather than being hidden in a proxy.

## Advantages

- Access control without modifying the subject or clients (OCP, SRP).
- Lazy initialisation and caching improve performance.
- Clients stay unaware of remoting, security or lifecycle details.

## Disadvantages

- Extra indirection; possible latency (remote proxies) and surprising behaviour if callers do not know about the proxy (lazy-loading exceptions outside a transaction are a classic example).
- Self-invocation is not intercepted: in Spring, a bean calling its own `@Transactional` method directly bypasses the proxy.

## Related Patterns

- **Decorator:** same structure, different intent — decorators add behaviour and are stacked by clients; proxies control access and often manage the subject's lifecycle.
- **Adapter:** provides a different interface; Proxy provides the same one.
- **Facade:** simplifies a subsystem; Proxy stands in for a single object.

## SOLID Connection

- **SRP:** access control is separated from business logic.
- **OCP:** add caching, security or laziness without editing the subject.
- **LSP:** the proxy must honour the subject's contract (apart from documented access failures).
- **DIP:** clients depend on the subject interface, which makes substituting a proxy possible.

## Common Mistakes

- Exposing the real subject so clients bypass the proxy.
- Forgetting thread safety in lazy proxies.
- Calling a proxied method from inside the same object and expecting the proxy's behaviour (Spring self-invocation).
- Confusing Proxy and Decorator in interviews — explain the intent difference.

## Key Takeaways

- Proxy = same interface as the real subject, controlling access to it.
- Kinds: virtual (lazy), protection (security), remote, caching, logging/smart reference.
- `java.lang.reflect.Proxy` builds proxies at runtime; Spring uses proxies for transactions, caching and security.
- Same structure as Decorator; the intent (control vs add behaviour) distinguishes them.
