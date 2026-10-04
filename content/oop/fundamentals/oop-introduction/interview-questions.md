# Introduction to Object-Oriented Programming — Interview Questions

## Conceptual

### Q1. What is object-oriented programming?

<details>
<summary>Answer</summary>

OOP is a way of structuring a program as objects that combine **state** (fields) and **behaviour** (methods), where objects interact by calling each other's methods.

The point is to keep data together with the rules that protect it and to organise code around responsibilities. That makes large programs easier to change: a rule lives in one class, and a new kind of object can be added without rewriting existing callers. Java expresses this with classes, interfaces, access modifiers, inheritance and dynamic dispatch.

</details>

### Q2. What are the four pillars of OOP? Explain each in one line.

<details>
<summary>Answer</summary>

- **Encapsulation:** bundle data with the methods that operate on it and hide the data (`private` fields, public methods).
- **Abstraction:** expose what an object does and hide how it does it (interfaces, abstract classes, simple public methods).
- **Inheritance:** create a class as a specialised version of another, reusing its members (`class Car extends Vehicle`).
- **Polymorphism:** one interface, many forms — the actual object decides which implementation runs (`shape.area()` on a `Circle` or a `Square`).

</details>

### Q3. What are the state, behaviour and identity of an object?

<details>
<summary>Answer</summary>

- **State:** the current values of its fields (`balance = 500`).
- **Behaviour:** the operations it supports (`deposit`, `withdraw`).
- **Identity:** what distinguishes it from every other object, even one with identical state. In Java, identity is the object itself; `==` on references compares identity.

Two `Account` objects with the same balance have equal state but different identities — changing one does not change the other.

</details>

### Q4. How is OOP different from procedural programming?

<details>
<summary>Answer</summary>

Procedural code is organised as functions that operate on data stored separately (often shared). OOP is organised as objects that own their data and expose behaviour.

Consequences:

- In procedural code a rule about the data ("balance never negative") must be enforced by every function that touches it; in OOP it is enforced once, inside the class, because outside code cannot reach the field.
- Adding a new variant in procedural code means editing every `if/switch` on the variant; in OOP you add a class that implements the same interface.

Procedural style still fits small scripts and pure computations (`Math.max`).

</details>

### Q5. What is message passing in OOP?

<details>
<summary>Answer</summary>

Objects communicate by sending messages — in Java, calling a method on an object reference (`order.cancel()`). The sender states *what* it wants; the receiving object decides *how* to do it using its own data. Because the receiver decides, different objects can respond differently to the same message, which is the basis of polymorphism.

</details>

### Q6. Is Java a pure object-oriented language?

<details>
<summary>Answer</summary>

No. Java has **primitive types** (`int`, `char`, `boolean`, …) that are not objects, and **static** members that can be used without any object. A pure OO language (for example Smalltalk) treats every value as an object.

Java is still strongly object-oriented: all code lives in classes, every class extends `Object`, and wrapper classes with autoboxing let primitives be used where objects are required (`List<Integer>`).

</details>

## Applied

### Q7. You are given a requirement: "A library lends books to members for 14 days and charges a fine for late returns." What classes would you start with?

<details>
<summary>Answer</summary>

Start with the nouns that carry rules: `Book` (or `BookCopy`), `Member`, and `Loan`. The `Loan` is the key class even though it is not a physical thing: it knows the copy, the member, the issue date and the due date, so it is the natural owner of `isOverdue(today)` and `fine(today)`.

A `Library` (or `LoanService`) coordinates issuing and returning. The fine calculation could later become a `FinePolicy` interface if different member types pay different fines. I would not add classes like `Shelf` unless a requirement needs them.

</details>

### Q8. A teammate says "our code is object-oriented because everything is inside classes". When is that not true?

<details>
<summary>Answer</summary>

When the classes are just containers: all fields public (or exposed through getters and setters with no rules), and all logic in static "manager" or "utility" methods that pull data out of objects and push results back. That is procedural code with class syntax — the data does not protect its own rules and behaviour is not placed with the data.

A quick test: can outside code put an object into an invalid state? If yes, encapsulation is missing.

</details>
