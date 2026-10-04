# Prototype

**Category:** Creational · **Interview priority:** Advanced / awareness

> [!NOTE]
> **Advanced topic.** Prototype is asked less often than the core creational patterns; know its idea, its link to copying objects, and its trade-offs. Study [The Object Class](../../java-oop/java-object-class/content.md) (shallow vs deep copy) first.

## Intent

Create new objects by **copying an existing, pre-configured instance** (the prototype) instead of building them from scratch with `new` and many setup steps.

## The Problem

A marketing tool creates email campaigns from templates. A "Festival Sale" template has a subject, a body, styling, a list of sections and tracking settings that took a designer many steps to configure. Each new campaign should start as a copy of a template and then be tweaked — without the code that creates campaigns knowing every template's concrete class or setup steps.

## Why the Naive Solution Fails

- Re-running the full setup code for each campaign duplicates configuration logic and is slow if setup is expensive (loading assets, parsing).
- Code that wants "a copy of this object" may only have it through an interface (`CampaignTemplate`), so it cannot call the right concrete constructor.
- Copying fields by hand at every call site breaks whenever a field is added.

## The Pattern Idea

Give the objects themselves a **copy operation** (`copy()`), so any client holding a reference — even through an interface — can ask for a duplicate. Often combined with a **registry** of named prototypes.

## Structure

```text
 «interface» Prototype            Client ──"copy of 'diwali'"──▶ PrototypeRegistry
 + copy(): Prototype                                         (name → prototype)
        ▲
   ConcreteTemplate ── copy() returns new ConcreteTemplate(this)  (deep-copies mutable parts)
```

| Participant | Role |
|-------------|------|
| Prototype | Declares `copy()` |
| ConcretePrototype | Implements `copy()`, deciding what is deep- or shallow-copied |
| Registry (optional) | Stores named prototypes and returns copies |
| Client | Asks for copies, then customises them |

## Java Implementation

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PrototypeDemo {

    interface CampaignTemplate {
        CampaignTemplate copy();
        void setSubject(String subject);
        void addSection(String section);
        String describe();
    }

    static class EmailCampaign implements CampaignTemplate {
        private String subject;
        private final List<String> sections;               // mutable part: must be deep-copied

        EmailCampaign(String subject, List<String> sections) {
            this.subject = subject;
            this.sections = new ArrayList<>(sections);
        }

        private EmailCampaign(EmailCampaign other) {        // copy constructor used by copy()
            this(other.subject, other.sections);
        }

        @Override
        public CampaignTemplate copy() {
            return new EmailCampaign(this);
        }

        public void setSubject(String subject) {
            this.subject = subject;
        }

        public void addSection(String section) {
            sections.add(section);
        }

        public String describe() {
            return subject + " " + sections;
        }
    }

    static class TemplateRegistry {
        private final Map<String, CampaignTemplate> prototypes = new HashMap<>();

        void register(String name, CampaignTemplate prototype) {
            prototypes.put(name, prototype);
        }

        CampaignTemplate create(String name) {
            CampaignTemplate prototype = prototypes.get(name);
            if (prototype == null) {
                throw new IllegalArgumentException("no template " + name);
            }
            return prototype.copy();                         // never hand out the prototype itself
        }
    }

    public static void main(String[] args) {
        TemplateRegistry registry = new TemplateRegistry();
        registry.register("festival", new EmailCampaign("Festival Sale", List.of("banner", "offers")));

        CampaignTemplate pongal = registry.create("festival");
        pongal.setSubject("Pongal Sale");
        pongal.addSection("sugarcane-theme");

        CampaignTemplate diwali = registry.create("festival");
        diwali.setSubject("Diwali Sale");

        System.out.println(pongal.describe());
        System.out.println(diwali.describe());
        System.out.println(registry.create("festival").describe());   // prototype unchanged
    }
}
```

**Output:**

```text
Pongal Sale [banner, offers, sugarcane-theme]
Diwali Sale [banner, offers]
Festival Sale [banner, offers]
```

The copy constructor duplicates the section list, so customising one campaign never affects the prototype or other copies.

### Prototype and `clone()`

Java's `Object.clone()` with `Cloneable` is the language's built-in prototype mechanism, but it is shallow by default, bypasses constructors, throws a checked exception and clashes with `final` fields. A `copy()` method backed by a copy constructor (as above) is usually clearer. See [The Object Class](../../java-oop/java-object-class/content.md#clone--awareness).

## Execution Flow

1. Prototypes are configured once and registered.
2. A client asks the registry (or any prototype reference) for a copy.
3. `copy()` creates a new object with duplicated state; the client customises the copy.

## Real-World Examples

- Copy constructors and `copyOf` methods: `new ArrayList<>(other)`, `List.copyOf`, `Arrays.copyOf`.
- Spring's **prototype bean scope** creates a new instance for each request of the bean — related in name, although Spring builds a fresh instance rather than copying one.
- Document editors ("duplicate slide"), game engines (spawning enemies from a configured prototype), and test-data templates.

## When to Use

- Objects are expensive or complex to configure, and many similar instances are needed.
- Code must copy objects it knows only through an interface.
- You want to add new "kinds" at runtime by registering configured prototypes instead of writing subclasses.

## When Not to Use

- Objects are cheap to create with a constructor or builder.
- Objects are immutable — they can simply be shared; no copy is needed.
- Deep-copy rules are complicated (cyclic references, shared resources) and error-prone.

## Advantages

- Hides concrete classes from the code that creates copies.
- Avoids repeating expensive setup.
- New variants by configuration rather than subclassing.

## Disadvantages

- Every class needs a correct copy implementation; deep vs shallow decisions are easy to get wrong.
- Copying objects with references to shared resources (connections, files) needs careful rules.

## Related Patterns

- **Abstract Factory** can store prototypes and return copies instead of instantiating classes.
- **Builder** constructs objects from scratch step by step; Prototype starts from an existing object.
- **Memento** also copies state, but to restore an object later, not to create new ones.
- **Composite** and **Decorator** structures often need deep copies when used as prototypes.

## SOLID Connection

- **OCP:** new variants are added as new registered prototypes, not new code paths.
- **DIP:** clients copy through the `CampaignTemplate` abstraction.

## Common Mistakes

- Shallow copies sharing mutable lists between prototype and copies.
- Returning the registered prototype itself instead of a copy.
- Using `clone()` without understanding its shallow, constructor-skipping behaviour.

## Key Takeaways

- Prototype = create objects by copying configured instances through a `copy()` operation.
- Decide carefully what to deep-copy; prefer copy constructors over `clone()`.
- Useful for expensive setup and runtime-registered variants; unnecessary for immutable or cheap objects.
