# Network Components and Architectures — Interview Questions

## Beginner

### Q1. What is the difference between a client and a server?

<details>
<summary>Answer</summary>

A client starts the conversation by sending a request; a server waits (listens on a known port) and responds. It is a role in a conversation, not a type of hardware — a laptop running a web app on port 8080 is a server.

</details>

### Q2. Compare client-server and peer-to-peer architectures.

**Style:** Comparison

<details>
<summary>Answer</summary>

In client-server, dedicated servers provide the service and clients request it: central control and easy security, but the server is a bottleneck and a single point of failure unless replicated. In P2P, every peer both requests and serves: capacity grows with users and there is no central point of failure, but security, availability and consistency are harder. Web apps and APIs are client-server; BitTorrent and blockchains are P2P.

</details>

## Intermediate

### Q3. Can one program be both a client and a server?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Yes, and backend services usually are. A Spring Boot order service is a server for incoming HTTP requests and a client of PostgreSQL, Redis, a message broker and other services' APIs.

</details>

### Q4. Why do web systems use a three-tier architecture instead of letting the browser talk to the database?

**Style:** Why

<details>
<summary>Answer</summary>

The database credentials and business rules would have to live on the user's device, where anyone can read and change them. A middle tier (application server) authenticates users, validates input, enforces rules and exposes only safe operations. It also lets you pool database connections and scale the app servers independently.

</details>

## Advanced

### Q5. Why do many "P2P" applications still depend on servers?

<details>
<summary>Answer</summary>

Peers need a way to find each other (a tracker or signalling server), and most peers are behind NAT and firewalls, so they need a server to exchange addresses (STUN) or to relay traffic when a direct path is impossible (TURN). The data then flows peer to peer where possible.

</details>
