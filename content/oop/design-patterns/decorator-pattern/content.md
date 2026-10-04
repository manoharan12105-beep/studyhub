# Decorator

**Category:** Structural · **Interview priority:** Core

## Intent

**Attach additional responsibilities to an object dynamically** by wrapping it in another object with the **same interface**. Decorators provide a flexible alternative to subclassing for extending behaviour, and they can be **stacked** in any combination.

## The Problem

A service fetches currency exchange rates from a remote API. Different deployments need different combinations of extra behaviour around that call:

- **logging** of every request,
- **caching** so repeated lookups do not hit the API,
- **retrying** when the API fails transiently.

Some environments need all three, tests need none, and the order matters (cache before retry, so cached values never trigger retries).

## Why the Naive Solution Fails

**Subclassing each combination:**

```text
 RateService
  ├── LoggingRateService
  ├── CachingRateService
  ├── RetryingRateService
  ├── LoggingCachingRateService
  ├── CachingRetryingRateService
  └── LoggingCachingRetryingRateService ... (2³ − 1 = 7 combinations, plus order variants)
```

- A class explosion; adding a fourth concern (metrics) doubles it.
- Behaviour is fixed at compile time.

**Flags inside one class** (`if (cacheEnabled) …; if (retryEnabled) …`) mixes unrelated concerns, grows without bound, and violates SRP and OCP.

## The Pattern Idea

Each extra behaviour becomes a **wrapper** that implements the **same interface** as the object it wraps, holds a reference to it, adds its behaviour before or after, and **delegates** the call. Since a wrapper looks exactly like the original, wrappers can wrap other wrappers.

## Structure

```text
             «interface» RateService (Component)
             + rate(currency): double
               ▲                    ▲
               ┆                    ┆
     RemoteRateService       RateServiceDecorator (abstract, optional)
     (ConcreteComponent)     - inner: RateService ─────────┐ wraps
                              ▲        ▲        ▲          │
                          Logging   Caching  Retrying ◀──-─┘ (ConcreteDecorators)

 Call chain:  Logging → Caching → Retrying → RemoteRateService
```

| Participant | In the example |
|-------------|----------------|
| Component | `RateService` |
| ConcreteComponent | `RemoteRateService` |
| Decorator | Holds a `RateService` and implements `RateService` |
| ConcreteDecorators | `LoggingRateService`, `CachingRateService`, `RetryingRateService` |

## Java Implementation

```java
import java.util.HashMap;
import java.util.Map;

public class DecoratorDemo {

    interface RateService {
        double rate(String currency);
    }

    // Concrete component: simulates an API that fails on the first attempt per call sequence
    static class RemoteRateService implements RateService {
        private int calls = 0;

        public double rate(String currency) {
            calls++;
            if (calls % 2 == 1) {                                   // every odd call fails
                throw new IllegalStateException("timeout calling rates API");
            }
            System.out.println("    [api] fetched " + currency);
            return currency.equals("USD") ? 83.2 : 90.1;
        }
    }

    // Each decorator implements the interface AND wraps another RateService
    static class RetryingRateService implements RateService {
        private final RateService inner;
        private final int maxAttempts;

        RetryingRateService(RateService inner, int maxAttempts) {
            this.inner = inner;
            this.maxAttempts = maxAttempts;
        }

        public double rate(String currency) {
            for (int attempt = 1; ; attempt++) {
                try {
                    return inner.rate(currency);
                } catch (IllegalStateException e) {
                    System.out.println("   [retry] attempt " + attempt + " failed: " + e.getMessage());
                    if (attempt == maxAttempts) {
                        throw e;
                    }
                }
            }
        }
    }

    static class CachingRateService implements RateService {
        private final RateService inner;
        private final Map<String, Double> cache = new HashMap<>();

        CachingRateService(RateService inner) {
            this.inner = inner;
        }

        public double rate(String currency) {
            Double cached = cache.get(currency);
            if (cached != null) {
                System.out.println("  [cache] hit " + currency);
                return cached;
            }
            double value = inner.rate(currency);
            cache.put(currency, value);
            return value;
        }
    }

    static class LoggingRateService implements RateService {
        private final RateService inner;

        LoggingRateService(RateService inner) {
            this.inner = inner;
        }

        public double rate(String currency) {
            System.out.println("[log] rate(" + currency + ")");
            double value = inner.rate(currency);
            System.out.println("[log] -> " + value);
            return value;
        }
    }

    public static void main(String[] args) {
        RateService service =
                new LoggingRateService(
                        new CachingRateService(
                                new RetryingRateService(
                                        new RemoteRateService(), 3)));

        service.rate("USD");      // miss → retry → api
        service.rate("USD");      // cache hit, API not called
    }
}
```

**Output:**

```text
[log] rate(USD)
   [retry] attempt 1 failed: timeout calling rates API
    [api] fetched USD
[log] -> 83.2
[log] rate(USD)
  [cache] hit USD
[log] -> 83.2
```

The client sees only a `RateService`. Tests can use `new RemoteRateService()` (or a fake) alone; production composes whatever stack it needs — in any order — without new classes.

## Execution Flow

1. The client calls `rate("USD")` on the outermost decorator (logging).
2. Each decorator does its "before" work, then calls `inner.rate(...)`.
3. The innermost real component does the actual work.
4. Results flow back out; each decorator may do "after" work (logging the result, storing it in the cache).

## Real-World Examples

- **`java.io`**: `new BufferedReader(new InputStreamReader(new FileInputStream(file)))` — `BufferedInputStream`, `DataInputStream`, `GZIPInputStream` all wrap another stream of the same type.
- **Collections wrappers:** `Collections.unmodifiableList(list)`, `Collections.synchronizedMap(map)`, `Collections.checkedList(list, type)`.
- **Servlet filters / middleware** form a wrapping chain around request handling.
- **Spring**: many cross-cutting features (transactions, caching) are applied by wrapping beans — typically implemented as proxies, which are structurally similar.

## When to Use

- You need to add responsibilities to individual objects **without affecting others** of the same class.
- Extensions are **optional and combinable** (logging, caching, retries, compression, encryption).
- Subclassing would cause an explosion, or the class is `final` / from a library.

## When Not to Use

- Only one fixed extension is ever needed — a small subclass or a direct change may be simpler.
- The component interface is very large: every decorator must implement every method (forwarding boilerplate).
- Code depends on the **concrete class** or object identity of the wrapped object (wrapping changes `getClass()` and `==`).

## Advantages

- Add or remove behaviour at runtime; combine freely.
- Each concern lives in a small, single-purpose class (SRP).
- New behaviours without modifying existing classes (OCP).
- Avoids subclass explosion.

## Disadvantages

- Many small objects; stack traces and debugging go through several layers.
- Order of wrapping matters and can be configured wrongly.
- Forwarding methods for large interfaces are tedious (an abstract base decorator helps).
- Identity-based checks (`instanceof ConcreteClass`) no longer work on decorated objects.

## Related Patterns

- **Proxy** has the same structure (same interface, wraps a subject) but its purpose is to **control access** (lazy creation, security, remote calls), usually managing the subject's lifecycle; a decorator **adds behaviour** and is typically composed by the client.
- **Adapter** changes the interface; Decorator keeps it.
- **Composite** has many children; Decorator has exactly one.
- **Chain of Responsibility** also forms a chain, but any handler may **stop** the request; decorators normally always delegate.
- **Strategy** changes the "guts" (algorithm inside); Decorator changes the "skin" (wraps around).

## SOLID Connection

- **OCP:** new behaviours as new decorators; existing classes untouched.
- **SRP:** one concern per decorator.
- **LSP:** every decorator must honour the component's contract so it can stand in for the original.
- **Composition over inheritance** in its purest form.

## Common Mistakes

- A decorator that changes the meaning of the operation (violates LSP), not just adds to it.
- Forgetting to delegate a method, silently dropping behaviour.
- Wrong order (retrying outside the cache, logging that misses cached calls).
- Decorating with a concrete class type instead of the interface, preventing stacking.

## Key Takeaways

- Decorator wraps an object with the same interface to add behaviour before/after delegation.
- Decorators stack in any order and combination at runtime.
- Classic Java example: `java.io` streams.
- Decorator adds behaviour; Proxy controls access; Adapter changes the interface.
