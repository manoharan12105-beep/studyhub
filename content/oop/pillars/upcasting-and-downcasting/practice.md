# Upcasting and Downcasting — Practice

### P1. Which assignment needs an explicit cast?

**Difficulty:** Easy · **Type:** MCQ

Given `class Vehicle {}` and `class Car extends Vehicle {}`, and variables `Vehicle v` and `Car c`:

- A) `v = c;`
- B) `Object o = c;`
- C) `c = v;`
- D) `v = new Car();`

<details>
<summary>Answer</summary>

**Answer:** C) `c = v;`

**Explanation:** Assigning a `Vehicle` to a `Car` variable is a downcast and needs `c = (Car) v;`. The others are upcasts.

</details>

### P2. Compile-time or runtime?

**Difficulty:** Medium · **Type:** Code analysis

```java
class Fruit { }
class Apple extends Fruit { }
class Mango extends Fruit { }

class CastTest {
    void run() {
        Fruit f = new Apple();
        Mango m = (Mango) f;          // line 1
        Apple a = (Apple) new Mango(); // line 2
    }
}
```

For each line, does it compile? Does it fail at runtime?

<details>
<summary>Hint</summary>

The compiler only looks at declared types. For line 2, what is the declared type of the expression `new Mango()`?

</details>

<details>
<summary>Answer</summary>

**Answer:** Line 1 compiles and throws `ClassCastException` at runtime (the object is an `Apple`). Line 2 does **not** compile: the expression's type is `Mango`, and `Mango` and `Apple` are unrelated siblings, so no `Mango` can ever be an `Apple`.

**Explanation:** Because line 2 is a compile-time error, the class as a whole does not compile.

</details>

### P3. Pattern matching

**Difficulty:** Medium · **Type:** Output-based

```java
public class PatternMatch {

    static String label(Object value) {
        if (value instanceof Integer number && number > 10) {
            return "big integer " + number;
        }
        if (value instanceof String text) {
            return "text of length " + text.length();
        }
        return "other: " + value;
    }

    public static void main(String[] args) {
        System.out.println(label(42));
        System.out.println(label(7));
        System.out.println(label("chennai"));
        System.out.println(label(null));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
big integer 42
other: 7
text of length 7
other: null
```

**Explanation:** The binding variable can be used in the rest of the `&&` condition. `7` is an `Integer` but fails `> 10`. `null instanceof` anything is `false`, so `null` falls through to the last line.

</details>

### P4. Array store

**Difficulty:** Hard · **Type:** Output-based

```java
public class ArrayStoreQuestion {

    static class Animal { }
    static class Dog extends Animal { }
    static class Cat extends Animal { }

    public static void main(String[] args) {
        Animal[] pets = new Dog[2];
        pets[0] = new Dog();
        System.out.println("stored dog");
        try {
            pets[1] = new Cat();
            System.out.println("stored cat");
        } catch (ArrayStoreException e) {
            System.out.println("cannot store a Cat in a Dog[]");
        }
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
stored dog
cannot store a Cat in a Dog[]
```

**Explanation:** The variable type is `Animal[]`, so the compiler allows storing a `Cat`. The actual array object is a `Dog[]`, and the JVM checks each store at runtime.

</details>
