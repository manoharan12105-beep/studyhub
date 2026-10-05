# How Switches Work — Practice

### P1. Learning field

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** MAC learning

Which field does a switch use to **learn** where a device is?

- A) Destination MAC
- B) Source MAC
- C) Destination IP
- D) EtherType

<details>
<summary>Answer</summary>

**Answer:** B) Source MAC

</details>

### P2. Trace the table

**Difficulty:** Medium · **Type:** Packet flow · **Concepts:** learn, forward, flood

Empty switch; A on port 1, B on port 2, C on port 3. Frames in order: (1) A → B, (2) B → A, (3) C → broadcast, (4) A → C. For each, give the action and the table afterwards.

<details>
<summary>Answer</summary>

1. Learn A:1. B unknown → **flood** to 2, 3. Table {A:1}.
2. Learn B:2. A known → **forward** to 1. Table {A:1, B:2}.
3. Learn C:3. Broadcast → **flood** to 1, 2. Table {A:1, B:2, C:3}.
4. C known → **forward** to 3. Table unchanged.

</details>

### P3. Filtering

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** filtering

Port 5 of a switch connects to an old hub with PCs X and Y. X sends a frame to Y, and both are already in the switch's table on port 5. What does the switch do?

<details>
<summary>Answer</summary>

It **filters** (drops) the frame: the destination is on the same port it came in on, so Y already received it through the hub.

</details>

### P4. Moved laptop

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** ageing, relearning

A laptop is unplugged from port 3 and plugged into port 7. The table still says port 3. What happens to frames sent to it, and how is the table fixed?

<details>
<summary>Answer</summary>

Frames to it are forwarded to port 3 and lost until the laptop sends any frame from port 7 — the switch then updates the entry to port 7 immediately. If it stays silent, the old entry ages out (≈ 300 s) and frames to it are flooded, reaching port 7.

</details>
