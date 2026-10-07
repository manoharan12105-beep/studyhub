# Case Study: Design a Video Streaming Platform — Practice

### P1. Storage per hour

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** bitrate to storage

How much storage does one hour of video at 5 Mbps take?

<details>
<summary>Answer</summary>

5,000,000 bits/s × 3,600 s = 18 × 10⁹ bits ÷ 8 = **2.25 GB**.

</details>

### P2. Segment count

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** segmentation

A 20-minute video is cut into 6-second segments, in 5 renditions. How many segment files are produced?

<details>
<summary>Answer</summary>

20 × 60 ÷ 6 = 200 segments per rendition × 5 = **1,000 segment files** (plus manifests).

</details>

### P3. Which rendition?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** adaptive bitrate

Renditions: 1080p 5 Mbps, 720p 3 Mbps, 480p 1.5 Mbps. Measured throughput is 4 Mbps and the buffer is healthy. Which rendition should the player pick next, and why not 1080p?

<details>
<summary>Answer</summary>

**720p (3 Mbps)**: it fits within 4 Mbps with headroom. 1080p needs 5 Mbps, more than the available throughput, so segments would download slower than real time and the buffer would drain, leading to a stall.

</details>

### P4. Delivery protocol

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** HLS/DASH

Which statement is correct for on-demand playback to viewers?

- A) Videos are delivered to viewers over RTMP
- B) Segments are delivered over HTTP using HLS or MPEG-DASH, cacheable by CDNs
- C) Whole files must be downloaded before playback
- D) Each viewer needs a dedicated TCP stream from the origin

<details>
<summary>Answer</summary>

**Answer:** B) Segments are delivered over HTTP using HLS or MPEG-DASH, cacheable by CDNs

</details>

### P5. Egress estimate

**Difficulty:** Hard · **Type:** Estimation · **Concepts:** bandwidth

1 million people watch a live match at an average 4 Mbps. What is the total egress? Why must most of it come from CDN edges?

<details>
<summary>Answer</summary>

1,000,000 × 4 Mbps = **4 Tbps**. No single origin can serve that; CDN edges near viewers serve cached segments so the origin sends each segment only once per edge (or per shield), and viewers get lower latency.

</details>
