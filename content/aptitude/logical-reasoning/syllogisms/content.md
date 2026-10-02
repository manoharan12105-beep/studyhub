# Syllogisms

## Concept

A **syllogism** gives two or more statements about groups ("All cats are animals", "Some animals are pets") and asks which conclusions **must** follow. You must accept the statements as true even if they are unrealistic ("All cars are birds"), and judge conclusions only by logic — never by real-world knowledge.

The rule that decides everything:

> A conclusion **follows** only if it is true in **every** possible situation that satisfies the statements.

The safest method is drawing **Venn diagrams**: one circle per group, then checking whether any valid way of drawing them makes the conclusion false. For this, see also [Logical Venn Diagrams](../logical-venn-diagrams/content.md).

## Key Terms

| Statement | Form | Meaning |
|-----------|------|---------|
| All A are B | Universal positive | Circle A lies completely inside circle B |
| No A is B | Universal negative | Circles A and B do not overlap at all |
| Some A are B | Particular positive | At least one A is a B (A and B overlap; possibly more) |
| Some A are not B | Particular negative | At least one A is outside B |

"Some" means **at least one, possibly all**. "Some A are B" does not mean "some A are not B".

## Rules

### Direct conversions (from one statement)

| Statement | What also follows | What does not |
|-----------|-------------------|---------------|
| All A are B | Some A are B; Some B are A | All B are A |
| No A is B | No B is A; Some A are not B; Some B are not A | — |
| Some A are B | Some B are A | All A are B; Some A are not B |
| Some A are not B | — (no conversion) | Some B are not A |

### Combining two statements (middle term B links A and C)

| Statement 1 | Statement 2 | Definite conclusion |
|-------------|-------------|---------------------|
| All A are B | All B are C | All A are C (and Some C are A) |
| All A are B | No B is C | No A is C |
| Some A are B | All B are C | Some A are C |
| Some A are B | No B is C | Some A are not C |
| No A is B | All B are C | Some C are not A |
| No A is B | Some B are C | Some C are not A |
| All A are B | Some B are C | **No definite A–C conclusion** |
| Some A are B | Some B are C | **No definite A–C conclusion** |
| All A are B | All C are B | **No definite A–C conclusion** |

**Why "All A are B + Some B are C" gives nothing about A and C:** the Bs that are C might lie inside A or entirely outside A. Both diagrams are valid, so neither "Some A are C" nor "No A is C" is certain.

### Either–or (complementary pair)

When neither of two conclusions follows on its own, but **one of them must be true** in every situation, the answer is "either I or II follows". This happens with pairs about the same two terms such as:

- "Some A are C" and "No A is C"
- "All A are C" and "Some A are not C"

**Example:** Some dogs are cats; some cats are rats. "Some dogs are rats" and "No dog is a rat" — neither is certain, but one must be true → either I or II.

### Possibility conclusions

"X being Y **is a possibility**" follows if at least one valid diagram makes it true. It does **not** follow if the statements make it impossible.

**Example:** All pens are pencils; no pencil is an eraser. "Some erasers being pens is a possibility" does **not** follow: every pen is a pencil, and no pencil is an eraser, so no pen can be an eraser.

## Solving Approach

1. Draw the statements as Venn circles, starting with the most restrictive statement ("All" or "No").
2. For each conclusion, try to draw a **valid** diagram in which it is false. If you can, it does not follow (unless it is a possibility conclusion).
3. If neither conclusion follows, check the either–or pairs.
4. Choose from the standard options: Only I / Only II / Either I or II / Neither / Both.

## Problem Patterns

### Pattern 1: Chain of "All"

**Example:** All cats are animals; all animals are living beings → "All cats are living beings" ✓ and "Some living beings are cats" ✓ → **Both follow**.

### Pattern 2: Some + All

**Example:** Some pens are books; all books are bags → "Some pens are bags" ✓; "All bags are pens" ✗ → **Only I**.

### Pattern 3: Negative statements

**Example:** No apple is a banana; some bananas are fruits → "Some fruits are not apples" ✓ (those fruits that are bananas) → follows.

### Pattern 4: Either–or

**Example:** see the rule above.

### Pattern 5: Possibility

**Example:** All A are B; some B are C → "Some C are A is a possibility" ✓ (the overlap of B and C might include part of A).

## Common Mistakes

- Using real-world knowledge instead of the given statements.
- Treating "Some A are B" as implying "Some A are not B".
- Concluding "All B are A" from "All A are B".
- Marking a possibility as following when the statements make it impossible.
- Missing either–or cases when both conclusions individually fail.

## Placement Tips

- Draw the minimal diagram first, then try to "break" each conclusion by moving circles while keeping the statements true.
- Memorise the combination table — it settles most two-statement questions instantly.
- A negative conclusion needs at least one negative statement; a definite conclusion needs a "some/all" link through the middle term.

## Key Takeaways

- A conclusion follows only if it holds in every valid diagram.
- "Some" means at least one, possibly all.
- All A are B → Some B are A; Some A are B ↔ Some B are A; No A is B ↔ No B is A; Some A are not B has no conversion.
- Either–or: neither follows alone, but one of the complementary pair must be true.
- Possibility: true in at least one valid diagram, never contradicted.
