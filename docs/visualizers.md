# Visualizer Registry

Interactive visualizations that topics are **candidates** for. A topic opts in by setting its metadata `visualizer` to one of these ids. Nothing here is implemented yet; the app (Phase 3+) shows a visualizer only once `js/visualizers/<id>.js` exists.

Rules for every visualizer (see also `.claude/skills/ui-ux/SKILL.md`):

- The topic must be fully understandable without it — it is an enhancement.
- Controls: Step · Play/Pause · Reset, plus custom input where listed. Keyboard operable.
- A text description of the current step is always visible (screen readers, reduced motion).
- Several topics may share one id.

## Aptitude

| Id | Topics | What it shows | Custom input |
|----|--------|---------------|--------------|
| `unit-digit-cycles` | number-system | The repeating cycle of last digits of aⁿ for a chosen base, highlighting which position n lands on (n mod cycle length, with 0 → last position). | base, exponent |
| `percentage-bar-model` | percentages | A bar for the base value; increases/decreases drawn as segments, successive changes applied to the *new* bar so the "base changes" idea is visible. | base, changes |
| `ratio-bar-model` | ratio-and-proportion | Equal-sized unit blocks split between parties; dividing a total by ratio and how ratios change when quantities are added. | ratio, total |
| `alligation-cross` | mixtures-and-alligation | The alligation cross: two component values, the mean, and the differences that give the mixing ratio, with a slider for the mean. | two values, mean |
| `interest-growth-chart` | simple-interest, compound-interest | Year-by-year bars of simple vs. compound interest on the same principal, showing interest-on-interest growing. | P, R, T, compounding |
| `work-units-timeline` | time-and-work | Total work as LCM units; each worker/pipe as a per-day rate filling (or emptying) the tank day by day. | workers' days, leaves/joins |
| `relative-motion-track` | time-speed-distance | Two objects on a track: same/opposite directions, trains crossing poles/platforms/each other, boats with stream speed, race head starts. | speeds, lengths, direction |
| `arrangement-builder` | permutation-and-combination | Filling slots one by one, showing choices per slot (multiplication principle), and how order-not-mattering divides by r!. | n, r, constraints |
| `sample-space-explorer` | probability | Full sample space for coins/dice/cards as a grid, highlighting favourable outcomes for a chosen event. | experiment, event |
| `di-chart-explorer` | data-interpretation | One dataset shown as table / bar / line / pie; selecting values shows the percentage-change and share calculations. | dataset |
| `family-tree-builder` | blood-relations | Builds the family tree from statements one at a time using the standard symbols (gender, generation levels). | statements |
| `direction-tracer` | direction-sense | Draws the path on a grid step by step, then shows the straight-line distance and final direction from the start. | moves |
| `seating-arrangement-builder` | seating-arrangement | Linear and circular seats filled clue by clue, with left/right resolved relative to facing direction. | clues |
| `puzzle-elimination-grid` | puzzles | Elimination grid (people × attributes) where each clue ticks or crosses cells. | clues |
| `venn-builder` | syllogisms, logical-venn-diagrams | Draws the minimal diagrams for statements and tests each conclusion against all possible diagrams. | statements |
| `clock-angle` | clocks | An analogue clock; hands move with time and the angle between them is shown with the 30H − 5.5M calculation. | time |
