# OOP Interview Traps — Interview Questions

## Beginner

### Q1. Trap: "A subclass inherits its parent's constructors."

**Style:** Placement-style

<details>
<summary>Answer</summary>

False. Constructors are not inherited. If `Parent(String name)` exists, `new Child("x")` compiles only if `Child` declares a matching constructor (which then calls `super(name)`). Each class declares its own constructors; the compiler adds only a no-arg default constructor, and only when the class declares none.

</details>

### Q2. Trap: "Constructors can be overridden."

**Style:** Placement-style

<details>
<summary>Answer</summary>

False. Overriding requires an inherited instance method; constructors are not inherited and are not instance methods. They can only be **overloaded** within a class and **chained** with `this(...)`/`super(...)`.

</details>

### Q3. Trap: "Java has no multiple inheritance."

**Style:** Placement-style · Frequently useful

<details>
<summary>Answer</summary>

Imprecise. Java has no multiple inheritance of **classes** (one direct superclass). It has multiple inheritance of **type** through interfaces — `class SmartPhone implements Camera, Phone` — and, through default methods, of behaviour, with explicit conflict resolution.

</details>

### Q4. Trap: "An abstract class must contain at least one abstract method."

**Style:** Service-company-style

<details>
<summary>Answer</summary>

False. `abstract class Base { void helper() { } }` is legal; `abstract` then only prevents direct instantiation. The converse holds: a class with an abstract method must be declared abstract.

</details>

### Q5. Trap: "Interfaces cannot contain method implementations."

**Style:** Java interview

<details>
<summary>Answer</summary>

False since Java 8: interfaces can contain `default` and `static` methods with bodies, and since Java 9 `private` methods. They still cannot contain instance fields or constructors.

</details>

### Q6. Trap: "A class can implement only one interface."

**Style:** Placement-style

<details>
<summary>Answer</summary>

False. A class can extend at most one class but implement any number of interfaces: `class Laptop extends Device implements Chargeable, Bluetooth, Comparable<Laptop>`.

</details>

## Intermediate

### Q7. Trap: "Static methods can be overridden."

**Style:** Java interview · Frequently useful

<details>
<summary>Answer</summary>

False — they are **hidden**. `Parent p = new Child(); p.staticMethod()` calls `Parent.staticMethod()`, because static calls bind to the declared type at compile time. Adding `@Override` to a static method is a compile-time error.

</details>

### Q8. Trap: "Private methods are overridden if the subclass declares the same method."

**Style:** Java interview

<details>
<summary>Answer</summary>

False. Private methods are not visible to subclasses, so a same-named subclass method is a new, unrelated method. Code inside the parent that calls its private method always runs the parent's version.

```java
class A {
    private String id() { return "A"; }
    String show() { return id(); }        // always A.id()
}
class B extends A {
    String id() { return "B"; }           // unrelated method
}
// new B().show() returns "A"
```

</details>

### Q9. Trap: "A final method can't be inherited."

**Style:** Service-company-style

<details>
<summary>Answer</summary>

False. A `final` method **is** inherited and callable on subclass objects; it just cannot be **overridden**. It can also be overloaded.

</details>

### Q10. Trap: "A `final` variable holds an immutable object."

**Style:** Placement-style · Frequently useful

<details>
<summary>Answer</summary>

False. `final` fixes the reference. `final List<String> names = new ArrayList<>(); names.add("x");` compiles and modifies the list. Immutability is a property of the object's class (`List.of(...)`, `String`, records with immutable components).

</details>

### Q11. Trap: "`==` compares string contents."

**Style:** Placement-style · Java interview

<details>
<summary>Answer</summary>

False. `==` compares references. `"java" == "java"` is `true` only because identical literals share one pooled object; `new String("java") == "java"` is `false`. Use `equals`.

</details>

### Q12. Trap: "Overriding `equals` is enough for objects used as `HashMap` keys."

**Style:** Java interview · Backend interview

<details>
<summary>Answer</summary>

False. `HashMap` locates the bucket with `hashCode` first. Equal objects with different (identity) hash codes land in different buckets, so `get` misses and `HashSet` stores duplicates. Override `hashCode` with the same fields as `equals`.

</details>

### Q13. Trap: "Overriding `hashCode` without `equals` makes equal-looking objects equal in a `HashSet`."

**Style:** Java interview

<details>
<summary>Answer</summary>

False. They land in the same bucket, but `Object.equals` (identity) still says they are different, so the set keeps both and `contains` with a new equal-looking object returns `false`.

</details>

### Q14. Trap: "Overloading is decided at runtime by the actual argument objects."

**Style:** Java interview · Frequently useful

<details>
<summary>Answer</summary>

False. Overload selection happens at compile time using the **declared** types of the arguments. `Object o = "x"; print(o);` calls `print(Object)` even if `print(String)` exists.

</details>

### Q15. Trap: "Overriding is decided by the reference type."

**Style:** Placement-style

<details>
<summary>Answer</summary>

False. The reference type decides which methods may be **called** (compile-time check); the **object** type decides which override **runs** (dynamic dispatch). `Animal a = new Dog(); a.sound()` runs `Dog.sound()`.

</details>

### Q16. Trap: "Fields behave like methods with polymorphism."

**Style:** Java interview

<details>
<summary>Answer</summary>

False. Fields are resolved by the reference type. If `Parent` and `Child` both declare `name`, `Parent p = new Child(); p.name` reads `Parent`'s field, while an overridden `getName()` returns `Child`'s.

</details>

### Q17. Trap: "Upcasting changes the object into the parent type."

**Style:** Service-company-style

<details>
<summary>Answer</summary>

False. Casting changes only the reference's static type. After `Animal a = new Dog();` the object is still a `Dog` — `a.getClass()` is `Dog`, and overridden methods still run `Dog`'s versions. Only the set of callable methods shrinks.

</details>

### Q18. Trap: "If a downcast compiles, it is safe."

**Style:** Java interview

<details>
<summary>Answer</summary>

False. The compiler checks only that the cast is possible. `Animal a = new Cat(); Dog d = (Dog) a;` compiles and throws `ClassCastException` at runtime. Check with `instanceof` (pattern matching) first.

</details>

## Advanced

### Q19. Trap: "When a class implements two interfaces with the same default method, Java picks one."

**Style:** Java interview · Advanced interview

<details>
<summary>Answer</summary>

False. If the defaults come from unrelated interfaces and no superclass provides the method, the class does not compile until it overrides the method; it may call one explicitly with `InterfaceA.super.method()`. Rules: class methods win over defaults; a more specific interface wins over its parent.

</details>

### Q20. Trap: "Composition means inheritance with a different keyword."

**Style:** Placement-style

<details>
<summary>Answer</summary>

False. Composition is a HAS-A relationship: an object holds a reference to another object and delegates to it (`Car` has an `Engine`). There is no `extends`; the composed object's public interface is the only coupling, and it can be replaced at runtime.

</details>

### Q21. Trap: "Singleton is always good design because it saves memory."

**Style:** Backend interview · Product-company-style

<details>
<summary>Answer</summary>

False. A single instance can be right, but the classic Singleton adds **global access** to (often mutable) state: hidden dependencies, testing difficulty, thread-safety concerns, and an inflexible "only one ever" assumption. Prefer one instance created once and injected (for example a Spring singleton bean).

</details>

### Q22. Trap: "A superclass constructor always sees fully initialised subclass fields."

**Style:** Advanced interview

<details>
<summary>Answer</summary>

False. The superclass constructor runs **before** subclass field initialisers. If it calls an overridden method, the override sees default values (`null`, `0`). Never call overridable methods from constructors.

</details>
