# Classes and Objects — Interview Questions

## Conceptual

### Q1. What is the difference between a class and an object?

<details>
<summary>Answer</summary>

A class is a blueprint written in code that declares fields and methods. An object is a concrete instance created at runtime from that blueprint, with its own values for the instance fields. One `Car` class can produce any number of `Car` objects; the class exists once, each object occupies its own heap memory.

</details>

### Q2. What is the difference between a reference and an object?

<details>
<summary>Answer</summary>

The object is the data on the heap. A reference is a value stored in a variable (or field) that lets you reach that object. Several references can point to the same object; a reference can also be `null` and point to nothing. `Car c = new Car();` creates one object and one reference to it.

</details>

### Q3. Is Java pass-by-value or pass-by-reference?

<details>
<summary>Answer</summary>

Always pass-by-value. For object arguments, the value passed is a copy of the reference. The method can therefore mutate the object (the caller sees the change) but cannot rebind the caller's variable — assigning a new object to the parameter only changes the method's local copy.

```java
static void reset(StringBuilder sb) {
    sb.setLength(0);           // caller sees an empty builder
    sb = new StringBuilder();  // caller does not see this
}
```

</details>

### Q4. What does `this` refer to, and where can it not be used?

<details>
<summary>Answer</summary>

`this` refers to the current object — the object on which the instance method or constructor was invoked. It is used to distinguish fields from parameters, to pass or return the current object, and as `this(...)` to call another constructor. It cannot be used in a `static` context because static code is not running on any particular object.

</details>

### Q5. What values do fields have before a constructor assigns them?

<details>
<summary>Answer</summary>

Default values: `0` for numeric types, `0.0` for floating point, `'\u0000'` for `char`, `false` for `boolean`, and `null` for references. This applies to instance fields, static fields and array elements — not to local variables, which must be definitely assigned before use or the code does not compile.

</details>

### Q6. What is an anonymous object?

<details>
<summary>Answer</summary>

An object created and used without being assigned to a variable, e.g. `new Printer().print(report);`. It is useful for one-time use. After the statement, if nothing else references it, it is eligible for garbage collection.

</details>

## Applied

### Q7. What does this print?

```java
public class SwapAttempt {

    static class Holder {
        int value;

        Holder(int value) {
            this.value = value;
        }
    }

    static void swap(Holder x, Holder y) {
        Holder temp = x;
        x = y;
        y = temp;
    }

    public static void main(String[] args) {
        Holder a = new Holder(1);
        Holder b = new Holder(2);
        swap(a, b);
        System.out.println(a.value + " " + b.value);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
1 2
```

`swap` receives copies of the two references and swaps the copies. The caller's `a` and `b` still point to the same objects as before. To swap the *contents*, the method would have to change the fields: `int t = x.value; x.value = y.value; y.value = t;`.

</details>

### Q8. What does this print?

```java
public class SharedObject {

    static class Wallet {
        int money = 100;
    }

    public static void main(String[] args) {
        Wallet w1 = new Wallet();
        Wallet w2 = w1;
        Wallet w3 = new Wallet();
        w2.money -= 30;
        w3.money += 50;
        System.out.println(w1.money + " " + w2.money + " " + w3.money);
        System.out.println((w1 == w2) + " " + (w1 == w3));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
70 70 150
true false
```

`w1` and `w2` reference the same `Wallet`, so the deduction through `w2` is visible through `w1`. `w3` is a separate object. `==` compares references, so `w1 == w2` is `true` and `w1 == w3` is `false`.

</details>

### Q9. Why does this method not compile?

```java
static void show() {
    int count;
    System.out.println(count);   // compile-time error
}
```

<details>
<summary>Answer</summary>

`count` is a local variable and local variables get no default value. Java requires definite assignment before reading a local variable, so the compiler reports "variable count might not have been initialized". A field declared as `int count;` would have defaulted to `0`.

</details>
