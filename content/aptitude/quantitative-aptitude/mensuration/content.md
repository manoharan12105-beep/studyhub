# Mensuration

## Concept

Mensuration is the measurement of shapes: **perimeter** (length of the boundary), **area** (space covered by a flat shape) and, for solids, **surface area** (total area of all faces) and **volume** (space occupied).

Most questions apply a formula directly, but the harder ones test whether you can:

- pick the right formula for a combined shape (a path around a garden, a cone on a hemisphere);
- use conservation of volume (melting one solid into another);
- reason about scaling (if every length doubles, area ×4 and volume ×8).

**Units:** areas are in square units (cm²), volumes in cubic units (cm³). 1 m = 100 cm → 1 m² = 10,000 cm² and 1 m³ = 1,000,000 cm³. 1 litre = 1,000 cm³; 1 m³ = 1,000 litres.

Unless stated otherwise, use **π = 22/7**; choose radii that are multiples of 7 to cancel it.

Angle and side properties of shapes are in [Geometry](../geometry/content.md).

## 2D

### Rectangle and square

| Shape | Area | Perimeter | Diagonal |
|-------|------|-----------|----------|
| Rectangle (l × b) | l × b | 2(l + b) | √(l² + b²) |
| Square (side a) | a² = d²/2 | 4a | a√2 |

**Example:** 12 × 5 rectangle → area 60, perimeter 34, diagonal 13.

### Triangles

```text
Area = ½ × base × height
Heron's formula: Area = √[s(s − a)(s − b)(s − c)],   s = (a + b + c)/2
Equilateral (side a): Area = (√3/4) a²,  height = (√3/2) a
```

- **Use Heron's formula when:** all three sides are known but no height.
- **Example:** sides 13, 14, 15 → s = 21 → √(21 × 8 × 7 × 6) = √7056 = 84.
- **Common mistake:** using a side that is not perpendicular to the base as the height.

### Quadrilaterals

| Shape | Area |
|-------|------|
| Parallelogram | base × perpendicular height |
| Rhombus | ½ × d₁ × d₂ (side = √[(d₁/2)² + (d₂/2)²]) |
| Trapezium | ½ × (sum of parallel sides) × height |

**Example:** rhombus with diagonals 24 and 10 → area 120, side √(144 + 25) = 13.

### Circles and parts of circles

```text
Circle:     Area = πr²            Circumference = 2πr
Semicircle: Area = πr²/2          Perimeter = πr + 2r
Sector (angle θ):  Area = (θ/360) × πr²     Arc length = (θ/360) × 2πr
Ring (radii R > r): Area = π(R² − r²)
```

- **Example:** a sector of 90° in a circle of radius 14 → ¼ × 616 = 154.
- **Common mistake:** forgetting the 2r (the diameter) in a semicircle's perimeter.

### Pattern: paths around or inside a field

**Recognise it:** "a path of width w runs around (outside/inside) a rectangular field".

**Approach:** area of path = outer rectangle − inner rectangle. Outside: outer = (l + 2w)(b + 2w). Inside: inner = (l − 2w)(b − 2w).

**Example:** 2 m path outside a 30 × 20 m garden → 34 × 24 − 30 × 20 = 816 − 600 = 216 m².

### Pattern: wheels and revolutions

**Recognise it:** "how many revolutions does a wheel make to cover …?"

**Approach:** one revolution covers one circumference. Revolutions = distance ÷ 2πr.

**Example:** radius 35 cm → circumference 220 cm = 2.2 m → 2.2 km needs 1,000 revolutions.

### Pattern: percentage change in area

**Recognise it:** sides change by percentages; find the change in area.

**Approach:** area is a product of two lengths → successive percentage change a + b + ab/100.

**Example:** both sides +20% → 20 + 20 + 4 = 44% increase. Length +10% and breadth −10% → −1%.

## 3D

### Cube and cuboid

| Solid | Volume | Total surface area | Diagonal |
|-------|--------|--------------------|----------|
| Cuboid (l, b, h) | lbh | 2(lb + bh + hl) | √(l² + b² + h²) |
| Cube (edge a) | a³ | 6a² | a√3 |

Lateral surface area (four walls): cuboid 2h(l + b); cube 4a².

**Example:** cube of edge 5 → volume 125, surface area 150. Cuboid 12 × 4 × 3 → diagonal √(144 + 16 + 9) = 13.

### Cylinder, cone and sphere

| Solid | Curved surface area | Total surface area | Volume |
|-------|---------------------|--------------------|--------|
| Cylinder (r, h) | 2πrh | 2πr(r + h) | πr²h |
| Cone (r, h, slant l) | πrl | πr(l + r) | ⅓πr²h |
| Sphere (r) | 4πr² | 4πr² | (4/3)πr³ |
| Hemisphere (r) | 2πr² | 3πr² | (2/3)πr³ |

Slant height of a cone: **l = √(r² + h²)**.

- **Example (cylinder):** r = 7, h = 10 → volume = 22/7 × 49 × 10 = 1,540; curved surface = 2 × 22/7 × 7 × 10 = 440.
- **Example (cone):** r = 6, h = 8 → l = 10; curved surface = 60π; volume = 96π.
- **Common mistake:** using h instead of l for a cone's surface area; forgetting the flat circle in a hemisphere's total surface (3πr², not 2πr²).

**Relations worth remembering:** a cone has ⅓ the volume of a cylinder with the same base and height; a hemisphere has ⅔ of that cylinder's volume when h = r.

### Frustum of a cone

```text
Volume = (πh/3)(R² + r² + Rr)
```

where R and r are the radii of the two circular ends and h is the height. Used for buckets and lampshades.

### Pattern: melting and recasting

**Recognise it:** one solid is melted and recast into others.

**Approach:** volume is conserved. Volume of original = (number of new solids) × (volume of each).

**Example:** a sphere of radius 6 is recast into a cylinder of radius 4 → 288π = 16πh → h = 18.

### Pattern: scaling

**Recognise it:** every dimension is multiplied by k.

**Approach:** lengths × k, areas × k², volumes × k³. If dimensions change differently, multiply the factors (radius × 2, height × ½ → cylinder volume × 4 × ½ = 2).

### Pattern: flow through a pipe

**Recognise it:** water flows through a pipe at some speed.

**Approach:** volume per second = cross-section area × speed.

**Example:** radius 7 cm, speed 5 m/s → π × 0.07² × 5 = 0.077 m³/s = 77 litres per second.

## Common Mistakes

- Mixing units (cm with m) inside one formula.
- Using diameter where radius is needed.
- Confusing curved and total surface area.
- Using the slant height in a volume formula, or the vertical height in a cone's surface area.
- Adding percentage changes in area instead of compounding them.

## Placement Tips

- Write the formula before substituting; most errors are wrong formulas, not wrong arithmetic.
- With π = 22/7, look for radii that are multiples of 7 — the answer is usually a whole number.
- For ratio questions (two cylinders, scaled solids), cancel π and common factors before multiplying.

## Key Takeaways

- 2D: rectangle lb; triangle ½bh or Heron; equilateral (√3/4)a²; rhombus ½d₁d₂; trapezium ½(a + b)h; circle πr², 2πr; sector (θ/360)πr².
- 3D: cuboid lbh; cube a³; cylinder πr²h; cone ⅓πr²h with l = √(r² + h²); sphere (4/3)πr³, 4πr²; hemisphere TSA 3πr².
- Melting conserves volume; scaling by k → area k², volume k³.
