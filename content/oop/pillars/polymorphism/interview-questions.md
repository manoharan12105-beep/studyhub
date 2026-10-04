# Polymorphism — Interview Questions

## Conceptual

### Q1. What is polymorphism? What are its types in Java?

<details>
<summary>Answer</summary>

Polymorphism means one name or interface with many behaviours. Java has compile-time polymorphism (method overloading — the compiler picks a method by argument types) and runtime polymorphism (method overriding — the JVM picks the implementation by the actual object type through dynamic method dispatch). Example: `Shape s = new Circle(); s.area();` runs `Circle.area()`.

</details>

### Q2. What is dynamic method dispatch?

<details>
<summary>Answer</summary>

The mechanism by which a call to an overridden instance method through a superclass or interface reference is resolved at runtime based on the object's actual class. The compiler only checks that the method exists in the reference type and fixes the signature; at runtime the JVM starts from the object's class and runs the most specific implementation of that signature.

</details>

### Q3. What is the difference between static binding and dynamic binding?

<details>
<summary>Answer</summary>

Static (early) binding connects a call to its method body at compile time using the declared type; it is used for static, private and final-in-effect cases, constructors, `super.method()` calls and field access, and for selecting among overloads. Dynamic (late) binding connects the call at runtime using the object's class; it is used for overridable instance methods. Dynamic binding is what makes runtime polymorphism work.

</details>

### Q4. Are fields polymorphic in Java?

<details>
<summary>Answer</summary>

No. Field access is resolved by the reference type at compile time. If a subclass declares a field with the same name, it hides the parent's field, and `Parent p = new Child(); p.field` reads the parent's field. Only instance methods are dispatched on the object type.

</details>

### Q5. Why is runtime polymorphism useful? Give a real example.

<details>
<summary>Answer</summary>

It lets code depend on an abstraction and work with any implementation, including ones written later, without changes — removing `if/else` chains on types and supporting the Open/Closed Principle. Example: a checkout service depends on `PaymentMethod`; UPI, card and wallet classes implement `pay()`. Adding net-banking means adding a class, not editing checkout. `List<T>` with `ArrayList`/`LinkedList` is the same idea in the JDK.

</details>

### Q6. Can we achieve runtime polymorphism with data members or static methods?

<details>
<summary>Answer</summary>

No. Data members are hidden, not overridden, and static methods are hidden too. Both are bound at compile time from the reference type. Runtime polymorphism is achieved only through overriding instance methods.

</details>

### Q7. Does Java use the runtime type of method arguments when choosing a method?

<details>
<summary>Answer</summary>

No. Java uses single dispatch: the runtime type of the **receiver** chooses the override, but **arguments** influence only overload selection, which uses their static types at compile time. To choose behaviour from the runtime types of two objects you need double dispatch, for example the Visitor pattern.

</details>

## Applied

### Q8. What does this print?

```java
class Employee {
    double bonus() {
        return 1000;
    }

    String summary() {
        return getClass().getSimpleName() + ": " + bonus();
    }
}

class Manager extends Employee {
    @Override
    double bonus() {
        return 5000;
    }
}

class Intern extends Employee {
}

public class BonusQuestion {
    public static void main(String[] args) {
        Employee[] staff = { new Employee(), new Manager(), new Intern() };
        for (Employee e : staff) {
            System.out.println(e.summary());
        }
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
Employee: 1000.0
Manager: 5000.0
Intern: 1000.0
```

`summary()` is inherited, but its internal call to `bonus()` is dispatched on the actual object. `Intern` does not override `bonus()`, so it uses `Employee`'s. `getClass()` also reports the runtime class.

</details>

### Q9. What does this print?

```java
class Vehicle {
    String type = "vehicle";

    String type() {
        return "vehicle";
    }
}

class Car extends Vehicle {
    String type = "car";

    @Override
    String type() {
        return "car";
    }
}

public class FieldVsMethod {
    public static void main(String[] args) {
        Vehicle v = new Car();
        Car c = (Car) v;
        System.out.println(v.type + " " + v.type() + " " + c.type + " " + c.type());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
vehicle car car car
```

Fields follow the reference type (`v.type` → `Vehicle`'s field, `c.type` → `Car`'s). The method follows the object type, which is `Car` both times.

</details>

### Q10. What does this print?

```java
class Animal {
    void meet(Animal a) {
        System.out.println("Animal meets Animal");
    }
}

class Cat extends Animal {
    @Override
    void meet(Animal a) {
        System.out.println("Cat meets Animal");
    }

    void meet(Cat c) {
        System.out.println("Cat meets Cat");
    }
}

public class MeetQuestion {
    public static void main(String[] args) {
        Animal a = new Cat();
        Cat c = new Cat();
        a.meet(c);
        c.meet(c);
        c.meet(a);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
Cat meets Animal
Cat meets Cat
Cat meets Animal
```

- `a.meet(c)`: the compiler looks in `Animal`, which has only `meet(Animal)`, so that signature is fixed. At runtime the `Cat` override of `meet(Animal)` runs. `meet(Cat)` is invisible through an `Animal` reference.
- `c.meet(c)`: through `Cat`, both overloads are visible; `meet(Cat)` is most specific.
- `c.meet(a)`: the argument's static type is `Animal`, so `meet(Animal)` is chosen; the object is a `Cat`, so `Cat`'s override runs.

</details>

### Q11. How would you remove this `if/else` chain?

```java
double fare(String vehicleType, double km) {
    if (vehicleType.equals("AUTO")) {
        return 30 + 15 * km;
    } else if (vehicleType.equals("CAB")) {
        return 50 + 20 * km;
    } else if (vehicleType.equals("BIKE")) {
        return 20 + 8 * km;
    }
    throw new IllegalArgumentException(vehicleType);
}
```

<details>
<summary>Answer</summary>

Replace the type code with polymorphism: an interface `FareCalculator` (or an abstract `VehicleType`) with `double fare(double km)`, and classes `AutoFare`, `CabFare`, `BikeFare` each holding their own base and per-km rates. The caller does `vehicle.fareCalculator().fare(km)`. Adding a new vehicle means adding a class (or a new constant in an enum that implements the method), not editing a shared method. This is the "replace conditional with polymorphism" refactoring and an application of the Strategy pattern.

</details>
