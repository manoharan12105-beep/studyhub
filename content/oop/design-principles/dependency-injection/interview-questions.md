# Dependency Injection and Inversion of Control — Interview Questions

## Conceptual

### Q1. What is dependency injection?

<details>
<summary>Answer</summary>

A technique where an object receives the objects it depends on from outside — through its constructor, a setter or a field — instead of creating them itself or looking them up globally. It decouples the class from concrete implementations, makes testing with fakes easy, and moves the decision of which implementation to use into one place (the composition root or a DI container).

</details>

### Q2. What is Inversion of Control? How is it different from DI?

<details>
<summary>Answer</summary>

IoC is the general principle that control of object creation and program flow is handed to a framework or caller instead of being driven by your own code — the framework calls your code. DI is one specific form of IoC in which control over obtaining dependencies is inverted: the object is given its collaborators. A Spring container is an IoC container that performs DI; callbacks, event handlers and template methods are other forms of IoC.

</details>

### Q3. What are the types of dependency injection? Which is preferred and why?

<details>
<summary>Answer</summary>

Constructor, setter and field injection. Constructor injection is preferred for required dependencies: the object is complete and valid after construction, fields can be `final` (immutability, thread safety), the dependencies are visible in the API, unit tests can construct the class with fakes without any framework, and circular dependencies are detected early. Setter injection suits optional dependencies with sensible defaults. Field injection hides dependencies and needs reflection, so it is generally discouraged.

</details>

### Q4. How do DIP, DI and IoC relate?

<details>
<summary>Answer</summary>

DIP is a design principle: high-level code depends on abstractions it owns, and details implement them. DI is a technique for supplying an object's dependencies from outside. IoC is the broader idea of a framework controlling creation and flow. Typically you design with DIP (depend on interfaces), implement it with DI (constructor parameters), and possibly automate it with an IoC container (Spring).

</details>

### Q5. Can you do dependency injection without Spring?

<details>
<summary>Answer</summary>

Yes. Write classes that take their dependencies as constructor parameters, and create and connect the objects in one place — typically `main`, called the composition root. Spring, Guice or Dagger only automate this wiring for large object graphs and add lifecycle and configuration features.

</details>

### Q6. What is the difference between DI and the Service Locator pattern?

<details>
<summary>Answer</summary>

With DI the dependency is pushed in from outside and visible in the constructor. With a service locator, the class pulls its dependencies from a registry inside its methods (`Locator.get(PaymentGateway.class)`). The locator hides what a class needs, couples every class to the locator, and turns missing registrations into runtime failures. DI keeps dependencies explicit and compile-time visible.

</details>

## Applied

### Q7. Why should a Spring singleton service avoid mutable instance fields?

<details>
<summary>Answer</summary>

By default Spring creates one instance of each bean and injects it everywhere; that instance is used concurrently by all request threads. Mutable request-specific state in its fields (current user, current order) is shared between requests and causes race conditions and data leaks. Keep services stateless: injected collaborators in `final` fields, request data passed as method parameters.

</details>

### Q8. A class has a constructor with nine injected dependencies. What does that tell you?

<details>
<summary>Answer</summary>

It is a design smell: the class probably has several responsibilities (SRP violation) or sits at the wrong level, orchestrating too much. Constructor injection made the problem visible — field injection would have hidden it. Options: split the class by responsibility, group related dependencies behind a cohesive facade or domain service, or move some work into the collaborators that own the data.

</details>
