# TCP: Segments, Sequence Numbers and Reliability — Interview Questions

## Beginner

### Q1. How does TCP provide reliable delivery?

<details>
<summary>Answer</summary>

Each byte has a sequence number; the receiver returns cumulative acknowledgements of the next byte it expects; the sender retransmits data that is not acknowledged before a timeout or after three duplicate ACKs; checksums discard corrupted segments; out-of-order data is buffered and reordered; duplicates are dropped. Flow control and congestion control prevent overload that would cause loss.

</details>

### Q2. What do the SYN, ACK, FIN and RST flags mean?

<details>
<summary>Answer</summary>

SYN: synchronise sequence numbers — opening a connection. ACK: the acknowledgement number field is valid (set on almost every segment after the first). FIN: the sender has finished sending data (graceful close of one direction). RST: abort the connection immediately (e.g. a segment for a port nobody listens on, or an application aborting).

</details>

## Intermediate

### Q3. A receiver sends ACK 5001. What does that mean?

**Style:** Output/prediction

<details>
<summary>Answer</summary>

It has received every byte up to and including byte 5000 in order, and the next byte it expects is 5001. TCP ACKs are cumulative and byte-based.

</details>

### Q4. What is fast retransmit?

<details>
<summary>Answer</summary>

When a segment is lost but later ones arrive, the receiver keeps repeating the ACK for the missing byte (duplicate ACKs). After three duplicate ACKs the sender assumes that segment was lost and retransmits it immediately, instead of waiting for the retransmission timer — much faster recovery.

</details>

### Q5. Is TCP message-oriented? What does that mean for application protocols?

**Style:** Follow-up

<details>
<summary>Answer</summary>

No, TCP is a byte stream: it does not preserve the boundaries of the application's writes. Two writes may be read together, or one write in several reads. Application protocols must frame messages themselves — HTTP/1.1 uses headers plus `Content-Length` or chunked encoding, others use length prefixes or delimiters.

</details>

## Advanced

### Q6. Why does TCP use a random initial sequence number?

**Style:** Why

<details>
<summary>Answer</summary>

So that segments from an old connection with the same 4-tuple are unlikely to fall within the new connection's sequence space (avoiding data corruption), and so that an off-path attacker cannot easily guess the sequence numbers needed to inject data or reset the connection (TCP sequence prediction attacks).

</details>

### Q7. How is the retransmission timeout chosen?

<details>
<summary>Answer</summary>

From measured round-trip times: TCP keeps a smoothed RTT and an RTT variation, and sets RTO ≈ SRTT + 4 × RTTVAR, with a minimum (1 s in the RFC; about 200 ms on Linux). On each successive timeout for the same data, the RTO doubles (exponential back-off). Retransmitted segments are not used for RTT samples (Karn's algorithm) unless timestamps disambiguate them.

</details>
