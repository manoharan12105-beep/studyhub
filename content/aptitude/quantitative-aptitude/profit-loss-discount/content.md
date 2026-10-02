# Profit, Loss and Discount

## Concept

Every trade has a **cost price** (what the seller paid) and a **selling price** (what the buyer pays). If the selling price is higher, the seller makes a **profit**; if lower, a **loss**. A shop also displays a **marked price** (label price) and may offer a **discount** on it.

Two rules decide almost every question:

1. **Profit and loss percentages are calculated on the cost price.**
2. **Discount percentages are calculated on the marked price.**

The rest is the percentage toolkit from [Percentages](../percentages/content.md): multiplying factors, reverse percentages and successive changes.

```text
CP ──(mark up)──▶ MP ──(discount)──▶ SP
         profit or loss = SP − CP
```

## Key Terms

| Term | Meaning |
|------|---------|
| Cost Price (CP) | Price at which the seller bought (or made) the item |
| Selling Price (SP) | Price at which the item is sold |
| Marked Price (MP) | Printed/list price before any discount |
| Discount | MP − SP; a reduction on the marked price |
| Markup | MP − CP; how much above cost the price is marked |
| Overheads | Extra costs (transport, repairs) — added to CP |

## Formulas

### Profit and loss percentage

```text
Profit = SP − CP          Profit % = Profit / CP × 100
Loss   = CP − SP          Loss %   = Loss / CP × 100
```

- **Meaning:** gain or loss as a fraction of what the seller invested.
- **Use when:** CP and SP are known.
- **Example:** CP ₹400, SP ₹460 → profit ₹60 → 60/400 × 100 = 15%.
- **Common mistake:** dividing by SP.

### SP from CP, and CP from SP

```text
SP = CP × (100 + Profit%) / 100        SP = CP × (100 − Loss%) / 100
CP = SP × 100 / (100 + Profit%)        CP = SP × 100 / (100 − Loss%)
```

- **Meaning:** profit% and loss% are multiplying factors on CP.
- **Use when:** one price and the percentage are given.
- **Example:** sold at a 20% loss for ₹640 → CP = 640 × 100/80 = ₹800.
- **Common mistake:** finding CP as SP − 20% of SP (= ₹512). The 20% is of CP, not SP.

### Discount

```text
Discount = MP − SP         Discount % = Discount / MP × 100
SP = MP × (100 − Discount%) / 100
```

- **Meaning:** reduction measured against the marked price.
- **Example:** MP ₹800 with 15% discount → SP = 800 × 0.85 = ₹680.
- **Common mistake:** taking discount% on CP.

### Linking CP, MP and SP

```text
MP / CP = (100 + Profit%) / (100 − Discount%)
```

- **Meaning:** how far above cost to mark the price so that, after the discount, the target profit remains.
- **Why it works:** SP = CP × (100 + P)/100 and SP = MP × (100 − d)/100. Set them equal and divide.
- **Example:** for 20% profit after a 10% discount, MP/CP = 120/90 = 4/3 → mark up by 33.33%.
- **Common mistake:** marking up by 20 + 10 = 30%.

### Successive discounts

```text
Single equivalent discount = d₁ + d₂ − (d₁ × d₂)/100
```

- **Meaning:** a discount of d₁% followed by d₂% on the reduced price.
- **Why it works:** it is the successive-change formula a + b + ab/100 with a = −d₁ and b = −d₂.
- **Example:** 20% and 10% → 20 + 10 − 2 = 28% (not 30%).
- **Common mistake:** adding the discounts.

### Same selling price, equal gain and loss

```text
Two items sold at the same SP, one at x% profit and the other at x% loss
→ always a net LOSS of  x²/100 %
```

- **Why it works:** the item sold at a loss had the higher CP (SP = 0.9 CP₂ means CP₂ is larger), so the loss is on the bigger base.
- **Example:** x = 10 → loss of 1%.
- **Common mistake:** concluding "no profit, no loss".
- **Only applies when** the two selling prices are equal and the percentages are equal.

### Dishonest dealer (false weights)

```text
Gain % = (True weight − False weight) / False weight × 100
```

- **Meaning:** the dealer charges for the true weight but gives less; his cost is only for what he gives.
- **Example:** gives 900 g for 1 kg at cost price → gain = 100/900 × 100 = 11.11%.
- **Common mistake:** dividing by the true weight (gives 10%).

### Buy x, get y free

```text
Effective discount % = y / (x + y) × 100
```

- **Example:** buy 3 get 1 free → pays for 3, gets 4 → 1/4 = 25% discount.
- **Common mistake:** y/x (= 33.33%).

## Shortcuts and Tricks

### Multiply the factors

- **Normal method:** compute MP, then the discount, then SP, then profit.
- **Why the shortcut works:** every step is a multiplication by (1 ± r/100), and multiplication can be chained.
- **Shortcut:** final/initial = product of factors.
- **Demonstration:** MP 25% above CP, then 12% discount → 1.25 × 0.88 = 1.10 → 10% profit.
- **Useful when:** markups, discounts and multiple sales are chained (A sells to B to C).
- **Unsafe or unnecessary when:** absolute amounts (overheads, fixed deductions) are added — those are not percentage factors.

### "CP of x articles = SP of y articles"

- **Normal method:** let each CP be 1, compute total CP and SP.
- **Why the shortcut works:** with x·CP = y·SP, SP/CP = x/y. The profit on each article is (x − y)/y of its CP.
- **Shortcut:** Profit % = (x − y)/y × 100 (a negative value is a loss).
- **Demonstration:** CP of 20 = SP of 16 → (20 − 16)/16 = 25% profit.
- **Useful when:** the question equates numbers of articles.
- **Unsafe or unnecessary when:** the statement is reversed ("SP of x = CP of y"); derive it from SP/CP rather than plugging in.

## Problem Patterns

### Pattern 1: Find the price for a new profit target

**Recognise it:** "Selling at ₹A gives r₁% profit. At what price should it be sold to gain r₂%?"

**Approach:** find CP = A × 100/(100 + r₁), then SP = CP × (100 + r₂)/100. Or directly SP₂ = A × (100 + r₂)/(100 + r₁).

**Example:** ₹720 gives 20% profit → CP = 600 → for 30%, SP = ₹780.

### Pattern 2: Markup and discount

**Recognise it:** MP is set some percent above CP, then a discount is offered.

**Approach:** profit factor = (1 + markup/100)(1 − discount/100).

**Example:** markup 40%, discount 25% → 1.4 × 0.75 = 1.05 → 5% profit.

### Pattern 3: Chain of sales

**Recognise it:** A sells to B at r₁%, B sells to C at r₂%, and C's price is given.

**Approach:** A's CP = final price ÷ (product of factors).

**Example:** C pays ₹2,640 after 10% and 20% profits → A's CP = 2640/(1.1 × 1.2) = ₹2,000.

### Pattern 4: Equal profit and loss at two prices

**Recognise it:** "The loss at ₹a equals the profit at ₹b."

**Approach:** CP − a = b − CP → CP = (a + b)/2.

**Example:** loss at ₹1,920 equals profit at ₹2,080 → CP = ₹2,000.

### Pattern 5: Buying and selling at different rates per article

**Recognise it:** "Buys 12 for ₹10 and sells 10 for ₹12."

**Approach:** compute CP and SP per article (or for an LCM quantity) and compare.

**Example:** CP per article = 10/12, SP per article = 12/10 → SP/CP = 1.2 × 1.2 = 1.44 → 44% profit.

## Common Mistakes

- Calculating profit% or loss% on SP instead of CP.
- Calculating discount on CP instead of MP.
- Adding successive discounts.
- Assuming equal profit% and loss% on equal SPs cancel out.
- Forgetting overheads (repairs, transport) must be added to CP.
- In false-weight questions, dividing by the true weight.

## Placement Tips

- Take CP = 100 when no actual prices are given; percentages become direct numbers.
- Write the chain CP → MP → SP and attach a factor to each arrow.
- Look for the "same SP, x% gain and x% loss" pattern — the answer is x²/100 % loss without any calculation.
- When options are close, compute exactly; profit questions often include the "added percentages" trap as an option.

## Key Takeaways

- Profit/loss% is on CP; discount% is on MP.
- SP = CP × (100 ± r)/100; CP = SP × 100/(100 ± r).
- MP/CP = (100 + profit%)/(100 − discount%).
- Successive discounts: d₁ + d₂ − d₁d₂/100.
- Same SP with x% gain and x% loss → x²/100 % loss.
- False weight gain% = (true − false)/false × 100.
