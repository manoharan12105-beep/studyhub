# Seating Arrangement

## Concept

Seating-arrangement questions give clues about where people sit — in a row or around a table — and ask questions about the final arrangement. They are small logic puzzles. The skill is **turning each clue into a position constraint** and combining them in a sensible order, sketching as you go.

Almost all errors come from left/right confusion, so the first thing to fix is **which way each person is facing**.

## Linear

### Directions in a row

| Facing | A person's right is | A person's left is |
|--------|---------------------|--------------------|
| North (away from you, towards the top of the page) | Your right (→) | Your left (←) |
| South (towards you, the reader) | Your left (←) | Your right (→) |

**Tip:** for a row facing north, draw positions 1, 2, 3 … from left to right; "immediately to the right of X" means position X + 1. For people facing south, reverse it.

Common clue meanings:

- "A sits at an extreme end" → position 1 or n.
- "A sits third from the left end" → position 3.
- "A sits immediately to the right of B" → A = B + 1 (facing north).
- "A and B are neighbours" → |A − B| = 1.
- "Two people sit between A and B" → |A − B| = 3.

### Worked arrangement

Six friends P, Q, R, S, T and U sit in a row facing north.

1. R sits third from the left end.
2. Q sits immediately to the right of R.
3. P sits at the extreme right end.
4. T is not adjacent to Q.
5. S sits somewhere to the left of U.
6. T sits at one of the extreme ends.

**Solving:**

| Step | Clue used | Result |
|------|-----------|--------|
| 1 | R = 3, Q = 4, P = 6 (clues 1–3) | _ _ R Q _ P |
| 2 | T is at an end and position 6 is taken → T = 1 (clue 6) | T _ R Q _ P |
| 3 | S and U fill 2 and 5; S is left of U → S = 2, U = 5 | T S R Q U P |
| 4 | Check clue 4: T (1) is not next to Q (4) ✓ | |

**Final:** T S R Q U P.

> [!NOTE]
> Without clue 6, both T S R Q U P and S T R Q U P fit every other clue. Always check that your arrangement is the only one possible.

## Circular

### Directions around a table

| Everyone faces | A person's left is | A person's right is |
|----------------|--------------------|---------------------|
| The centre | Clockwise | Anticlockwise |
| Outwards | Anticlockwise | Clockwise |

**Why:** imagine sitting at the bottom of the table facing the centre (north). Your right hand points east — along the table that is the anticlockwise direction (viewed from above).

- "Opposite" in a table of 2k people means k seats apart.
- In a circle, rotating everyone gives the same arrangement — so fix one person's seat first and place others relative to them.

### Worked arrangement

Six friends A, B, C, D, E and F sit around a circular table facing the centre.

1. A sits opposite D.
2. B sits second to the right of A.
3. C sits immediately to the right of D.
4. E sits immediately to the left of A.

**Solving:** fix A at the top. Right = anticlockwise, left = clockwise.

1. D is opposite A → bottom.
2. Second to the right of A (anticlockwise two seats) → B at bottom-left.
3. Immediately right of D (anticlockwise one seat) → C at bottom-right.
4. Immediately left of A (clockwise one seat) → E at top-right.
5. F takes the remaining seat, top-left.

```text
            A
     F             E
     B             C
            D
```

(Clockwise from the top: A, E, C, D, B, F.)

## Solving Approach

1. Fix the facing direction and write down what left/right mean.
2. Start with **definite** clues (fixed positions, ends, opposite seats).
3. Add clues that attach someone to an already-placed person.
4. Use negative clues ("not adjacent", "not at an end") last, to eliminate cases.
5. If a clue allows two cases, sketch both and continue until one fails.
6. Confirm every clue against the final arrangement.

## Common Mistakes

- Using your own left/right instead of the seated person's.
- Forgetting that facing the centre makes right = anticlockwise.
- Placing an uncertain clue first and building on a wrong case.
- Stopping at the first arrangement that fits without checking for a second.

## Placement Tips

- Seating sets usually carry 4–5 questions; careful setup is worth the time.
- Keep the sketch tidy; redraw if cases branch.
- In circular puzzles, fix the person mentioned most often at the top.

## Key Takeaways

- Facing north in a row: right = position + 1. Facing south: reversed.
- Facing the centre: left = clockwise, right = anticlockwise.
- Definite clues first, relative clues next, negative clues last.
- Check uniqueness and every clue at the end.
