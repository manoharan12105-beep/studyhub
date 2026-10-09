# Verifying AI-Generated Changes — Practice

### P1. Which is evidence?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** evidence

Which statement is evidence that the tests pass?

- A) "All tests should pass now."
- B) "I ran the tests and they look good."
- C) `[INFO] Tests run: 13, Failures: 0, Errors: 0, Skipped: 0` followed by `BUILD SUCCESS`
- D) "The change is small, so it's safe."

<details>
<summary>Answer</summary>

**Answer:** C) `[INFO] Tests run: 13, Failures: 0, Errors: 0, Skipped: 0` followed by `BUILD SUCCESS`

</details>

### P2. Invented API

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** compilation

What happens when you compile `return code.isNullOrBlank();` where `code` is a `String` on JDK 21?

<details>
<summary>Answer</summary>

Compilation fails: `error: cannot find symbol … symbol: method isNullOrBlank() … location: variable code of type String`. `String` has no such method; use `code == null || code.isBlank()`.

</details>

### P3. Empty test

**Difficulty:** Medium · **Type:** Code review · **Concepts:** meaningful tests

Why does this test prove nothing about `PriceCalculator`?

```java
when(prices.totalCents(2_500, null)).thenReturn(2_500L);
assertEquals(2_500L, prices.totalCents(2_500, null));
```

<details>
<summary>Answer</summary>

`prices` is a mock: the test configures it to return 2500 and then checks that it returns 2500. The real calculator code never runs, so the bug could still be there. Test the real class (`new PriceCalculator()`) or go through the controller with MockMvc.

</details>

### P4. Silent config

**Difficulty:** Medium · **Type:** Failure diagnosis · **Concepts:** ignored keys

Claude adds `disallowed_tools: Bash` to a subagent file "to make it read-only". The agent still runs Bash. Why didn't anything complain?

<details>
<summary>Answer</summary>

The field is `disallowedTools` (camelCase). Claude Code ignores unrecognized frontmatter fields without an error, so the misspelled key has no effect. Check keys against the documentation; for read-only, prefer a `tools` allowlist.

</details>

### P5. Scope check

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** diff review

The task was "fix the null discount code". `git diff --stat` lists `PriceCalculator.java`, `PriceCalculatorTest.java`, `pom.xml` and `OrderController.java`. What do you ask?

<details>
<summary>Answer</summary>

Why `pom.xml` and `OrderController.java` changed. A dependency change is outside the task and needs its own justification; a controller change might be legitimate (for example `@Transactional` for the stored-row symptom) but must be explained and tested. Revert anything unrelated.

</details>

### P6. Build the checklist into the prompt

**Difficulty:** Medium · **Type:** Prompt design · **Concepts:** verification loops

Write a prompt ending that makes Claude produce verifiable evidence for FEAT-7.

<details>
<summary>Answer</summary>

```text
When you're done, show: the tests you added and their failure before implementation,
the final ./mvnw -B verify summary line and BUILD result, git diff --stat, and a list of
anything you did not verify. Don't say "should work" — show output or say it's unverified.
```

</details>

### P7. Agreement isn't verification

**Difficulty:** Hard · **Type:** Trade-off · **Concepts:** second opinions

Claude wrote a fix; a reviewer subagent says "looks correct". Is the change verified? What would make it so?

<details>
<summary>Answer</summary>

No — it's two model opinions. Verification comes from the reproducing test going from red to green, the full build passing, a reviewed diff with no weakened tests or unrelated changes, and behaviour checked where tests don't reach. The reviewer is useful for finding problems, not for proving their absence.

</details>
