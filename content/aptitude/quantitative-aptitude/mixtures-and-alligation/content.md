# Mixtures and Alligation

## Concept

When two ingredients with different values (price, concentration, profit percentage, average) are mixed, the mixture's value lies **between** them. Where exactly it lies depends on how much of each ingredient is used: more of the cheaper one pulls the mean down.

**Alligation** is a quick rule for the reverse question: given the two values and the desired mean, in what **ratio** must they be mixed?

The idea behind it is balance. Every unit of the cheaper ingredient is below the mean by (m − c); every unit of the dearer one is above it by (d − m). For the mixture to average exactly m, the total "shortfall" must equal the total "excess":

```text
Quantity of cheaper × (m − c) = Quantity of dearer × (d − m)
```

Rearranging gives the alligation rule. It is really a [weighted average](../averages/content.md) solved backwards.

## Key Terms

| Term | Meaning |
|------|---------|
| Cheaper value (c) | The lower value — price, % concentration, average, etc. |
| Dearer value (d) | The higher value |
| Mean value (m) | The value of the mixture; c < m < d |
| Concentration | Fraction of a mixture that is one component (e.g. 30% acid) |

## Formulas

### Alligation rule

```text
Cheaper : Dearer = (d − m) : (m − c)
```

- **Meaning:** the ratio in which two ingredients must be mixed to get mean value m.
- **Variables:** c = cheaper value, d = dearer value, m = mean value.
- **Use when:** two ingredients, one mixture, any "value per unit" (price/kg, % purity, average marks, profit %).
- **Example:** rice at ₹40/kg and ₹55/kg to get ₹45/kg → (55 − 45) : (45 − 40) = 10 : 5 = 2 : 1.
- **Common mistake:** pairing the differences wrongly. The **cheaper** ingredient gets the **dearer** difference (d − m) — the farther you are from the mean, the less you need.

The cross diagram:

```text
   c               d
      \         /
          m
      /         \
 (d − m)       (m − c)
 cheaper       dearer
```

### Mean value of a mixture (weighted average)

```text
m = (q₁c + q₂d) / (q₁ + q₂)
```

- **Meaning:** the value of the mixture when quantities q₁ and q₂ are mixed.
- **Example:** 2 kg at ₹40 and 1 kg at ₹55 → (80 + 55)/3 = ₹45.

### Repeated removal and replacement

```text
Pure liquid left = x × (1 − y/x)ⁿ
```

- **Meaning:** a container holds x litres of pure liquid; y litres are removed and replaced with water, n times.
- **Why it works:** each operation keeps the fraction (x − y)/x of whatever pure liquid is present, like repeated depreciation.
- **Example:** 40 L of milk, 4 L replaced with water 3 times → 40 × (0.9)³ = 29.16 L of milk.
- **Common mistake:** subtracting y each time (40 − 12 = 28). Later removals take out a mixture, not pure milk.

## Solving Approach

1. Identify the **value per unit** being mixed (₹/kg, % of milk, average).
2. Express both ingredients and the mixture in that same unit — for mixtures of mixtures, use the fraction of one component (e.g. milk fraction 3/5).
3. Apply alligation to get the ratio.
4. Scale the ratio to the actual quantities given.

## Shortcuts and Tricks

### Adding water to change a ratio

- **Normal method:** set up an equation with the unknown water.
- **Why the shortcut works:** adding water does not change the amount of milk. Fix the milk and rewrite the target ratio around it.
- **Shortcut:** keep the unchanged component constant; read off the new amount of the other component.
- **Demonstration:** 60 L, milk : water = 2 : 1 → milk 40, water 20. Target 1 : 2 with milk 40 → water 80 → add 60 L.
- **Useful when:** only one component is added or removed.
- **Unsafe or unnecessary when:** mixture is removed and replaced — both components change; use the replacement formula.

### Alligation on percentages (profit and loss)

- **Normal method:** let x kg be sold at one rate and set up an equation for the total profit.
- **Why the shortcut works:** profit percentages are "values per unit of cost", so they average like prices.
- **Shortcut:** alligate the two profit percentages (losses as negative) around the overall percentage.
- **Demonstration:** 60 kg sold partly at 10% profit and partly at 20% loss, overall 5% profit → (5 − (−20)) : (10 − 5) = 25 : 5 = 5 : 1 → 50 kg at 10% profit.
- **Useful when:** parts sold at different profit or interest rates.
- **Unsafe or unnecessary when:** the parts have different cost prices per kg — the weights are then costs, not kilograms.

## Problem Patterns

### Pattern 1: Mixing two varieties

**Recognise it:** two prices and a target price; find the ratio or one quantity.

**Approach:** alligation, then scale.

**Example:** sugar at ₹30 mixed with 30 kg at ₹45 to make ₹40 → 30-rupee : 45-rupee = 5 : 10 = 1 : 2 → 15 kg.

### Pattern 2: Milkman's profit by adding water

**Recognise it:** milk sold at cost price after adding water, with a stated profit.

**Approach:** the mixture's cost price = selling price ÷ (1 + profit). Water costs 0. Alligate 0 and the milk price around that cost.

**Example:** milk ₹50/L, sold at ₹50/L with 25% profit → mixture CP = ₹40/L → milk : water = (40 − 0) : (50 − 40) = 4 : 1.

### Pattern 3: Mixing two mixtures

**Recognise it:** two vessels each containing a ratio (milk : water 3 : 2 and 7 : 3); find the mixing ratio for a target.

**Approach:** convert each to the fraction of one component, then alligate.

**Example:** milk fractions 3/5 and 7/10, target 2/3. (7/10 − 2/3) : (2/3 − 3/5) = 1/30 : 1/15 = 1 : 2.

### Pattern 4: Repeated replacement

**Recognise it:** "removed and replaced with water" done more than once.

**Approach:** use x(1 − y/x)ⁿ. Ratio of milk to water = (milk left) : (x − milk left).

**Example:** one-quarter replaced three times → milk fraction (3/4)³ = 27/64 → milk : water = 27 : 37.

## Common Mistakes

- Swapping the alligation differences (cheaper gets d − m, not m − c).
- Alligating ratios directly (3 : 2 and 7 : 3) instead of fractions (3/5 and 7/10).
- Subtracting removed quantities linearly in repeated replacement.
- Forgetting that water has price 0 and concentration 0% of the other component.

## Placement Tips

- Draw the cross every time — it takes five seconds and prevents swaps.
- The mean must lie between the two values; if it doesn't, recheck the question.
- Alligation also solves averages (boys' and girls' averages), interest at two rates and speed questions — look for "two values and an overall value".

## Key Takeaways

- Cheaper : Dearer = (d − m) : (m − c).
- Express everything in one "value per unit" before alligating; use component fractions for mixtures of mixtures.
- Adding one component: keep the other fixed.
- Repeated replacement: x(1 − y/x)ⁿ of pure liquid remains.
