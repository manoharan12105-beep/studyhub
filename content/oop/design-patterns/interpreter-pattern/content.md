# Interpreter

**Category:** Behavioral · **Interview priority:** Advanced / awareness

> [!NOTE]
> **Advanced topic.** Interpreter applies only when you need a small language or rule grammar. Know the idea (one class per grammar rule, evaluated recursively) and its limits. Study [Composite](../composite-pattern/content.md) first — an interpreter's expression tree is a composite.

## Intent

Given a simple **language** (a grammar of rules), define a **class for each grammar rule** and represent sentences as a **tree of these objects** (an abstract syntax tree), which can then be **evaluated (interpreted)** against a context.

## The Problem

A shopping app lets the marketing team define coupon eligibility rules without new code releases:

```text
cartTotal > 1000 AND (category = "books" OR NOT firstOrder)
```

Rules combine a few conditions with `AND`, `OR` and `NOT`, and new rules are created every week.

## Why the Naive Solution Fails

- Hard-coding each campaign's rule as Java `if` statements needs a code change and deployment per campaign.
- A big method that parses and evaluates strings with nested `if`s becomes unmaintainable as operators grow.

## The Pattern Idea

Model the grammar as classes:

- **Terminal expressions** — leaves of the grammar: `CartTotalAbove(1000)`, `CategoryIs("books")`, `FirstOrder`.
- **Non-terminal expressions** — combinations: `And(left, right)`, `Or(left, right)`, `Not(expr)`.

Every class implements `interpret(context)`. A rule is a tree of these objects; evaluating the root recursively evaluates the whole rule. (Turning the text into a tree is a separate **parsing** step, not part of the pattern.)

## Structure

```text
            «interface» Rule (AbstractExpression)
            + matches(Cart): boolean
              ▲                         ▲
    Terminal expressions          Non-terminal expressions
    CartTotalAbove, CategoryIs,   And(Rule, Rule), Or(Rule, Rule), Not(Rule)
    FirstOrder

 Tree for: total > 1000 AND (category = books OR NOT firstOrder)
                 And
               /     \
   CartTotalAbove     Or
       (1000)       /    \
             CategoryIs   Not
              ("books")     |
                        FirstOrder
```

## Java Implementation

```java
import java.util.Set;

public class InterpreterDemo {

    record Cart(long totalRupees, Set<String> categories, boolean firstOrder) { }

    interface Rule {
        boolean matches(Cart cart);
    }

    // Terminal expressions
    record CartTotalAbove(long rupees) implements Rule {
        public boolean matches(Cart cart) {
            return cart.totalRupees() > rupees;
        }
    }

    record CategoryIs(String category) implements Rule {
        public boolean matches(Cart cart) {
            return cart.categories().contains(category);
        }
    }

    record FirstOrder() implements Rule {
        public boolean matches(Cart cart) {
            return cart.firstOrder();
        }
    }

    // Non-terminal expressions
    record And(Rule left, Rule right) implements Rule {
        public boolean matches(Cart cart) {
            return left.matches(cart) && right.matches(cart);
        }
    }

    record Or(Rule left, Rule right) implements Rule {
        public boolean matches(Cart cart) {
            return left.matches(cart) || right.matches(cart);
        }
    }

    record Not(Rule inner) implements Rule {
        public boolean matches(Cart cart) {
            return !inner.matches(cart);
        }
    }

    public static void main(String[] args) {
        // cartTotal > 1000 AND (category = "books" OR NOT firstOrder)
        Rule coupon = new And(new CartTotalAbove(1000),
                              new Or(new CategoryIs("books"), new Not(new FirstOrder())));

        System.out.println(coupon.matches(new Cart(1500, Set.of("books"), true)));
        System.out.println(coupon.matches(new Cart(1500, Set.of("toys"), true)));
        System.out.println(coupon.matches(new Cart(1500, Set.of("toys"), false)));
        System.out.println(coupon.matches(new Cart(800, Set.of("books"), false)));
    }
}
```

**Output:**

```text
true
false
true
false
```

A small parser (or a JSON rule format from an admin screen) would build these trees at runtime, so new campaigns need no code changes.

## Execution Flow

1. A rule tree is built (by a parser or configuration).
2. `matches(cart)` is called on the root.
3. Each non-terminal evaluates its children and combines the results; terminals check the context directly.

## Real-World Examples

- `java.util.regex.Pattern` compiles a regular expression into an internal tree of node objects that is then matched against input (an interpreter-like design).
- Expression languages such as Spring Expression Language (SpEL) and template/rule engines build and evaluate expression trees.
- SQL `WHERE` clause evaluation, search query filters, feature-flag targeting rules, spreadsheet formulas.

## When to Use

- There is a **simple**, stable grammar, and sentences (rules) change frequently.
- Efficiency is not critical, or the trees are small.

## When Not to Use

- The grammar is large or complex — use a parser generator or an existing expression/rule engine.
- Performance-critical evaluation of huge inputs — compile to a more efficient form.
- Only a handful of fixed rules — plain code is simpler.

## Advantages

- Easy to extend the grammar: a new operator is a new class.
- Each rule class is small and testable.
- Rules become data that can be stored, edited and combined at runtime.

## Disadvantages

- Class count grows with the grammar; complex grammars become hard to maintain.
- Naive tree evaluation can be slow.
- Parsing (text → tree) still has to be written separately.

## Related Patterns

- **Composite:** the abstract syntax tree is a composite of expressions.
- **Visitor:** adds new operations over the tree (pretty-printing, optimisation, validation) without changing expression classes.
- **Flyweight:** shared terminal symbols.
- **Specification** (a domain-driven design pattern): combinable business rules (`and`, `or`, `not`) — essentially this example.

## SOLID Connection

- **OCP:** new grammar elements are new classes.
- **SRP:** each class represents one grammar rule.

## Common Mistakes

- Using Interpreter for a complex language instead of a proper parser or existing engine.
- Mixing parsing logic into expression classes.
- Not guarding against deeply nested or malicious rules when they come from users.

## Key Takeaways

- Interpreter: one class per grammar rule; sentences are expression trees evaluated recursively.
- Good for small, stable grammars with frequently changing rules (filters, eligibility rules).
- Parsing is separate; large grammars need real parsers or engines.
