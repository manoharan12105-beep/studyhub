# Logical Venn Diagrams

## Concept

A **Venn diagram** draws each class (group) as a circle. Where circles overlap, members belong to both classes; a circle inside another is a subclass; separate circles share no members.

Two kinds of questions use them:

1. **Choose the diagram** that best represents the relationship between three classes (e.g. *Doctors, Women, Mothers*).
2. **Count regions** — a diagram or a set of numbers is given, and you find how many belong to some combination of classes.

The same thinking underlies [Syllogisms](../syllogisms/content.md), where the diagrams are used to test conclusions.

## Rules

### Relationship between two classes

| Relationship | Diagram | Example |
|--------------|---------|---------|
| One is part of the other | Circle inside circle | Cats ⊂ Animals |
| No common members | Separate circles | Cats, Tables |
| Some common members | Overlapping circles | Doctors, Women |

To relate three classes, decide the relationship for **each pair** (A–B, B–C, A–C), then pick the diagram that shows all three at once.

### The eight common three-class diagrams

![Eight Venn diagram types for three classes A, B and C: 1 all separate; 2 nested; 3 two separate inside a third; 4 two overlapping and a third separate; 5 one inside another with a third overlapping both; 6 all three overlapping; 7 two overlapping inside a third; 8 one inside another with a third separate](images/venn-diagram-types.svg)

| Type | Structure | Example |
|------|-----------|---------|
| 1 | All three separate | Pens, Cats, Rivers |
| 2 | Nested: A ⊂ B ⊂ C | Chennai, Tamil Nadu, India |
| 3 | A and B separate, both inside C | Men, Women, Human beings |
| 4 | A and B overlap; C separate | Doctors, Women, Rivers |
| 5 | A ⊂ B; C overlaps both | Mothers, Women, Doctors |
| 6 | All three overlap | Teachers, Women, Singers |
| 7 | A and B overlap, both inside C | Doctors, Women, Human beings |
| 8 | A ⊂ B; C separate | Cats, Animals, Tables |

### Counting formulas

```text
Two classes:   n(A or B) = n(A) + n(B) − n(A and B)
Three classes: n(A or B or C) = n(A) + n(B) + n(C)
                              − n(A and B) − n(B and C) − n(A and C)
                              + n(A and B and C)
Neither/none = Total − n(at least one)
```

- **Why:** adding the circles counts each overlap twice (or three times for the centre), so subtract the pairwise overlaps and add back the centre that was removed too often.
- **Example:** in a class of 50, 30 like tea, 25 like coffee and 10 like both → at least one = 30 + 25 − 10 = 45 → neither = 5.

### Reading a region table

When the count in each region is given, "exactly", "only" and "at least" decide which regions to add:

| Phrase | Regions to add |
|--------|----------------|
| Only A | A without B or C |
| Exactly two | AB-only + BC-only + AC-only |
| At least two | Exactly two + all three |
| Total in A | Every region inside A |

## Solving Approach

### Choosing a diagram

1. For each pair, decide: subset, separate or overlap.
2. Find the diagram that matches all three pairs.
3. Prefer the **general** relationship — two classes overlap if some (not necessarily all) members can belong to both, e.g. some doctors are women.

### Counting

1. Write the region counts (or set up the formula).
2. Translate the question phrase into regions.
3. Add carefully; check that all regions add up to the total if it is given.

## Problem Patterns

### Pattern 1: Choose the diagram

**Example:** *Doctors, Women, Mothers* → Mothers ⊂ Women; Doctors overlap Women and Mothers → **Type 5**.

### Pattern 2: Count from regions

**Example:** a sports survey gives Only Cricket 12, Only Football 9, Only Hockey 7, Cricket & Football only 4, Football & Hockey only 3, Cricket & Hockey only 5, all three 2. Exactly two sports = 4 + 3 + 5 = 12; at least two = 14; cricket in total = 12 + 4 + 5 + 2 = 23.

### Pattern 3: Formula questions

**Example:** 100 students: 50 study Maths, 40 Physics, 35 Chemistry; 15 Maths & Physics, 12 Physics & Chemistry, 10 Maths & Chemistry, 5 all three → at least one = 125 − 37 + 5 = 93 → none = 7.

## Common Mistakes

- Choosing "subset" when only some members belong (not all doctors are women).
- Forgetting to add back the centre in the three-class formula.
- Treating "Cricket & Football" as "only Cricket & Football" when the data includes the centre (read the wording).
- Mixing up "exactly two" and "at least two".

## Placement Tips

- Decide pair relationships quickly with "all / none / some" — it narrows the options at once.
- In counting questions, sketch the circles and write numbers in regions; it is faster than juggling formulas.
- Check that all region counts sum to the total when one is given.

## Key Takeaways

- Two classes are nested, separate or overlapping; three classes combine these pairwise.
- n(A ∪ B) = n(A) + n(B) − n(A ∩ B); for three classes, subtract pairs and add back the centre.
- "Only", "exactly" and "at least" pick different regions.
