---
name: dsa
description: Explain data structures and algorithms for StudyHub — intuition, step-by-step mechanics, Java 17 implementations, time/space complexity, dry runs, edge cases, DSA interview questions, and specs for interactive visualizations. Use for any topic of type data-structure or algorithm, any Java code in content, or any DSA visualizer. Use together with the study-content skill.
---

# DSA

Teach data structures and algorithms so a beginner can follow every step and an interview candidate can reproduce the code and justify the complexity under pressure.

Use with the `study-content` skill (workflow, writing, questions) and [docs/content-guide.md](../../../docs/content-guide.md) (format). Templates: `templates/lesson/data-structure.md`, `templates/lesson/algorithm.md`, `templates/lesson/pattern.md` (problem-solving patterns: teach recognition, link to the algorithm topic for mechanics).

## Teaching order

1. **Intuition** — a plain-language analogy or picture before any formal detail.
2. **Mechanism** — numbered steps; for data structures, one H3 per operation.
3. **Visual** — a diagram of the structure/state (SVG in `images/` or ASCII ```` ```text ````).
4. **Pseudocode** (algorithms) — language-neutral, short.
5. **Java** — clean implementation.
6. **Dry run** — trace a small, carefully chosen input.
7. **Complexity** — with the reason, not just the Big-O.
8. **Edge cases, mistakes, variations, when to use.**

## Java rules

- **Java 17, standard library only.** No other language unless the owner explicitly asks.
- Full implementations are one compilable public class with a `main` that demonstrates the code on sample input and prints results. Snippets inside operation sections may be just the method.
- Readable over clever: descriptive names (`left`, `right`, `mid`, not `l`, `r`, `m` unless conventional), one statement per line, braces always.
- Use generics where natural (`Node<T>`), `int` arrays for algorithm demos unless generics add value.
- Handle edge cases explicitly (empty input, single element, null) and show them in `main` when instructive.
- Mention the `java.util` equivalent (`ArrayList`, `ArrayDeque`, `PriorityQueue`, `HashMap`, `TreeMap`, `Collections.sort`, `Arrays.binarySearch`, …) and when to prefer it in real code and interviews.
- Avoid features an interviewer may not expect unless they help clarity (no streams for core algorithm logic).
- Comments explain *why* a line exists, not what it does.

### Verifying code (required)

A JDK is installed. For every full program:

```bash
# in a scratch directory, not in the repo
javac ClassName.java && java ClassName
```

- Show the result as `**Output:**` followed by a ` ```text ` block; it must match the real output exactly.
- Delete compiled `.class` files; never commit them.
- If you cannot run it, say so explicitly in your report.

## Complexity

- Give best/average/worst time where they differ, and auxiliary space separately from input space.
- Justify each bound in one or two sentences ("each element is pushed and popped at most once, so O(n)").
- State amortized vs. worst-case explicitly when relevant (dynamic array append, hash map operations).
- Recursive algorithms: give the recurrence and how it resolves; count recursion stack in space.
- Never guess. If a bound depends on an assumption (uniform hashing, balanced tree), state the assumption.

## Dry runs

- Input small enough to fit on screen but large enough to exercise the interesting branches (typically 5–8 elements).
- Show state after every meaningful step: a table (`step | variables | structure state | action`) or ASCII snapshots.
- Pick inputs that hit at least one edge case (duplicate, boundary, early exit).

## Visualizations

The app (Phase 3+) can host interactive visualizers referenced by the topic's `visualizer` metadata id.

- Propose a visualizer only when interaction teaches something static images cannot (stepping through pointer changes, comparing swaps, tree rotations).
- When proposing one, write a short spec: visualizer id (kebab-case), what is shown, controls (step / play / reset / custom input), what each step highlights.
- Content must be fully understandable without the visualizer — it is an enhancement, not a dependency.
- Implementation rules (vanilla JS module under `js/visualizers/`, keyboard operable, reduced-motion aware) follow the `ui-ux` skill and `docs/architecture.md`.

## Interview angle

For each topic include, where relevant:

- The classic interview problems that use it (as practice or coding interview questions — with Java solutions and complexity).
- "Signals" in a problem statement that point to this structure/technique.
- Trade-off questions ("array vs. linked list for X?") with crisp answers.
- Brute force → optimised progression for coding questions: state the brute force and its cost, then the improvement and why it works.
