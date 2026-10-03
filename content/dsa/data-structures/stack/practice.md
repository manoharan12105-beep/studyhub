# Stack — Practice

### P1. Remove adjacent duplicates

**Difficulty:** Easy · **Pattern:** Stack as "last unmatched item"

Repeatedly remove pairs of adjacent equal letters until none remain, and return the final string.

**Constraints:** 1 ≤ n ≤ 10⁵, lowercase letters.

Example: `"abbaca"` → remove "bb" → `"aaca"` → remove "aa" → `"ca"`.

<details>
<summary>Hint</summary>

Removing a pair can make two earlier letters adjacent. Compare each new letter with the most recent surviving letter.

</details>

<details>
<summary>Answer</summary>

**Approach:** A `StringBuilder` used as a stack: if the new letter equals the top, pop; otherwise push.

```java
public class RemoveAdjacentDuplicates {

    static String removeDuplicates(String s) {
        StringBuilder stack = new StringBuilder();
        for (char c : s.toCharArray()) {
            int top = stack.length() - 1;
            if (top >= 0 && stack.charAt(top) == c) {
                stack.deleteCharAt(top);            // O(1): removing the last char
            } else {
                stack.append(c);
            }
        }
        return stack.toString();
    }

    public static void main(String[] args) {
        System.out.println(removeDuplicates("abbaca") + " " + removeDuplicates("azxxzy"));
    }
}
```

**Output:**

```text
ca ay
```

**Complexity:** O(n) time, O(n) space.

</details>

### P2. Min stack

**Difficulty:** Medium · **Pattern:** Auxiliary stack of minimums

Design a stack supporting `push`, `pop`, `top` and `getMin`, all in O(1).

**Constraints:** up to 3 × 10⁴ operations; `pop`/`top`/`getMin` are only called on a non-empty stack.

<details>
<summary>Hint</summary>

Store, alongside each element, the minimum of the stack at the moment it was pushed.

</details>

<details>
<summary>Answer</summary>

**Approach:** Push pairs `(value, minSoFar)`. When the top is popped, the previous pair already knows the minimum of the remaining elements.

```java
import java.util.*;

public class MinStack {

    private final Deque<int[]> stack = new ArrayDeque<>();   // {value, min at this level}

    void push(int value) {
        int min = stack.isEmpty() ? value : Math.min(value, stack.peek()[1]);
        stack.push(new int[] {value, min});
    }

    void pop() {
        stack.pop();
    }

    int top() {
        return stack.peek()[0];
    }

    int getMin() {
        return stack.peek()[1];
    }

    public static void main(String[] args) {
        MinStack s = new MinStack();
        s.push(5);
        s.push(2);
        s.push(7);
        s.push(2);
        System.out.print(s.getMin() + " ");
        s.pop();
        System.out.print(s.getMin() + " ");
        s.pop();
        s.pop();
        System.out.println(s.getMin() + " top=" + s.top());
    }
}
```

**Output:**

```text
2 2 5 top=5
```

**Complexity:** O(1) per operation, O(n) space.

</details>

### P3. Evaluate a postfix expression

**Difficulty:** Medium · **Pattern:** Operand stack

Evaluate an expression in reverse Polish (postfix) notation given as tokens. Operators are `+ - * /`; division truncates toward zero.

**Constraints:** 1 ≤ tokens ≤ 10⁴; the expression is valid; intermediate values fit in `int`.

Example: `["2","1","+","3","*"]` → (2 + 1) × 3 = `9`; `["4","13","5","/","+"]` → 4 + 13/5 = `6`.

<details>
<summary>Hint</summary>

Push numbers. An operator pops two operands — the first popped is the **right** operand.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class EvalPostfix {

    static int eval(String[] tokens) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (String t : tokens) {
            switch (t) {
                case "+", "-", "*", "/" -> {
                    int right = stack.pop();          // order matters for - and /
                    int left = stack.pop();
                    stack.push(switch (t) {
                        case "+" -> left + right;
                        case "-" -> left - right;
                        case "*" -> left * right;
                        default -> left / right;      // Java truncates toward zero
                    });
                }
                default -> stack.push(Integer.parseInt(t));
            }
        }
        return stack.pop();
    }

    public static void main(String[] args) {
        System.out.println(eval(new String[] {"2", "1", "+", "3", "*"}));
        System.out.println(eval(new String[] {"4", "13", "5", "/", "+"}));
        System.out.println(eval(new String[] {"10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"}));
    }
}
```

**Output:**

```text
9
6
22
```

**Complexity:** O(n) time, O(n) space.

</details>

### P4. Simplify a Unix-style path

**Difficulty:** Medium · **Pattern:** Stack of directories

Simplify an absolute path: `.` means the current directory, `..` goes up one level (no effect at root), multiple slashes count as one. The result starts with `/` and has no trailing slash.

**Constraints:** 1 ≤ length ≤ 3000.

Example: `"/a/./b/../../c/"` → `"/c"`; `"/../"` → `"/"`; `"/home//foo/"` → `"/home/foo"`.

<details>
<summary>Hint</summary>

Split on `/`. Ignore empty parts and `.`; `..` pops; anything else pushes.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class SimplifyPath {

    static String simplify(String path) {
        Deque<String> stack = new ArrayDeque<>();
        for (String part : path.split("/")) {
            if (part.isEmpty() || part.equals(".")) {
                continue;
            }
            if (part.equals("..")) {
                if (!stack.isEmpty()) {
                    stack.pop();
                }
            } else {
                stack.push(part);
            }
        }
        StringBuilder sb = new StringBuilder();
        Iterator<String> fromBottom = stack.descendingIterator();   // bottom → top
        while (fromBottom.hasNext()) {
            sb.append('/').append(fromBottom.next());
        }
        return sb.length() == 0 ? "/" : sb.toString();
    }

    public static void main(String[] args) {
        System.out.println(simplify("/a/./b/../../c/"));
        System.out.println(simplify("/../"));
        System.out.println(simplify("/home//foo/"));
    }
}
```

**Output:**

```text
/c
/
/home/foo
```

**Complexity:** O(n) time and space.

</details>

### P5. Basic calculator with parentheses

**Difficulty:** Hard · **Pattern:** Stack of saved contexts

Evaluate a string containing non-negative integers, `+`, `-`, parentheses and spaces. Unary minus may appear before a parenthesis or at the start (e.g. `"-(2 + 3)"`). Do not use any built-in expression evaluator.

**Constraints:** 1 ≤ length ≤ 3 × 10⁵; the expression is valid; results fit in `int`.

Example: `"1 + 1"` → `2`; `"(1+(4+5+2)-3)+(6+8)"` → `23`.

<details>
<summary>Hint</summary>

Keep a running `result` and the current `sign`. On `(`, push the current result and sign, then start fresh. On `)`, finish the inner result and combine: `result = savedResult + savedSign × inner`.

</details>

<details>
<summary>Answer</summary>

**Approach:** Without parentheses, scanning left to right with a running sum suffices. A parenthesis starts a new sub-expression, so the outer state (sum so far, sign before the bracket) is pushed and restored at `)` — exactly the job of a stack.

```java
import java.util.*;

public class BasicCalculator {

    static int calculate(String s) {
        Deque<Integer> stack = new ArrayDeque<>();
        int result = 0, sign = 1, number = 0;
        for (char c : s.toCharArray()) {
            if (Character.isDigit(c)) {
                number = number * 10 + (c - '0');
            } else if (c == '+' || c == '-') {
                result += sign * number;
                number = 0;
                sign = (c == '+') ? 1 : -1;
            } else if (c == '(') {
                stack.push(result);                // save the outer context
                stack.push(sign);
                result = 0;
                sign = 1;
            } else if (c == ')') {
                result += sign * number;
                number = 0;
                int signBefore = stack.pop();
                int resultBefore = stack.pop();
                result = resultBefore + signBefore * result;
            }                                      // spaces are ignored
        }
        return result + sign * number;
    }

    public static void main(String[] args) {
        System.out.println(calculate("1 + 1"));
        System.out.println(calculate(" 2-1 + 2 "));
        System.out.println(calculate("(1+(4+5+2)-3)+(6+8)"));
        System.out.println(calculate("-(2 + 3)"));
    }
}
```

**Output:**

```text
2
3
23
-5
```

**Complexity:** O(n) time, O(n) space for nested parentheses.

</details>
