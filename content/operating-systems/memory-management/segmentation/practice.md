# Segmentation — Practice

### P1. Segment table contents

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** segment table

Each segment-table entry contains:

- A) Frame number only
- B) Base and limit
- C) Page number and offset
- D) Process ID and priority

<details>
<summary>Answer</summary>

**Answer:** B) Base and limit

</details>

### P2. Fragmentation type

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** fragmentation

Pure segmentation suffers mainly from:

- A) Internal fragmentation
- B) External fragmentation
- C) Thrashing
- D) Belady's anomaly

<details>
<summary>Answer</summary>

**Answer:** B) External fragmentation

</details>

### P3. Translate

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** segment translation

| Segment | Base | Limit |
|---------|------|-------|
| 0 | 1200 | 500 |
| 1 | 4000 | 250 |
| 2 | 2600 | 900 |

Translate ⟨0, 430⟩, ⟨1, 250⟩, ⟨2, 899⟩ and ⟨3, 10⟩.

<details>
<summary>Answer</summary>

- ⟨0, 430⟩: 430 < 500 → **1630**.
- ⟨1, 250⟩: 250 is not < 250 → **trap** (valid offsets are 0–249).
- ⟨2, 899⟩: 899 < 900 → **3499**.
- ⟨3, 10⟩: segment 3 does not exist → **trap**.

</details>

### P4. Paging or segmentation?

**Difficulty:** Medium · **Type:** Comparison · **Concepts:** paging vs segmentation

For each property, say whether it belongs to paging, segmentation or both: (a) units visible to the programmer; (b) internal fragmentation; (c) needs a translation table per process; (d) units of equal size.

<details>
<summary>Answer</summary>

(a) **Segmentation.** (b) **Paging.** (c) **Both** (page table / segment table). (d) **Paging.**

</details>
