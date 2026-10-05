# OSI vs TCP/IP — Interview Questions

## Beginner

### Q1. What is the difference between the OSI model and the TCP/IP model?

**Style:** Comparison

<details>
<summary>Answer</summary>

OSI is a 7-layer reference model from ISO, designed before its protocols and used today for teaching and troubleshooting. TCP/IP is the 4-layer (or 5-layer) architecture of the protocols the Internet actually runs — IP, TCP, UDP, HTTP, DNS. TCP/IP merges OSI's Session, Presentation and Application into one Application layer, and (in the 4-layer view) Data Link and Physical into one Link layer.

</details>

### Q2. Map the OSI layers to the TCP/IP layers.

<details>
<summary>Answer</summary>

OSI 7, 6, 5 → TCP/IP Application. OSI 4 → Transport. OSI 3 → Network (Internet). OSI 2 and 1 → Data Link and Physical (5-layer) or Link (4-layer).

</details>

## Intermediate

### Q3. Why did TCP/IP win over the OSI protocol suite?

**Style:** Why

<details>
<summary>Answer</summary>

TCP/IP was implemented and running first (ARPANET in 1983, free in BSD Unix), it was simpler, its standards (RFCs) were open and free, and the growing Internet created a network effect. The OSI protocols were complex, slow to standardise and arrived when TCP/IP was already established.

</details>

### Q4. If the Internet uses TCP/IP, why do engineers say "Layer 7 load balancer"?

**Style:** Follow-up

<details>
<summary>Answer</summary>

OSI's layer numbers became the industry's common vocabulary. "Layer 7" means the device understands the application protocol (HTTP paths, headers, cookies); "Layer 4" means it works only with transport information (IPs and ports). The traffic itself is TCP/IP.

</details>

## Advanced

### Q5. Where do TLS and session management live in each model?

**Style:** Comparison

<details>
<summary>Answer</summary>

In OSI, encryption is a Presentation-layer function and dialogue management is the Session layer, so TLS is usually placed around layer 6 (with session-like features such as resumption). In TCP/IP there are no such layers: TLS is part of the Application layer, running on top of TCP, and session handling (keep-alive, resumption, cookies) is done by applications.

</details>
