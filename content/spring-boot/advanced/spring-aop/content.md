# Aspect-Oriented Programming

**Module:** Advanced Spring · **Interview priority:** Frequently asked

## Definition

**Aspect-Oriented Programming (AOP)** modularises **cross-cutting concerns** — logic that would otherwise be repeated across many classes, such as logging, timing, auditing, security and transactions — into separate units called **aspects**. **Spring AOP** applies aspects at runtime by wrapping beans in **proxies**; it uses AspectJ's annotation and pointcut syntax but not AspectJ's bytecode weaving.

## Why It Matters

- Spring's own features — `@Transactional`, `@Async`, `@Cacheable`, `@PreAuthorize`, `@Retryable` — are AOP. Understanding AOP explains all of their limitations.
- Interviewers ask for the vocabulary (aspect, join point, pointcut, advice) and the advice types, and often "write a logging/timing aspect".

## AOP

Without AOP:

```text
placeOrder()   { log start; check permission; begin tx; …business…; commit; log end; record metric }
cancelOrder()  { log start; check permission; begin tx; …business…; commit; log end; record metric }
refundOrder()  { log start; check permission; begin tx; …business…; commit; log end; record metric }
```

With AOP, each method contains only its business logic; aspects apply logging, security and transactions around the methods selected by pointcuts.

## Aspect

A class annotated `@Aspect` (and registered as a bean) that groups **pointcuts** and **advice** for one concern, e.g. `AuditAspect`, `PerformanceAspect`.

## Join Point

A point in program execution where an aspect can apply. In **Spring AOP, join points are always method executions on Spring beans** (called through the proxy). AspectJ supports more (field access, constructors, static methods).

## Pointcut

A predicate selecting join points:

| Expression | Matches |
|------------|---------|
| `execution(public * com.example.order.*Service.*(..))` | Public methods of classes ending in `Service` in that package |
| `execution(* *(..)) && within(com.example..*)` | Any method in the package tree |
| `@annotation(com.example.Audited)` | Methods annotated with `@Audited` |
| `@within(org.springframework.stereotype.Service)` | All methods of `@Service` classes |
| `bean(*Controller)` | Spring beans whose names end in `Controller` (Spring-specific) |
| `args(orderId, ..)` | Binds/filters by arguments |

Named pointcuts (`@Pointcut` on an empty method) can be combined with `&&`, `||`, `!`.

## Advice

The code an aspect runs at a join point:

| Advice | Runs | Can it stop the call / change the result? |
|--------|------|-------------------------------------------|
| `@Before` | Before the method | Only by throwing |
| `@AfterReturning` | After a normal return (can access `returning` value) | No (can't replace the value) |
| `@AfterThrowing` | After an exception (can access it) | No (exception still propagates) |
| `@After` | After either outcome — like `finally` | No |
| `@Around` | Wraps the call; must call `proceed()` | **Yes**: skip the call, change arguments/result, handle exceptions |

## Before

Validation, logging arguments, security checks.

## After

Cleanup that must happen regardless of outcome (`@After`), result auditing (`@AfterReturning`), error reporting (`@AfterThrowing`).

## Around

The most powerful advice — timing, retries, caching, transactions are all "around" behaviour. Always call `pjp.proceed()` (unless deliberately short-circuiting) and return its result.

## How It Works

```java
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.After;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

public class AopDemo {

    static class PaymentService {
        public String pay(String orderId, int amount) {
            System.out.println("    [target] charging " + amount + " for " + orderId);
            if (amount <= 0) {
                throw new IllegalArgumentException("amount must be positive");
            }
            return "receipt-" + orderId;
        }
    }

    @Aspect
    static class AuditAspect {

        @Pointcut("execution(public * AopDemo.PaymentService.*(..))")     // which join points
        void paymentOperations() {
        }

        @Around("paymentOperations()")
        public Object time(ProceedingJoinPoint pjp) throws Throwable {
            System.out.println("  @Around before  " + pjp.getSignature().getName());
            try {
                return pjp.proceed();                                      // call the target (or next advice)
            } finally {
                System.out.println("  @Around after   " + pjp.getSignature().getName());
            }
        }

        @Before("paymentOperations() && args(orderId, amount)")
        public void before(String orderId, int amount) {
            System.out.println("  @Before         orderId=" + orderId + ", amount=" + amount);
        }

        @AfterReturning(pointcut = "paymentOperations()", returning = "result")
        public void afterReturning(JoinPoint jp, Object result) {
            System.out.println("  @AfterReturning " + result);
        }

        @AfterThrowing(pointcut = "paymentOperations()", throwing = "ex")
        public void afterThrowing(Exception ex) {
            System.out.println("  @AfterThrowing  " + ex.getMessage());
        }

        @After("paymentOperations()")
        public void after() {
            System.out.println("  @After          (always, like finally)");
        }
    }

    @Configuration
    @EnableAspectJAutoProxy                         // Spring Boot enables this automatically with AOP on the classpath
    static class Config {
        @Bean
        PaymentService paymentService() {
            return new PaymentService();
        }

        @Bean
        AuditAspect auditAspect() {
            return new AuditAspect();
        }
    }

    public static void main(String[] args) {
        try (var context = new AnnotationConfigApplicationContext(Config.class)) {
            PaymentService payments = context.getBean(PaymentService.class);
            System.out.println("successful call:");
            payments.pay("ORD-1", 500);
            System.out.println("failing call:");
            try {
                payments.pay("ORD-2", 0);
            } catch (IllegalArgumentException e) {
                System.out.println("  caller caught: " + e.getMessage());
            }
        }
    }
}
```

**Output:**

```text
successful call:
  @Around before  pay
  @Before         orderId=ORD-1, amount=500
    [target] charging 500 for ORD-1
  @AfterReturning receipt-ORD-1
  @After          (always, like finally)
  @Around after   pay
failing call:
  @Around before  pay
  @Before         orderId=ORD-2, amount=0
    [target] charging 0 for ORD-2
  @AfterThrowing  amount must be positive
  @After          (always, like finally)
  @Around after   pay
  caller caught: amount must be positive
```

Within one aspect, advice runs in this order: `@Around` (before `proceed`) → `@Before` → target → `@AfterReturning`/`@AfterThrowing` → `@After` → `@Around` (after `proceed`). Between different aspects, use `@Order` (lower value = outer, runs first on the way in).

### A practical aspect: timing annotated methods

```java
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@interface LogExecutionTime {
}

@Aspect
@Component
class ExecutionTimeAspect {
    private static final Logger log = LoggerFactory.getLogger(ExecutionTimeAspect.class);

    @Around("@annotation(LogExecutionTime)")
    public Object logTime(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.nanoTime();
        try {
            return pjp.proceed();
        } finally {
            log.info("{} took {} ms", pjp.getSignature().toShortString(), (System.nanoTime() - start) / 1_000_000);
        }
    }
}
```

In Spring Boot, add `spring-boot-starter-aspectj` (Boot 4; `spring-boot-starter-aop` in Boot 3); auto-proxying is enabled automatically.

## Internal Behavior

- An auto-proxy creator (`AnnotationAwareAspectJAutoProxyCreator`, a `BeanPostProcessor`) checks each bean against all pointcuts in `postProcessAfterInitialization` and wraps matching beans in a proxy with an interceptor chain. See [Spring Proxies](../spring-proxies/content.md).
- Consequences: only **public/non-private methods called through the proxy** are advised — self-invocation, private methods, `final` methods (CGLIB) and objects created with `new` are not.
- Spring's own interceptors (transaction, cache, security, async) participate in the same advisor chain, ordered by their configured order.
- Full **AspectJ** weaving (compile-time or load-time) removes these limits but needs extra tooling; rarely needed in Spring Boot apps.

## Common Mistakes

- Forgetting `proceed()` in `@Around` (the target never runs) or not returning its result (callers get `null`).
- Pointcuts that match too much (`execution(* *(..))`) — advising Spring's own beans and slowing everything.
- Expecting advice on internal `this.method()` calls or private methods.
- Aspect class not registered as a bean (`@Component` missing).
- Swallowing exceptions in `@Around`.

## Common Interview Traps

- **"Spring AOP is AspectJ."** Spring AOP uses AspectJ's annotations/expression language but implements it with runtime proxies; AspectJ weaves bytecode.
- **"`@After` runs only after success."** It runs after success *or* exception; `@AfterReturning` is success-only.
- **"Aspects can intercept field access in Spring."** Spring AOP supports only method execution join points.

## Key Takeaways

- AOP = cross-cutting concerns in aspects; join point (method execution) + pointcut (which) + advice (what/when).
- Advice types: `@Before`, `@AfterReturning`, `@AfterThrowing`, `@After`, `@Around` (most powerful, must call `proceed()`).
- Spring AOP is proxy-based: external calls on beans only — the same limits as `@Transactional`.
