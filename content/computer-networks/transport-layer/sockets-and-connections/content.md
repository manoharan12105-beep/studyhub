# Sockets and Connections: Port vs Socket

**Module:** Transport Layer · **Interview priority:** Core

## What Is It?

A **socket** is one **endpoint** of a network conversation, and the programming interface the OS gives applications to use the network. An endpoint is identified by an **IP address + port** (+ protocol), e.g. `203.0.113.10:443/TCP`.

A **TCP connection** is identified by the pair of endpoints — the **4-tuple**:

```text
(source IP, source port, destination IP, destination port)
(192.168.1.10, 52100, 203.0.113.10, 443)
```

(With the protocol added it is often called the **5-tuple**.)

## Why It Exists

Applications should not deal with packets, headers and retransmissions. The socket API (originally Berkeley sockets, 1983) lets a program say "connect to this IP and port, then read and write bytes" while the OS kernel runs TCP/IP underneath. Every network library — Java's `Socket`, `HttpClient`, JDBC drivers, Tomcat — is built on it.

## How It Works

### Port vs socket vs connection

| | Port | Socket | Connection |
|---|------|--------|------------|
| What | A 16-bit number | An endpoint: IP + port (+ protocol), and the OS object the app uses | Two endpoints talking: the 4-tuple |
| Example | `443` | `203.0.113.10:443` | `192.168.1.10:52100 ↔ 203.0.113.10:443` |
| Analogy | Flat number | Full address of one flat | A phone call between two flats |

> [!TIP]
> One line: **a port identifies an application on a host; a socket is IP + port (one end); a connection is two sockets.**

### Server and client sockets (TCP)

```text
SERVER                                   CLIENT
socket()                                 socket()
bind(0.0.0.0:8080)                       connect(203.0.113.10:8080)  ── 3-way handshake ──►
listen()           ◄───────────────────  (OS picks ephemeral port 52100)
accept() → returns a NEW connected socket for this client
read()/write()     ◄═══════ data ═══════► read()/write()
close()                                  close()
```

- The **listening socket** (`0.0.0.0:8080`, state `LISTEN`) only accepts new connections.
- Each `accept()` returns a **new connected socket**, identified by the full 4-tuple. A server with 1,000 clients has 1 listening socket and 1,000 connected sockets — all on local port 8080.
- The client's OS picks an **ephemeral source port** automatically.

### A runnable example

Two clients connect to the same server port; the server upper-cases what each sends:

```java
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

public class SocketDemo {

    public static void main(String[] args) throws Exception {
        // Port 0 asks the OS for any free port, so the demo never clashes with a running service.
        try (ServerSocket listener = new ServerSocket(0, 50, InetAddress.getLoopbackAddress())) {
            int serverPort = listener.getLocalPort();

            Thread server = new Thread(() -> {
                for (int i = 0; i < 2; i++) {
                    // accept() returns a NEW socket per client; the listening socket keeps listening.
                    try (Socket connection = listener.accept();
                         BufferedReader in = reader(connection);
                         PrintWriter out = writer(connection)) {
                        String line = in.readLine();
                        out.println(line.toUpperCase());
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                }
            });
            server.start();

            try (Socket a = new Socket(InetAddress.getLoopbackAddress(), serverPort);
                 Socket b = new Socket(InetAddress.getLoopbackAddress(), serverPort)) {
                System.out.println("Client A got: " + talk(a, "hello from a"));
                System.out.println("Client B got: " + talk(b, "hello from b"));

                // Both connections go to the same server IP and port ...
                System.out.println("Same server port: " + (a.getPort() == b.getPort()));
                // ... and are told apart by the client's ephemeral port (the 4-tuple differs).
                System.out.println("Different client ports: " + (a.getLocalPort() != b.getLocalPort()));
                System.out.println("Client ports are ephemeral (>= 1024): "
                        + (a.getLocalPort() >= 1024 && b.getLocalPort() >= 1024));
            }
            server.join();
        }
    }

    static String talk(Socket socket, String message) throws Exception {
        PrintWriter out = writer(socket);
        out.println(message);
        return reader(socket).readLine();
    }

    static BufferedReader reader(Socket s) throws Exception {
        return new BufferedReader(new InputStreamReader(s.getInputStream(), StandardCharsets.UTF_8));
    }

    static PrintWriter writer(Socket s) throws Exception {
        return new PrintWriter(s.getOutputStream(), true, StandardCharsets.UTF_8);
    }
}
```

**Output:**

```text
Client A got: HELLO FROM A
Client B got: HELLO FROM B
Same server port: true
Different client ports: true
Client ports are ephemeral (>= 1024): true
```

### Seeing sockets on a machine

```bash
ss -tan        # Linux: all TCP sockets with state, numeric
```

**Output (varies):**

```text
State     Recv-Q Send-Q  Local Address:Port    Peer Address:Port
LISTEN    0      4096       127.0.0.54:53           0.0.0.0:*
TIME-WAIT 0      0      172.19.220.201:33542 23.206.189.171:80
```

`LISTEN` rows are listening sockets (peer `*`); other rows are connections with both endpoints. Windows: `netstat -ano`.

### Limits worth knowing

- A client can open about as many connections **to one server IP:port** as it has ephemeral ports (~28,000 on default Linux) — the source port is the only part of the 4-tuple that changes. Proxies and load balancers that open many backend connections can hit this ("ephemeral port exhaustion"), especially with many sockets stuck in `TIME_WAIT`.
- A server's limit is not 65,535: connections differ by client IP and port, so the real limits are memory, file descriptors (`ulimit -n`) and threads.

### UDP sockets

UDP sockets are not connected: one socket receives datagrams from anyone, and each `receive()` tells you the sender's IP and port ([UDP](../udp-protocol/content.md)).

## Real World

- Tomcat in Spring Boot: one listening socket on 8080, a connected socket per client connection, handed to worker threads.
- HikariCP keeps a **pool** of connected sockets to PostgreSQL so requests do not pay a TCP + authentication handshake every time ([Keep-Alive and Connection Pooling](../../performance/keep-alive-and-connection-pooling/content.md)).
- A WebSocket is a long-lived TCP connection, i.e. one socket pair kept open.

## Common Traps

- **"Port and socket are the same."** A port is a number; a socket is IP + port as an endpoint (and the OS object).
- **"A server can handle at most 65,535 connections because of ports."** Server-side connections all use one port; the limit comes from resources, not port numbers.
- **"accept() moves the client to a new port."** The connected socket uses the same local port as the listener.

## Interview Follow-up

- *"What uniquely identifies a TCP connection?"* The 4-tuple (5-tuple with protocol).
- *"What is the difference between a listening and a connected socket?"* The listening socket has only a local address and accepts new connections; a connected socket has both endpoints and carries data.

## Key Takeaways

- Port = number; socket = IP + port endpoint; connection = two sockets (the 4-tuple).
- Servers: `bind` → `listen` → `accept` (new socket per client). Clients: `connect` from an ephemeral port.
- One server port serves many clients because the client IP/port differ.
- Client-side ephemeral ports can run out; server-side connections are limited by resources.
