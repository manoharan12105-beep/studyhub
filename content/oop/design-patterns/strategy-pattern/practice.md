# Strategy — Practice

### P1. Identify the strategy

**Difficulty:** Easy · **Type:** MCQ

In `employees.sort(Comparator.comparing(Employee::salary))`, which object is the strategy?

- A) `employees`
- B) The `Comparator`
- C) `Employee`
- D) The `sort` method

<details>
<summary>Answer</summary>

**Answer:** B) The `Comparator`

**Explanation:** It encapsulates the comparison algorithm; `sort` (on the list, the context) uses it without knowing its details.

</details>

### P2. Output

**Difficulty:** Medium · **Type:** Output-based

```java
import java.util.List;
import java.util.function.IntBinaryOperator;

public class StrategyOutput {

    static int reduce(List<Integer> values, int start, IntBinaryOperator strategy) {
        int result = start;
        for (int v : values) {
            result = strategy.applyAsInt(result, v);
        }
        return result;
    }

    public static void main(String[] args) {
        List<Integer> marks = List.of(70, 85, 60);
        System.out.println(reduce(marks, 0, Integer::sum));
        System.out.println(reduce(marks, Integer.MIN_VALUE, Math::max));
        System.out.println(reduce(marks, 1, (a, b) -> a * (b % 10 == 0 ? 1 : 2)));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
215
85
2
```

**Explanation:** The same loop runs three algorithms. In the last one, only 85 is not a multiple of 10, so the result doubles once: 1 → 1 → 2 → 2.

</details>

### P3. Refactor to Strategy

**Difficulty:** Medium · **Type:** Coding

```java
class PasswordChecker {
    boolean isValid(String password, String level) {
        if (level.equals("BASIC")) {
            return password.length() >= 6;
        } else if (level.equals("STRONG")) {
            return password.length() >= 10 && password.chars().anyMatch(Character::isDigit);
        }
        throw new IllegalArgumentException(level);
    }
}
```

Refactor so new password policies can be added without editing `PasswordChecker`.

<details>
<summary>Answer</summary>

```java
interface PasswordPolicy {
    boolean accepts(String password);
}

class BasicPolicy implements PasswordPolicy {
    public boolean accepts(String password) {
        return password.length() >= 6;
    }
}

class StrongPolicy implements PasswordPolicy {
    public boolean accepts(String password) {
        return password.length() >= 10 && password.chars().anyMatch(Character::isDigit);
    }
}

class PasswordChecker {
    private final PasswordPolicy policy;

    PasswordChecker(PasswordPolicy policy) {
        this.policy = policy;
    }

    boolean isValid(String password) {
        return policy.accepts(password);
    }
}
```

**Explanation:** The checker depends only on the policy interface; a "no dictionary words" policy is a new class (or a composite of policies).

</details>
