# Puzzles

## Concept

A **puzzle** gives a set of people (or objects) and several attributes — floors, days, colours, professions, cities — plus clues linking them. You must find the unique arrangement that satisfies every clue, then answer questions about it.

Puzzles look intimidating because of the amount of information, but they yield to a systematic method: **organise the data in a grid or table, place definite clues first, and eliminate possibilities** until only one arrangement remains. [Seating Arrangement](../seating-arrangement/content.md) is a special kind of puzzle with positions only.

## Rules

### Types of puzzles

| Type | Structure | Best tool |
|------|-----------|-----------|
| Floor / ordering | People on floors 1…n, or in a sequence | Vertical column, bottom = floor 1 |
| Scheduling | Events on days, months or time slots | Row of days |
| Attribute matching | Each person has one item from each category | Elimination grid |
| Mixed | Order plus attributes | Table with one row per position |

### Kinds of clues

| Clue type | Example | How to use |
|-----------|---------|------------|
| Definite | "C lives on the top floor" | Place immediately |
| Relative | "A lives immediately above C" | Place once C is known; otherwise keep as a pair |
| Range | "B lives above A" | Restricts positions |
| Negative | "E is not a doctor" | Cross out cells in the grid |
| Linking | "The engineer likes blue" | Connects two categories — powerful for elimination |

## Solving Approach

1. **Set up the structure** — a column for floors, a row for days, or a grid with people as rows and attribute values as columns.
2. **Place definite clues.**
3. **Apply relative and linking clues** to the people already placed.
4. **Use negative clues** to cross out cells; when a row or column has one cell left, fill it.
5. If you must branch into cases, write each case separately and continue until a contradiction removes one.
6. **Verify every clue** against the final arrangement before answering.

### Elimination grid

For attribute puzzles, mark ✓ and ✗:

```text
          red   blue  green │ doctor engineer teacher
Asha       ✗     ✓     ✗    │   ✗       ✓        ✗
Bala       ✗     ✗     ✓    │   ✓       ✗        ✗
Chitra     ✓     ✗     ✗    │   ✗       ✗        ✓
```

Every row and every column has exactly one ✓.

## Problem Patterns

### Pattern 1: Floor puzzle

**Recognise it:** people on numbered floors with "above", "below", "immediately above" and odd/even clues.

**Approach:** draw floors bottom to top; place definite floors, then test each case of a relative clue and discard the one that breaks a later clue. Worked in full in [E3](examples.md#e3-floor-puzzle).

### Pattern 2: Attribute matching

**Recognise it:** each person has exactly one item from two or more categories.

**Approach:** elimination grid; fill definite cells, then use linking clues ("the engineer likes blue") and negative clues. Worked in [E2](examples.md#e2-attribute-matching).

### Pattern 3: Scheduling

**Recognise it:** events assigned to days or slots, with "the day after" and "not on" clues.

**Approach:** a row of days; place fixed events, then slide consecutive pairs through the free slots. Worked in [E1](examples.md#e1-scheduling).

## Common Mistakes

- Starting with a negative or relative clue and guessing.
- Forgetting a clue at the end — always re-verify all clues.
- Treating "above" as "immediately above".
- Not exploring both cases when a clue allows two placements.

## Placement Tips

- Puzzle sets carry several questions; a careful 4–5 minutes on setup is usually worth it.
- If a puzzle has not resolved after two passes, it may be a time sink — move on and return later.
- Linking clues ("the engineer likes blue") often unlock the grid; look for them after placing definite clues.

## Key Takeaways

- Organise first: column, row or elimination grid.
- Definite → relative/linking → negative clues.
- Branch into cases only when forced, and close them with contradictions.
- Verify every clue before answering.
