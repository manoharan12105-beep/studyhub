# Aspect-Oriented Programming — Practice

### P1. Which advice?

**Difficulty:** Easy · **Type:** MCQ

You need to measure how long service methods take and log it even when they throw. Which advice fits best?

- A) `@Before`
- B) `@AfterReturning`
- C) `@Around`
- D) `@AfterThrowing`

<details>
<summary>Answer</summary>

**Answer:** C) `@Around`

**Explanation:** Only `@Around` can record the start time, call `proceed()` and log in a `finally` block.

</details>

### P2. Null results

**Difficulty:** Medium · **Type:** Code analysis

```java
@Around("execution(* com.example..*Service.*(..))")
public void log(ProceedingJoinPoint pjp) throws Throwable {
    System.out.println("calling " + pjp.getSignature());
    pjp.proceed();
}
```

After adding this aspect, many service methods return `null`. Why?

<details>
<summary>Answer</summary>

The advice is declared `void` and discards the value returned by `proceed()`, so callers receive `null`. Declare it `Object` and `return pjp.proceed();`.

</details>

### P3. Write a pointcut

**Difficulty:** Medium · **Type:** Coding

Write a pointcut expression for all public methods of beans annotated `@RestController` in the package `com.shop.api` and its sub-packages.

<details>
<summary>Answer</summary>

`execution(public * *(..)) && within(com.shop.api..*) && @within(org.springframework.web.bind.annotation.RestController)`

</details>
