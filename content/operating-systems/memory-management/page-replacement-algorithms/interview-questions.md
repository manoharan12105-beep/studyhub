# Page Replacement: FIFO, LRU and Optimal — Interview Questions

## Beginner

### Q1. What is page replacement, and when is it needed?

**Style:** Direct

<details>
<summary>Answer</summary>

When a page fault occurs and every frame is occupied, the OS must evict a resident page (the victim) to load the requested one. A page-replacement algorithm chooses the victim, aiming to minimise future page faults. If the victim is dirty, it is written back to disk first.

</details>

### Q2. Explain FIFO, LRU and Optimal page replacement.

**Style:** Direct

<details>
<summary>Answer</summary>

**FIFO** evicts the page that has been in memory the longest. **LRU** evicts the page that has not been used for the longest time. **Optimal** evicts the page that will not be used for the longest time in the future (or never again). Optimal gives the fewest faults but needs future knowledge; LRU approximates it using the past; FIFO is simplest.

</details>

### Q3. What is Belady's anomaly?

**Style:** Direct

<details>
<summary>Answer</summary>

The counter-intuitive situation where giving a process **more** frames causes **more** page faults. It occurs with FIFO: for the reference string 1 2 3 4 1 2 5 1 2 3 4 5, FIFO causes 9 faults with 3 frames but 10 with 4. LRU and Optimal never show it.

</details>

## Intermediate

### Q4. Why can't Optimal page replacement be implemented, and why is it still useful?

**Style:** Why

<details>
<summary>Answer</summary>

It needs to know the future reference string — which page will be used when — and an OS cannot know that in general. It is still useful as a **benchmark**: it gives the minimum achievable number of faults for a given trace and number of frames, so other algorithms are judged by how close they come.

</details>

### Q5. Why don't LRU and Optimal suffer from Belady's anomaly?

**Style:** Why

<details>
<summary>Answer</summary>

They are **stack algorithms**: for any reference string, the set of pages in memory with n frames is always a subset of the set with n + 1 frames (the n + 1 most recently used pages include the n most recently used). So any reference that hits with n frames also hits with n + 1, and faults can never increase when frames are added. FIFO lacks this inclusion property.

</details>

### Q6. Reference string `3 1 4 1 5 3 1 4 2 3` with 3 frames. How many page faults under FIFO, LRU and Optimal?

**Style:** Calculation

<details>
<summary>Answer</summary>

- **FIFO: 9.** Only the second reference to 1 hits; every other reference faults (victims 3, 1, 4, 5, 3, 1).
- **LRU: 8.** Hits: 1 (4th), 1 (7th). At 5, evict 3; at 3, evict 4; at 4, evict 5; at 2, evict 3; at 3, evict 1.
- **Optimal: 6.** At 5, evict 4 (used farthest); 3 and 1 hit; at 4, evict 1 (never used again); at 2, evict 5 (never used again); 3 hits.

</details>

### Q7. How is LRU implemented in real operating systems?

**Style:** How

<details>
<summary>Answer</summary>

Exact LRU would need a timestamp update or list reordering on every memory access, which hardware cannot afford. OSes approximate it with a hardware **reference bit** per page, set on access. The **second-chance (clock)** algorithm scans pages in circular FIFO order; a page with reference bit 1 has the bit cleared and is skipped (second chance), and the first page found with bit 0 is evicted. Enhanced versions also consider the dirty bit, preferring clean, unreferenced pages.

</details>

### Q8. Is LRU always better than FIFO?

**Style:** Trap

<details>
<summary>Answer</summary>

No. LRU is better on typical workloads with locality, but some reference strings favour FIFO. For `1 2 3 2 4 1 3 2 4 1` with 3 frames, FIFO causes 6 faults and LRU 9. Only Optimal is guaranteed to be at least as good as every other algorithm.

</details>

## Advanced

### Q9. Why prefer evicting a clean page over a dirty one?

**Style:** Trade-off

<details>
<summary>Answer</summary>

A clean page has an identical copy on disk, so it can be overwritten immediately: one disk transfer (reading the new page). A dirty page must first be written back — two transfers, roughly doubling the fault service time. The enhanced clock algorithm therefore prefers (not referenced, clean) pages, then (not referenced, dirty), and so on.

</details>

### Q10. A loop repeatedly scans an array of 5 pages, but the process has only 4 frames. What happens under LRU?

**Style:** Scenario

<details>
<summary>Answer</summary>

Every reference faults. With the cyclic pattern 1 2 3 4 5 1 2 3 4 5 …, the page LRU evicts is always the one needed next (when 5 arrives it evicts 1, which is referenced immediately after, and so on). This is LRU's worst case; MRU or a policy that keeps part of the loop resident would do much better, and giving the process a fifth frame removes the faults entirely.

</details>
