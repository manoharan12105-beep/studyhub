# IP Addresses, Ports, Sockets and Connections

**Module:** Communication and APIs · **Interview priority:** Frequently asked

## What Is It?

Four ideas explain how two programs on different machines find each other:

- An **IP address** identifies a machine's network interface: `10.0.1.12` (private) or `203.0.113.10` (public).
- A **port** (0–65535) identifies a program on that machine: a web server listens on 443, PostgreSQL on 5432, Redis on 6379.
- A **socket** is one endpoint of a connection: IP address + port, owned by a process.
- A **TCP connection** is identified by four values — source IP, source port, destination IP, destination port (the **4-tuple**) — so one server port can hold thousands of connections at once.

```text
Client 198.51.100.7:51234  ───TCP───►  Server 203.0.113.10:443
Client 198.51.100.7:51235  ───TCP───►  Server 203.0.113.10:443   (different 4-tuple, separate connection)
```

The Computer Networks lessons cover the protocol details: [Transport Layer and Ports](../../../computer-networks/transport-layer/transport-layer-and-ports/content.md) and [Sockets and Connections](../../../computer-networks/transport-layer/sockets-and-connections/content.md).

## Why It Exists

System design is full of connections: clients to load balancers, load balancers to servers, servers to databases, caches and other services. Connections cost time to open and memory to keep, and every component has a limit. Many production outages are not "CPU at 100 %" but "connections exhausted".

## How It Works

### Opening a connection is not free

A new TCP connection costs one round trip (the three-way handshake), and TLS adds one more (TLS 1.3) or two (TLS 1.2) before the first byte of the request. Across a continent that is hundreds of milliseconds. Hence:

- **Keep-alive / connection reuse:** HTTP clients keep connections open for many requests.
- **Connection pools:** applications keep a fixed set of open database connections and lend them out ([Connection Pooling](../../data-and-storage/connection-pooling-and-database-bottlenecks/content.md)).
- **HTTP/2 multiplexing:** many requests share one connection concurrently.

### Every component has a connection limit

| Component | What limits connections |
|-----------|-------------------------|
| Server process | File descriptors (`ulimit -n`), memory per connection, thread-per-connection models |
| Database | A configured maximum (PostgreSQL `max_connections`, often 100–500); each connection uses memory and a backend process |
| Client machine → one destination | Ephemeral source ports: Linux uses about 28,000 by default per destination IP and port |
| Load balancer | Connection table size, licence or instance limits |

### Persistent connections at scale

Chat and live-update systems keep a connection open per online user. Ten million online users means ten million open connections spread across many gateway servers, each holding perhaps tens to hundreds of thousands. Such servers use event-driven I/O (one thread serving many connections) rather than one thread per connection.

**Think about it:** 40 application servers each run a database connection pool of 20 connections. The PostgreSQL server allows 500 connections. What happens when autoscaling adds 10 more servers?

<details>
<summary>Answer</summary>

40 × 20 = 800 already exceeds 500 if every pool fills, and 50 × 20 = 1,000 makes it worse: new connections are refused with errors like "too many clients", and requests fail. Fixes: smaller pools per server, a connection pooler such as PgBouncer in front of the database, read replicas to spread read connections, and capacity checks that include connections, not only CPU.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** "A server can have at most 65,535 connections because there are only 65,535 ports." The server listens on one port; connections are distinguished by the client's IP and port too. The real limits are memory, file descriptors and the client side's ephemeral ports per destination.

## Interview Follow-up

- *"Why do we need connection pooling?"* Opening a database connection costs network round trips, authentication and server memory; pools reuse a bounded number of connections, keeping latency low and protecting the database's connection limit.

## Key Takeaways

- IP finds the machine, port finds the program, the 4-tuple identifies the connection.
- Connections cost round trips to open and memory to keep — reuse them (keep-alive, pools, HTTP/2).
- Connection limits exist at every layer; check them when scaling out.
