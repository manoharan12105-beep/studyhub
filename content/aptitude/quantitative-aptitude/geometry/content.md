# Geometry

## Concept

Geometry questions in aptitude tests check whether you know a small set of **properties** of lines, angles, triangles, polygons and circles, and whether you can chain two or three of them together. Very little calculation is involved; the skill is recognising which property applies.

A reliable habit: **draw the figure, mark everything given, then write the angle or side relations you know** — angle sums, equal sides, right angles. The unknown usually appears after one or two steps.

Lengths, areas and volumes of shapes are covered in [Mensuration](../mensuration/content.md); this topic focuses on angles, sides and relationships.

## Rules

### Lines and angles

| Relationship | Rule |
|--------------|------|
| Complementary angles | Sum to 90° |
| Supplementary angles | Sum to 180° |
| Angles on a straight line | Sum to 180° |
| Angles around a point | Sum to 360° |
| Vertically opposite angles | Equal |

**Parallel lines cut by a transversal:**

- Corresponding angles are equal.
- Alternate interior angles are equal.
- Co-interior angles (same side, between the lines) sum to 180°.

### Triangles

| Property | Statement |
|----------|-----------|
| Angle sum | A + B + C = 180° |
| Exterior angle | Exterior angle = sum of the two interior opposite angles |
| Triangle inequality | Sum of any two sides > third side; difference < third side |
| Side–angle order | The largest side is opposite the largest angle |
| Isosceles | Two equal sides ↔ the angles opposite them are equal |
| Equilateral | All sides equal, every angle 60° |

**Why the exterior angle rule works:** the exterior angle and the adjacent interior angle sum to 180°, and so do all three interior angles — so the exterior angle equals the other two interior angles.

### Pythagoras' theorem

```text
In a right triangle with hypotenuse c:  a² + b² = c²
```

- **Meaning:** the square on the longest side (opposite the right angle) equals the sum of the squares on the other two.
- **Example:** legs 9 and 12 → c = √(81 + 144) = √225 = 15.
- **Common mistake:** treating a leg as the hypotenuse.

Common **Pythagorean triplets** (and their multiples): 3-4-5, 5-12-13, 8-15-17, 7-24-25, 20-21-29.

**Testing the type of triangle** with longest side c: a² + b² = c² → right; a² + b² > c² → acute; a² + b² < c² → obtuse.

### Similar and congruent triangles

- **Congruent** triangles are identical in shape and size (tests: SSS, SAS, ASA, AAS, RHS).
- **Similar** triangles have equal angles and proportional sides (tests: AA, SSS-ratio, SAS-ratio).

```text
For similar triangles with side ratio k:
ratio of perimeters, medians, heights = k
ratio of areas = k²
```

- **Example:** sides in the ratio 3 : 5 → areas 9 : 25.
- **Common mistake:** using k instead of k² for areas.

### Special lines in a triangle

| Point | Formed by | Key fact |
|-------|-----------|----------|
| Centroid | Medians | Divides each median in the ratio 2 : 1 from the vertex |
| Incentre | Angle bisectors | Centre of the inscribed circle |
| Circumcentre | Perpendicular bisectors of sides | Centre of the circumscribed circle; for a right triangle it is the midpoint of the hypotenuse |
| Orthocentre | Altitudes | For a right triangle it is the right-angle vertex |

**Mid-point theorem:** the segment joining the midpoints of two sides is parallel to the third side and half its length.

**Angle bisector theorem:** the bisector of angle A divides BC in the ratio AB : AC.

### Polygons

```text
Sum of interior angles of an n-sided polygon = (n − 2) × 180°
Each exterior angle of a regular polygon      = 360° / n
Each interior angle of a regular polygon      = 180° − 360°/n
Number of diagonals                            = n(n − 3)/2
```

- **Why the first works:** diagonals from one vertex split the polygon into n − 2 triangles.
- **Example:** regular hexagon → each exterior angle 60°, interior 120°.
- **Example:** each exterior angle 24° → n = 360/24 = 15 sides.
- **Common mistake:** using 360/n for the interior angle.

### Quadrilaterals

| Shape | Sides | Diagonals |
|-------|-------|-----------|
| Parallelogram | Opposite sides equal and parallel; opposite angles equal | Bisect each other |
| Rectangle | Parallelogram with all angles 90° | Equal, bisect each other |
| Rhombus | All sides equal | Bisect each other at right angles |
| Square | All sides equal, all angles 90° | Equal, bisect at right angles |
| Trapezium | One pair of parallel sides | — |

**Example:** a rhombus with diagonals 16 and 12 has side √(8² + 6²) = 10, because the diagonals bisect each other at right angles.

### Circles

| Property | Statement |
|----------|-----------|
| Angle at the centre | Twice the angle at the circumference on the same arc |
| Angle in a semicircle | 90° |
| Angles in the same segment | Equal |
| Cyclic quadrilateral | Opposite angles sum to 180° |
| Tangent and radius | Perpendicular at the point of contact |
| Two tangents from an external point | Equal in length |
| Perpendicular from the centre to a chord | Bisects the chord |

```text
Tangent length from a point at distance d from the centre:  √(d² − r²)
Half-chord at distance p from the centre:                   √(r² − p²)
```

- **Example:** a point 13 cm from the centre of a circle of radius 5 cm → tangent = √(169 − 25) = 12 cm.
- **Example:** radius 13, chord 5 from the centre → half-chord 12 → chord 24.

**Two tangents from P touching at A and B (centre O):** ∠APB + ∠AOB = 180°, because ∠OAP = ∠OBP = 90° in quadrilateral OAPB.

### Coordinate geometry basics

```text
Distance between (x₁, y₁) and (x₂, y₂) = √[(x₂ − x₁)² + (y₂ − y₁)²]
Midpoint = ((x₁ + x₂)/2, (y₁ + y₂)/2)
Slope    = (y₂ − y₁)/(x₂ − x₁)
Area of triangle = ½ |x₁(y₂ − y₃) + x₂(y₃ − y₁) + x₃(y₁ − y₂)|
```

- **Example:** (1, 2) to (4, 6) → √(9 + 16) = 5.
- Three points are **collinear** when the triangle area is 0 (equivalently, equal slopes).
- Parallel lines have equal slopes; perpendicular lines have slopes whose product is −1.

## Problem Patterns

### Pattern 1: Angles in a ratio

**Recognise it:** "The angles of a triangle are in the ratio 2 : 3 : 4."

**Approach:** total parts share 180° (or (n − 2) × 180° for a polygon).

**Example:** 9 parts = 180° → 20° each → 40°, 60°, 80°.

### Pattern 2: Possible side lengths

**Recognise it:** "Two sides are 4 and 7. How many integer values can the third side take?"

**Approach:** difference < x < sum → 3 < x < 11 → 4 to 10 → 7 values.

### Pattern 3: Regular polygon from an angle

**Recognise it:** an interior or exterior angle is given; find the number of sides.

**Approach:** exterior = 180° − interior; n = 360 / exterior.

**Example:** interior 140° → exterior 40° → 9 sides.

### Pattern 4: Circle angle chasing

**Recognise it:** a figure with a circle, chords and given angles.

**Approach:** apply centre = 2 × circumference, semicircle = 90°, cyclic opposite angles = 180°.

**Example:** angle at the centre 110° → angle at the circumference on the same arc 55°.

## Common Mistakes

- Using the wrong pair of angles with parallel lines (co-interior angles sum to 180°, they are not equal).
- Forgetting the triangle inequality when checking possible sides.
- Applying the side ratio, not its square, to areas of similar triangles.
- Using 360/n as the interior angle of a regular polygon.
- Assuming a figure is drawn to scale — rely only on given information.

## Placement Tips

- Learn the Pythagorean triplets — they turn root calculations into recognition.
- Mark right angles wherever a tangent meets a radius or a triangle stands on a diameter.
- When options are angles, check that your answer keeps every triangle's sum at 180°.

## Key Takeaways

- Triangle angles sum to 180°; exterior angle = sum of interior opposite angles; any two sides > third.
- a² + b² = c² in right triangles; learn 3-4-5, 5-12-13, 8-15-17, 7-24-25.
- Similar triangles: areas in the ratio of squares of sides.
- Polygon interior sum (n − 2) × 180°; regular exterior angle 360/n; diagonals n(n − 3)/2.
- Circles: centre angle = 2 × circumference angle; semicircle 90°; cyclic opposite angles 180°; tangent ⟂ radius.
