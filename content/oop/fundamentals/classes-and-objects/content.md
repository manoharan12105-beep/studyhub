# Classes and Objects

## Definition

A **class** is a type definition: it declares the **fields** (state) and **methods** (behaviour) that its objects will have. An **object** is an instance of a class created at runtime with `new`; it has its own copy of the instance fields. A **reference variable** does not contain an object — it holds a reference (a pointer-like handle) to one.

## Why It Matters

Most beginner bugs and many output-based interview questions come from mixing up three things: the **class**, the **object**, and the **reference** that points to the object. Knowing exactly which one a line of code touches explains aliasing (`b = a` does not copy), `NullPointerException`, why changing a parameter's object is visible to the caller, and why `==` on objects compares identity.

## Class vs Object

```java
public class Student {                       // the class: a blueprint
    String name;                             // instance field
    int marks;                               // instance field

    void printReport() {                     // instance method
        System.out.println(name + " scored " + marks);
    }

    public static void main(String[] args) {
        Student asha = new Student();        // object 1
        asha.name = "Asha";
        asha.marks = 91;

        Student ravi = new Student();        // object 2: its own copy of every instance field
        ravi.name = "Ravi";
        ravi.marks = 78;

        asha.printReport();
        ravi.printReport();
    }
}
```

**Output:**

```text
Asha scored 91
Ravi scored 78
```

(Fields are package-private here to keep the first example short. Real classes keep fields `private` — see [Encapsulation](../../pillars/encapsulation/content.md).)

| Class | Object |
|-------|--------|
| Written in source code, compiled to a `.class` file | Created at runtime with `new` (or reflection, cloning, deserialisation) |
| Exists once (loaded once per class loader) | Any number can exist |
| Declares fields and methods | Holds actual values for the instance fields |
| Takes no heap space per instance | Occupies heap memory |
| `Student` | `new Student()` |

## Reference vs Object

`Student asha = new Student();` does three separate things:

1. `Student asha` declares a **reference variable** of type `Student`.
2. `new Student()` allocates an **object** on the heap and runs a constructor.
3. `=` stores a **reference** to that object in `asha`.

```text
  stack (local variables)          heap (objects)
  ┌────────────┐                  ┌──────────────────────┐
  │ asha  ●────┼─────────────────▶│ Student              │
  └────────────┘                  │  name  = "Asha"      │
  ┌────────────┐                  │  marks = 91          │
  │ copy  ●────┼─────────────────▶│                      │
  └────────────┘                  └──────────────────────┘
        after:  Student copy = asha;   (one object, two references)
```

### Assignment copies the reference, not the object

```java
public class ReferenceAliasing {

    static class Counter {
        int value;
    }

    public static void main(String[] args) {
        Counter a = new Counter();
        Counter b = a;               // b refers to the SAME object
        b.value = 5;
        System.out.println(a.value); // 5: changed through b, seen through a

        b = new Counter();           // b now refers to a different object
        b.value = 9;
        System.out.println(a.value); // still 5
        System.out.println(a == b);  // false: different objects
    }
}
```

**Output:**

```text
5
5
false
```

### `null`

A reference that points to no object holds `null`. Calling a method or reading a field through `null` throws `NullPointerException` at runtime; the compiler cannot always detect it.

### References are passed by value

Java passes **every** argument by value. For a reference type, the value copied is the reference. So a method can change the **object** the caller sees, but cannot make the caller's **variable** point somewhere else.

```java
public class PassReferenceByValue {

    static class Box {
        int size;
    }

    static void grow(Box box) {
        box.size = 10;               // changes the shared object: caller sees it
        box = new Box();             // only the local copy of the reference changes
        box.size = 99;               // affects the new object, which the caller never sees
    }

    public static void main(String[] args) {
        Box box = new Box();
        grow(box);
        System.out.println(box.size);
    }
}
```

**Output:**

```text
10
```

## Object Creation

`new ClassName(arguments)`:

1. The JVM makes sure the class is loaded and initialised (static initialisation runs once, the first time it is needed).
2. Memory for the object is allocated on the heap, and **all instance fields are set to default values**.
3. Constructors and instance initialisers run (superclass first), assigning explicit values.
4. The expression evaluates to a reference to the new object.

Default values for fields (not for local variables, which must be assigned before use):

| Field type | Default |
|------------|---------|
| `byte`, `short`, `int`, `long` | `0` |
| `float`, `double` | `0.0` |
| `char` | `'\u0000'` |
| `boolean` | `false` |
| Any reference (`String`, arrays, objects) | `null` |

Step 3 is covered in detail in [Constructors and Initialization](../constructors-and-initialization/content.md); memory and garbage collection in [Object Lifecycle and Memory](../object-lifecycle-and-memory/content.md).

## Instance Members

**Instance fields** and **instance methods** belong to each object. Every object has its own copy of every instance field; instance methods run "on" an object and can read and write that object's fields.

Members marked `static` belong to the class instead — one copy shared by all objects. They are covered in [Static Members](../static-members/content.md).

## The `this` Keyword

Inside an instance method or constructor, `this` is a reference to the **current object** — the object the method was called on.

Uses:

| Use | Example | Why |
|-----|---------|-----|
| Disambiguate a field from a parameter with the same name | `this.name = name;` | Without `this`, `name = name` assigns the parameter to itself |
| Pass the current object to another method | `registry.add(this);` | Lets a collaborator hold a reference to this object |
| Return the current object (method chaining) | `return this;` | Builder-style APIs: `sb.append("a").append("b")` |
| Call another constructor of the same class | `this(name, 0);` | Constructor chaining (must be the first statement) |

`this` does not exist in `static` methods, because a static method is not called on any object.

```java
public class ThisDemo {

    static class Point {
        private int x;
        private int y;

        Point(int x, int y) {
            this.x = x;              // field x = parameter x
            this.y = y;
        }

        Point moveBy(int dx, int dy) {
            this.x += dx;
            this.y += dy;
            return this;             // allow chaining
        }

        @Override
        public String toString() {
            return "(" + x + ", " + y + ")";
        }
    }

    public static void main(String[] args) {
        Point p = new Point(1, 2).moveBy(3, 3).moveBy(-1, 0);
        System.out.println(p);
    }
}
```

**Output:**

```text
(3, 5)
```

## Anonymous Objects

An object used without storing its reference in a variable: `new Student().printReport();` or `list.add(new Point(1, 2));`. Useful for one-off calls. Once nothing references it, it becomes eligible for garbage collection. (Not to be confused with **anonymous classes** — see [Nested Classes](../../java-oop/nested-classes/content.md).)

## Comparison

| Concept | What it is | Where it lives |
|---------|-----------|----------------|
| Class | Type definition | Loaded once into the JVM (method area / metaspace) |
| Object | Instance with its own instance fields | Heap |
| Reference variable (local) | Holds a reference or `null` | Stack frame of the method |
| Reference variable (field) | Holds a reference or `null` | Inside the owning object, on the heap |

## Real-World Examples

- One `String` class; millions of `String` objects in a running server.
- `List<Order> orders = repository.findAll();` — `orders` is a reference; the list and each `Order` are objects on the heap.
- Passing a `Cart` into a `checkout(cart)` method lets checkout modify that same cart (for example mark it as paid).

## Common Misconceptions

- **"`b = a` copies the object."** It copies the reference. Copying an object needs a constructor, a factory method or `clone()`.
- **"Java passes objects by reference."** Java passes references by value. Reassigning a parameter never changes the caller's variable.
- **"A variable of type `Student` is a `Student`."** It is a reference that may point to a `Student` (or a subclass object), or be `null`.
- **"Local variables get default values too."** Only fields and array elements are defaulted. Reading an unassigned local variable is a compile-time error.
- **"Objects live on the stack when created inside a method."** Conceptually, objects are on the heap; the local variable holding the reference is on the stack. (The JIT may optimise allocation, but that never changes program behaviour.)

## Key Takeaways

- Class = blueprint; object = runtime instance; reference = handle to an object.
- `new` allocates, defaults the fields, runs constructors, and returns a reference.
- Assignment and parameter passing copy references, never objects.
- `this` refers to the current object; it is unavailable in static code.
- Fields get default values; local variables do not.
