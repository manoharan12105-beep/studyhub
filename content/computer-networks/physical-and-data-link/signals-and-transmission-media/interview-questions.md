# Bits, Signals and Transmission Media — Interview Questions

## Beginner

### Q1. Compare twisted-pair copper and optical fibre.

**Style:** Comparison

<details>
<summary>Answer</summary>

Twisted pair is cheap and easy to install and can carry power (PoE), but it is limited to about 100 m per segment and is affected by electrical interference. Fibre carries far more bandwidth over kilometres, is immune to electrical interference and hard to tap, but its transceivers cost more and it needs careful handling. Copper is used at desks and inside racks; fibre in backbones, between racks and buildings, and in submarine cables.

</details>

### Q2. What are simplex, half duplex and full duplex?

<details>
<summary>Answer</summary>

Simplex: data flows one way only (a keyboard). Half duplex: both ways but one at a time (a walkie-talkie, hub-based Ethernet). Full duplex: both ways simultaneously (switched Ethernet, phone calls).

</details>

## Intermediate

### Q3. Is fibre faster than copper because light is faster than electricity?

**Style:** Follow-up

<details>
<summary>Answer</summary>

No. Signals in both travel at roughly 2/3 of the speed of light in a vacuum, so propagation delay is similar. Fibre wins because it supports much higher data rates over much longer distances with less loss and no electrical interference.

</details>

### Q4. Why is Wi-Fi throughput often much lower than the advertised rate?

**Style:** Why

<details>
<summary>Answer</summary>

Wi-Fi is a shared, half-duplex medium: all devices on a channel take turns, and protocol overhead (acknowledgements, contention) is significant. Signal strength drops with distance and walls, neighbouring networks interfere (especially on 2.4 GHz), and the rate adapts down when the signal is weak. The advertised rate is a best-case link rate, not throughput.

</details>
