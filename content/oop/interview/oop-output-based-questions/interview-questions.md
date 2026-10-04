# OOP Output-Based Questions — Interview Questions

## Beginner

### Q1. What does this print? (constructor order)

**Style:** Placement-style

```java
class Grand {
    Grand() {
        System.out.print("G");
    }
}

class Parent extends Grand {
    Parent() {
        System.out.print("P");
    }
}

class Kid extends Parent {
    Kid() {
        System.out.print("K");
    }
}

public class CtorOrder {
    public static void main(String[] args) {
        new Kid();
        System.out.println();
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
GPK
```

Each constructor first calls its superclass constructor (implicit `super()`), so bodies complete from the top of the hierarchy down.

</details>

### Q2. What does this print? (overriding through a parent reference)

**Style:** Placement-style · Frequently useful

```java
class Phone {
    String ring() {
        return "ring";
    }
}

class SmartPhone extends Phone {
    @Override
    String ring() {
        return "melody";
    }
}

public class RingQuestion {
    public static void main(String[] args) {
        Phone p = new SmartPhone();
        System.out.println(p.ring());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
melody
```

The reference type is `Phone`, but the object is a `SmartPhone`; overridden instance methods are chosen by the object type.

</details>

### Q3. What does this print? (static and instance counters)

**Style:** Service-company-style

```java
public class Visitors {

    static int total = 0;
    int mine = 0;

    void visit() {
        total++;
        mine++;
    }

    public static void main(String[] args) {
        Visitors a = new Visitors();
        Visitors b = new Visitors();
        a.visit();
        a.visit();
        b.visit();
        System.out.println(a.mine + " " + b.mine + " " + Visitors.total);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
2 1 3
```

`mine` is per object; `total` is one shared variable.

</details>

### Q4. What does this print? (string equality)

**Style:** Placement-style · Java interview

```java
public class StringEquality {
    public static void main(String[] args) {
        String a = "oop";
        String b = "oop";
        String c = new String("oop");
        System.out.println((a == b) + " " + (a == c) + " " + a.equals(c));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
true false true
```

Identical literals share one pooled object; `new String` creates a separate object; `equals` compares contents.

</details>

### Q5. What does this print? (default values)

**Style:** Placement-style

```java
public class FieldDefaults {

    static class Profile {
        String name;
        int age;
        boolean verified;
        double score;
    }

    public static void main(String[] args) {
        Profile p = new Profile();
        System.out.println(p.name + "," + p.age + "," + p.verified + "," + p.score);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
null,0,false,0.0
```

Fields receive default values; only local variables must be assigned before use.

</details>

## Intermediate

### Q6. What does this print? (field vs method)

**Style:** Java interview · Frequently useful

```java
class Base {
    String tag = "base";

    String tag() {
        return tag;
    }
}

class Derived extends Base {
    String tag = "derived";

    @Override
    String tag() {
        return tag;
    }
}

public class FieldMethod {
    public static void main(String[] args) {
        Base b = new Derived();
        System.out.println(b.tag + " " + b.tag());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
base derived
```

Field access uses the reference type (`Base`); the method is overridden, so `Derived.tag()` runs and reads `Derived`'s field.

</details>

### Q7. What does this print? (static method hiding)

**Style:** Java interview

```java
class Tool {
    static String name() {
        return "tool";
    }
}

class Hammer extends Tool {
    static String name() {
        return "hammer";
    }
}

public class HidingQuiz {
    public static void main(String[] args) {
        Tool t = new Hammer();
        Hammer h = new Hammer();
        System.out.println(t.name() + " " + h.name());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
tool hammer
```

Static methods are hidden, not overridden: the declared type decides.

</details>

### Q8. What does this print? (overload chosen by static type)

**Style:** Java interview

```java
public class OverloadStatic {

    static String kind(Object o) {
        return "object";
    }

    static String kind(String s) {
        return "string";
    }

    public static void main(String[] args) {
        Object x = "text";
        String y = "text";
        System.out.println(kind(x) + " " + kind(y) + " " + kind(null));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
object string string
```

Overloads are chosen by declared types at compile time; `null` matches the most specific applicable overload, `kind(String)`.

</details>

### Q9. What does this print? (widening vs boxing)

**Style:** Java interview

```java
public class WidenBox {

    static void show(long n) {
        System.out.println("long");
    }

    static void show(Integer n) {
        System.out.println("Integer");
    }

    public static void main(String[] args) {
        int value = 7;
        show(value);
        show(Integer.valueOf(value));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
long
Integer
```

For an `int`, widening to `long` (phase 1) is preferred over boxing to `Integer` (phase 2). An actual `Integer` argument matches exactly.

</details>

### Q10. What does this print, or does it throw? (casting)

**Style:** Service-company-style · Java interview

```java
public class CastQuiz {

    static class Fruit { }
    static class Apple extends Fruit { }
    static class Mango extends Fruit { }

    public static void main(String[] args) {
        Fruit f = new Apple();
        System.out.println(f instanceof Apple);
        System.out.println(f instanceof Mango);
        try {
            Mango m = (Mango) f;
            System.out.println("cast ok");
        } catch (ClassCastException e) {
            System.out.println("ClassCastException");
        }
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
true
false
ClassCastException
```

The cast compiles (a `Fruit` might be a `Mango`) but fails at runtime because the object is an `Apple`.

</details>

### Q11. What does this print? (equals without hashCode)

**Style:** Java interview · Backend interview

```java
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class EqualsOnly {

    static class Pin {
        final String code;

        Pin(String code) {
            this.code = code;
        }

        @Override
        public boolean equals(Object o) {
            return o instanceof Pin && ((Pin) o).code.equals(code);
        }
    }

    public static void main(String[] args) {
        List<Pin> list = new ArrayList<>(List.of(new Pin("620001")));
        Set<Pin> set = new HashSet<>(List.of(new Pin("620001")));
        System.out.println(list.contains(new Pin("620001")));
        System.out.println(set.contains(new Pin("620001")));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
true
false
```

`ArrayList.contains` uses only `equals`. `HashSet` uses `hashCode` first; without an override, equal pins almost certainly have different identity hash codes, so the lookup searches the wrong bucket. (Strictly "almost certainly" — which is why the bug is intermittent.)

</details>

### Q12. What does this print? (interface default vs class method)

**Style:** Java interview

```java
interface Greeter {
    default String greet() {
        return "hello from interface";
    }
}

class Base {
    public String greet() {
        return "hello from class";
    }
}

class Mixed extends Base implements Greeter { }

public class DefaultQuiz {
    public static void main(String[] args) {
        Greeter g = new Mixed();
        System.out.println(g.greet());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
hello from class
```

A method inherited from a class always wins over an interface default method.

</details>

### Q13. What does this print? (initialisation order)

**Style:** Placement-style · Java interview

```java
public class InitQuiz {

    static {
        System.out.println("static block");
    }

    {
        System.out.println("instance block");
    }

    InitQuiz() {
        System.out.println("constructor");
    }

    public static void main(String[] args) {
        System.out.println("main");
        new InitQuiz();
        new InitQuiz();
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
static block
main
instance block
constructor
instance block
constructor
```

The class is initialised before `main` runs (static block once); each `new` runs the instance block before the constructor body.

</details>

### Q14. What does this print? (final reference, mutable object)

**Style:** Placement-style · Frequently useful

```java
import java.util.ArrayList;
import java.util.List;

public class FinalList {
    public static void main(String[] args) {
        final List<String> cities = new ArrayList<>();
        cities.add("Trichy");
        cities.add("Salem");
        cities.remove("Trichy");
        System.out.println(cities);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
[Salem]
```

`final` stops reassigning `cities`; it does not make the list immutable.

</details>

## Advanced

### Q15. What does this print? (overridden method called from a constructor)

**Style:** Product-company-style · Advanced interview

```java
class Account {
    Account() {
        System.out.println("limit = " + limit());
    }

    int limit() {
        return 1000;
    }
}

class PremiumAccount extends Account {
    private int multiplier = 5;

    @Override
    int limit() {
        return 1000 * multiplier;
    }
}

public class HalfBuiltQuiz {
    public static void main(String[] args) {
        Account a = new PremiumAccount();
        System.out.println("later = " + a.limit());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
limit = 0
later = 5000
```

`Account()` runs before `PremiumAccount`'s field initialiser, but `limit()` still dispatches to the override, which sees `multiplier == 0`.

</details>

### Q16. What does this print? (private method is not overridden)

**Style:** Java interview · Advanced interview

```java
class Report {
    private String format() {
        return "plain";
    }

    String render() {
        return "[" + format() + "]";
    }
}

class HtmlReport extends Report {
    String format() {
        return "html";
    }
}

public class PrivateQuiz {
    public static void main(String[] args) {
        Report r = new HtmlReport();
        System.out.println(r.render() + " " + new HtmlReport().format());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
[plain] html
```

`Report.format()` is private, so `render()` calls it directly; `HtmlReport.format()` is a separate method, visible only through an `HtmlReport` reference.

</details>

### Q17. What does this print? (overload + override)

**Style:** Product-company-style

```java
class Animal {
    String meet(Animal a) {
        return "A/A";
    }

    String meet(Dog d) {
        return "A/D";
    }
}

class Dog extends Animal {
    @Override
    String meet(Animal a) {
        return "D/A";
    }
}

public class MeetQuiz {
    public static void main(String[] args) {
        Animal x = new Dog();
        Animal y = new Dog();
        Dog z = new Dog();
        System.out.println(x.meet(y) + " " + x.meet(z) + " " + z.meet(y));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
D/A A/D D/A
```

- `x.meet(y)`: `y` is declared `Animal` → `meet(Animal)`; object is a `Dog`, which overrides it → `D/A`.
- `x.meet(z)`: `z` is declared `Dog` → `meet(Dog)`; `Dog` does not override that one → `A/D`.
- `z.meet(y)`: `meet(Animal)` → `D/A`.

</details>

### Q18. What does this print? (mutable key in a HashMap)

**Style:** Backend interview · Advanced interview

```java
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

public class MutableKeyQuiz {

    static class Room {
        int number;

        Room(int number) {
            this.number = number;
        }

        @Override
        public boolean equals(Object o) {
            return o instanceof Room && ((Room) o).number == number;
        }

        @Override
        public int hashCode() {
            return Objects.hash(number);
        }
    }

    public static void main(String[] args) {
        Map<Room, String> guests = new HashMap<>();
        Room r = new Room(101);
        guests.put(r, "Nandhini");
        r.number = 202;
        System.out.println(guests.get(r) + " " + guests.get(new Room(101)) + " " + guests.size());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
null null 1
```

The entry stays in the bucket for hash(101). `get(r)` searches the bucket for 202; `get(new Room(101))` finds the bucket but `equals` fails because the stored key now says 202. The entry is stranded.

</details>

### Q19. Does this compile? (overriding rules)

**Style:** Java interview

```java
import java.io.IOException;

class Loader {
    protected Object load() throws IOException {
        return "data";
    }
}

class SafeLoader extends Loader {
    @Override
    public String load() {
        return "safe data";
    }
}

class StrictLoader extends Loader {
    @Override
    Object load() {               // compile-time error
        return "strict";
    }
}
```

<details>
<summary>Answer</summary>

`SafeLoader` is fine: wider access (`public`), covariant return (`String`), no checked exception. `StrictLoader` does **not** compile: package-private access is narrower than `protected`.

</details>

### Q20. What does this print? (super call inside a chain)

**Style:** Product-company-style

```java
class Level1 {
    String who() {
        return "1";
    }

    String describe() {
        return who();
    }
}

class Level2 extends Level1 {
    @Override
    String who() {
        return "2";
    }

    @Override
    String describe() {
        return super.describe() + "+" + super.who();
    }
}

class Level3 extends Level2 {
    @Override
    String who() {
        return "3";
    }
}

public class SuperChainQuiz {
    public static void main(String[] args) {
        Level1 obj = new Level3();
        System.out.println(obj.describe());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
3+1
```

`describe()` runs `Level2`'s version (inherited by `Level3`). `super.describe()` runs `Level1.describe()`, whose `who()` call is virtual → `Level3.who()` → `3`. `super.who()` written inside `Level2` refers to `Level2`'s superclass and is non-virtual → `Level1.who()` → `1`. (`super` always means the superclass of the class where the code is written, not of the runtime object.)

</details>
