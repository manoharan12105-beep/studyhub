# Composite

**Category:** Structural · **Interview priority:** Frequently useful

## Intent

Compose objects into **tree structures** to represent part–whole hierarchies, and let clients treat **individual objects and compositions uniformly** through one interface.

## The Problem

An online store sells single products and **bundles** ("Back-to-School Kit" = notebook pack + geometry box + a "Stationery Combo" bundle, which itself contains pens and erasers). The cart, pricing and invoice code must compute prices, weights and item counts for anything a customer adds — product or bundle, nested to any depth.

## Why the Naive Solution Fails

```java
long price(Object item) {
    if (item instanceof Product) {
        return ((Product) item).price();
    } else if (item instanceof Bundle) {
        long total = 0;
        for (Object child : ((Bundle) item).children()) {
            total += price(child);                  // recursion written by every client
        }
        return total - ((Bundle) item).discount();
    }
    throw new IllegalArgumentException();
}
```

- Every client (pricing, shipping weight, invoice lines) repeats the type checks and the recursion.
- Adding a new kind of node (a gift card, a subscription) means editing every client.

## The Pattern Idea

Give leaves and containers a **common interface** (`CartItem`). A **leaf** implements operations directly; a **composite** stores children of the **same interface** and implements operations by **delegating to its children** and combining the results. Clients call the interface and never check types; the recursion lives in the composite.

## Structure

```text
              «interface» CartItem (Component)
              + priceRupees(), + weightGrams(), + describe(indent)
                  ▲                         ▲
                  ┆                         ┆
          Product (Leaf)            Bundle (Composite)
                                    - children: List<CartItem>  ◆──── 0..* CartItem
                                    + add(CartItem)
```

| Participant | In the example |
|-------------|----------------|
| Component | `CartItem` |
| Leaf | `Product` |
| Composite | `Bundle` (holds `CartItem` children) |
| Client | Cart / checkout code using `CartItem` |

## Java Implementation

```java
import java.util.ArrayList;
import java.util.List;

public class CompositeDemo {

    interface CartItem {
        long priceRupees();
        int weightGrams();
        void describe(String indent);
    }

    // Leaf
    record Product(String name, long priceRupees, int weightGrams) implements CartItem {
        public void describe(String indent) {
            System.out.println(indent + name + " Rs " + priceRupees);
        }
    }

    // Composite
    static class Bundle implements CartItem {
        private final String name;
        private final int discountPercent;
        private final List<CartItem> children = new ArrayList<>();

        Bundle(String name, int discountPercent) {
            this.name = name;
            this.discountPercent = discountPercent;
        }

        Bundle add(CartItem item) {
            children.add(item);
            return this;
        }

        public long priceRupees() {
            long total = 0;
            for (CartItem child : children) {
                total += child.priceRupees();          // recursion: child may itself be a bundle
            }
            return total - total * discountPercent / 100;
        }

        public int weightGrams() {
            int total = 0;
            for (CartItem child : children) {
                total += child.weightGrams();
            }
            return total;
        }

        public void describe(String indent) {
            System.out.println(indent + name + " (" + discountPercent + "% off) Rs " + priceRupees());
            for (CartItem child : children) {
                child.describe(indent + "  ");
            }
        }
    }

    public static void main(String[] args) {
        Bundle combo = new Bundle("Stationery Combo", 10)
                .add(new Product("Pen pack", 100, 80))
                .add(new Product("Erasers", 40, 30));

        Bundle schoolKit = new Bundle("Back-to-School Kit", 5)
                .add(new Product("Notebook pack", 300, 900))
                .add(new Product("Geometry box", 160, 250))
                .add(combo);                                  // a bundle inside a bundle

        List<CartItem> cart = List.of(schoolKit, new Product("Water bottle", 250, 300));
        long total = 0;
        int weight = 0;
        for (CartItem item : cart) {                          // client treats both kinds uniformly
            item.describe("");
            total += item.priceRupees();
            weight += item.weightGrams();
        }
        System.out.println("Cart total Rs " + total + ", weight " + weight + " g");
    }
}
```

**Output:**

```text
Back-to-School Kit (5% off) Rs 557
  Notebook pack Rs 300
  Geometry box Rs 160
  Stationery Combo (10% off) Rs 126
    Pen pack Rs 100
    Erasers Rs 40
Water bottle Rs 250
Cart total Rs 807, weight 1560 g
```

Check: the combo is 140 − 14 = 126; the kit is (300 + 160 + 126) = 586 − 29 (5%, integer division) = 557.

### Design choice: where do `add`/`remove` live?

| Option | Pro | Con |
|--------|-----|-----|
| Only in the composite (above) | Type-safe: you cannot add children to a leaf | Clients must know they have a composite to add children |
| In the component interface ("transparency") | Clients treat every node identically | Leaves must throw or ignore `add` — an LSP smell |

Modern Java code usually prefers **safety** (child management only on the composite).

## Execution Flow

1. The client calls `priceRupees()` on a top-level item.
2. A leaf returns its own price; a composite asks each child (recursively) and combines the results with its own rule (discount).
3. The client never distinguishes leaves from composites.

## Real-World Examples

- GUI toolkits: a container (panel) holds components, which may themselves be containers; painting and layout recurse through the tree.
- File systems: directories contain files and directories.
- Organisation charts, bill of materials, menus with sub-menus, expression trees, HTML/XML DOM nodes.

## When to Use

- The domain is naturally a **tree** of part–whole relationships.
- Clients should treat single items and groups **the same way**.
- Operations aggregate over the tree (total, count, render, search).

## When Not to Use

- The structure is flat or fixed depth — a list or a simple class is clearer.
- Leaves and containers have very different operations, so a common interface would be artificial.

## Advantages

- Uniform client code; no type checks.
- New leaf or composite types plug in without changing clients (OCP).
- Recursive operations are written once, in the composite.

## Disadvantages

- The common interface can become too general (operations meaningful only for some nodes).
- Hard to restrict which children a composite may hold using types alone (e.g. "a bundle may not contain gift cards").
- Deep trees may need care with recursion depth and cycles.

## Related Patterns

- **Iterator** traverses composite structures; **Visitor** adds operations to them without changing node classes.
- **Decorator** also wraps objects with the same interface, but has exactly one wrapped child and adds behaviour; Composite has many children and aggregates.
- **Builder** often constructs composite trees.
- **Flyweight** can share leaf objects in large trees.

## SOLID Connection

- **OCP:** new node types without editing client code.
- **LSP:** leaves and composites must both honour the component contract — which is why child-management methods usually stay off the shared interface.
- **SRP:** aggregation logic lives in the composite, not in every client.

## Common Mistakes

- Putting `add()` on the component and letting leaves throw (`UnsupportedOperationException`) — breaks substitutability.
- Letting clients `instanceof`-check nodes anyway.
- Allowing cycles (a bundle containing itself), causing infinite recursion — guard in `add`.
- Exposing the internal children list for modification.

## Key Takeaways

- Composite = common interface for leaves and containers; containers delegate to children recursively.
- Clients treat single objects and groups uniformly.
- Prefer child management on the composite only, for type safety.
- Natural fit for any part–whole tree.
