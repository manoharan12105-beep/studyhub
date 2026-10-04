# Spring Proxies: JDK Dynamic Proxies and CGLIB

**Module:** Advanced Spring · **Interview priority:** Core

## Definition

A **proxy** is an object that stands in for another object (the **target**), implements the same type, and adds behaviour before/after delegating calls. Spring creates proxies for beans that need cross-cutting behaviour — transactions, security, caching, async, retry, AOP. It uses two techniques:

- **JDK dynamic proxy** — a runtime-generated class **implementing the target's interfaces** (`java.lang.reflect.Proxy`).
- **CGLIB proxy** — a runtime-generated **subclass** of the target class that overrides its methods.

## Why It Matters

- Nearly every "Spring annotation does not work" bug is a proxy issue: self-invocation, private/final methods, objects created with `new`, wrong injected type.
- Interviewers ask "JDK vs CGLIB?", "Which one does Spring Boot use?" and "Why doesn't `@Transactional` work on internal calls?".

## Spring Proxies

```text
OrderController ──► [ proxy: OrderService$$SpringCGLIB$$0 ]
                         interceptor chain:
                           SecurityInterceptor (@PreAuthorize)
                           TransactionInterceptor (@Transactional)
                           CacheInterceptor (@Cacheable)
                         ──► target OrderService (your object)
                                  this.helper()  ← internal call, no interceptors
```

Features implemented with proxies:

| Feature | Interceptor / mechanism |
|---------|------------------------|
| `@Transactional` | `TransactionInterceptor` |
| `@Async` | `AsyncExecutionInterceptor` |
| `@Cacheable` / `@CacheEvict` | `CacheInterceptor` |
| `@PreAuthorize` / `@PostAuthorize` | Authorization method interceptors |
| `@Validated` method validation | `MethodValidationInterceptor` |
| `@Retryable` (Framework 7) | Retry interceptor |
| `@Aspect` advice | AspectJ advisors |
| `@Configuration` inter-bean calls | CGLIB-enhanced configuration class (a different, class-level mechanism) |
| Scoped proxies (`@RequestScope`) | Look up the current target per call |
| `@Lazy` injection points | Lazy-resolution proxy |

## JDK Dynamic Proxies vs CGLIB

| Aspect | JDK dynamic proxy | CGLIB proxy |
|--------|-------------------|-------------|
| How | Implements the interfaces | Subclasses the class |
| Requires | At least one interface | Non-final class |
| Injectable as | The **interface** only | The interface **or the concrete class** |
| Can't intercept | Methods not on the interface | `final`/`private`/`static` methods; `final` classes |
| Default in Spring Framework | Used when the bean implements interfaces | Used otherwise |
| Default in **Spring Boot** | — | **CGLIB always** (`spring.aop.proxy-target-class=true`) |

Spring Boot defaults to class-based proxies to avoid "cannot inject `OrderServiceImpl` — bean is a `$Proxy`" errors.

## How It Works

```java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.aop.support.AopUtils;

public class ProxyDemo {

    interface GreetingService {
        String greet(String name);

        String greetTwice(String name);
    }

    static class SimpleGreetingService implements GreetingService {
        public String greet(String name) {
            return "Hello " + name;
        }

        public String greetTwice(String name) {
            return greet(name) + " / " + greet(name);     // internal calls: this.greet(...)
        }
    }

    public static void main(String[] args) {
        GreetingService target = new SimpleGreetingService();

        // 1. A JDK dynamic proxy written by hand: implements the interface, forwards to the target
        InvocationHandler logging = (proxy, method, methodArgs) -> {
            System.out.println("  [proxy] before " + method.getName());
            return method.invoke(target, methodArgs);
        };
        GreetingService jdkProxy = (GreetingService) Proxy.newProxyInstance(
                GreetingService.class.getClassLoader(), new Class<?>[]{GreetingService.class}, logging);

        System.out.println("call greet() through the proxy:");
        System.out.println("  " + jdkProxy.greet("Asha"));
        System.out.println("call greetTwice() through the proxy (it calls greet() internally):");
        System.out.println("  " + jdkProxy.greetTwice("Ravi"));

        // 2. Spring's ProxyFactory chooses JDK or CGLIB
        ProxyFactory interfaceBased = new ProxyFactory(target);
        interfaceBased.addInterface(GreetingService.class);
        Object p1 = interfaceBased.getProxy();

        ProxyFactory classBased = new ProxyFactory(target);
        classBased.setProxyTargetClass(true);                   // Spring Boot's default for AOP
        Object p2 = classBased.getProxy();

        System.out.println("JDK proxy?   " + AopUtils.isJdkDynamicProxy(p1)
                + ", instanceof SimpleGreetingService? " + (p1 instanceof SimpleGreetingService));
        System.out.println("CGLIB proxy? " + AopUtils.isCglibProxy(p2)
                + ", instanceof SimpleGreetingService? " + (p2 instanceof SimpleGreetingService));
    }
}
```

**Output:**

```text
call greet() through the proxy:
  [proxy] before greet
  Hello Asha
call greetTwice() through the proxy (it calls greet() internally):
  [proxy] before greetTwice
  Hello Ravi / Hello Ravi
JDK proxy?   true, instanceof SimpleGreetingService? false
CGLIB proxy? true, instanceof SimpleGreetingService? true
```

`greetTwice` was intercepted once, but its two internal `greet` calls were not — this is the **self-invocation** problem in its simplest form. And only the CGLIB proxy can be injected as the concrete class.

## Internal Behavior

- Proxies are created in `BeanPostProcessor.postProcessAfterInitialization` by `AbstractAutoProxyCreator` subclasses; the **proxy** is what the container stores and injects.
- A CGLIB proxy is a separate object from the target; Spring creates it without calling your constructor a second time (Objenesis). Its own **fields are not your fields** — reading a field directly on the proxy (e.g. `service.counter` from a test or another class in the same package) returns the proxy's default value (`null`/`0`). Always go through methods.
- `AopUtils.getTargetClass(bean)` and `AopProxyUtils.ultimateTargetClass` reveal the real class; `AopContext.currentProxy()` (with `exposeProxy = true`) returns the current proxy.
- Multiple features on one bean share **one proxy** with an ordered interceptor chain.

## Common Mistakes

- Self-invocation expecting `@Transactional`/`@Cacheable`/`@Async` to apply.
- `final` classes or methods (common with Kotlin or "make everything final" style) — not intercepted.
- Accessing fields of an injected bean directly instead of via methods.
- Casting/injecting a JDK proxy as its implementation class (`BeanNotOfRequiredTypeException`) when class proxies are disabled.
- Calling `getClass()` in logic (returns the proxy class).

## Common Interview Traps

- **"Spring uses JDK proxies when there is an interface."** Spring Framework does by default, but Spring Boot sets `proxy-target-class=true`, so CGLIB is used for AOP in Boot apps.
- **"CGLIB intercepts self-calls because it is a subclass."** The proxy delegates to a separate target instance, so `this` inside the target bypasses the proxy.
- **"Proxies are created at compile time."** They are generated at runtime (or ahead of time with Spring AOT for native images).

## Key Takeaways

- Proxy = stand-in that runs interceptors around calls to the real bean.
- JDK proxy implements interfaces; CGLIB subclasses the class; Spring Boot defaults to CGLIB.
- Only external calls on non-private, non-final methods of Spring beans are intercepted; use methods, not fields, on proxied beans.
