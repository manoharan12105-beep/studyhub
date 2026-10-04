# Method Overloading — Practice

### P1. Valid overload?

**Difficulty:** Easy · **Type:** MCQ

Which pair is a valid overload?

- A) `int area(int s)` and `double area(int s)`
- B) `int area(int s)` and `int area(int side)`
- C) `int area(int s)` and `int area(long s)`
- D) `public int area(int s)` and `private int area(int s)`

<details>
<summary>Answer</summary>

**Answer:** C) `int area(int s)` and `int area(long s)`

**Explanation:** Only the parameter types differ in C. Return type, parameter names and access modifiers are not part of the signature.

</details>

### P2. char argument

**Difficulty:** Easy · **Type:** Output-based

```java
public class CharOverload {

    static void show(int x) {
        System.out.println("int " + x);
    }

    static void show(String s) {
        System.out.println("String " + s);
    }

    public static void main(String[] args) {
        show('A');
        show("A");
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
int 65
String A
```

**Explanation:** There is no `show(char)`, so `'A'` widens to `int` (its code 65). A `char` never converts to `String` automatically.

</details>

### P3. null and the most specific method

**Difficulty:** Medium · **Type:** Output-based

```java
public class NullOverload {

    static void handle(Object o) {
        System.out.println("Object");
    }

    static void handle(Number n) {
        System.out.println("Number");
    }

    static void handle(Integer i) {
        System.out.println("Integer");
    }

    public static void main(String[] args) {
        handle(null);
        Number n = 5;
        handle(n);
        Object o = 5;
        handle(o);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
Integer
Number
Object
```

**Explanation:** For `null`, `Integer` is the most specific of three related types. The other two calls use the declared types `Number` and `Object`; the runtime `Integer` value does not matter for overload selection.

</details>

### P4. Remove what?

**Difficulty:** Medium · **Type:** Output-based

```java
import java.util.ArrayList;
import java.util.List;

public class RemoveTrap {
    public static void main(String[] args) {
        List<Integer> marks = new ArrayList<>(List.of(10, 20, 30, 1));
        marks.remove(1);
        System.out.println(marks);
        marks.remove(Integer.valueOf(1));
        System.out.println(marks);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
[10, 30, 1]
[10, 30]
```

**Explanation:** `remove(1)` picks `remove(int index)` (no boxing needed) and removes index 1 (the value 20). `remove(Integer.valueOf(1))` picks `remove(Object)` and removes the value 1.

</details>

### P5. Does it compile?

**Difficulty:** Hard · **Type:** Code analysis

```java
class Converter {
    static void convert(long value) { }
    static void convert(Long value) { }
    static void convert(short value) { }

    static void test() {
        convert(7);
    }
}
```

<details>
<summary>Hint</summary>

Which methods are applicable in phase 1 for an `int` argument?

</details>

<details>
<summary>Answer</summary>

**Answer:** Yes — it calls `convert(long)`.

**Explanation:** In phase 1, `int` can widen to `long`; it cannot narrow to `short` in a method call, and `Long` would need boxing (and `int` boxes only to `Integer` anyway). Exactly one method is applicable, so there is no ambiguity.

</details>

### P6. Design review

**Difficulty:** Medium · **Type:** Scenario

A `UserRepository` has `find(String email)` and `find(String phoneNumber)`. What is wrong, and how would you fix it?

<details>
<summary>Answer</summary>

**Answer:** It does not compile — both have the signature `find(String)`. Even if the types differed, overloads with different meanings are confusing.

**Fix:** use descriptive names (`findByEmail`, `findByPhone`), or introduce small value types (`Email`, `PhoneNumber`) so `find(Email)` and `find(PhoneNumber)` are distinct, type-safe overloads.

</details>
