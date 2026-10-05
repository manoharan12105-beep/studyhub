# UDP: User Datagram Protocol

**Module:** Transport Layer · **Interview priority:** Core

## What Is It?

**UDP** is the minimal transport protocol: it adds **ports** and a **checksum** to IP and nothing else. Each message (a **datagram**) is sent independently — no connection, no acknowledgement, no retransmission, no ordering, no flow or congestion control.

## Why It Exists

Some applications are better off without TCP's guarantees:

- **Speed and low latency:** no handshake before the first byte, no waiting for a lost packet to be retransmitted.
- **Real-time data:** in a video call, a late packet is useless — better to skip it than to stall everything waiting for it (TCP's head-of-line blocking).
- **Small request/response:** a DNS query fits in one datagram; setting up a TCP connection would triple the cost.
- **Broadcast and multicast:** TCP is one-to-one; UDP can send to many (DHCP Discover, IPTV).
- **Building your own transport:** QUIC (HTTP/3) runs on UDP and implements its own reliability and congestion control in user space.

## How It Works

### The header — 8 bytes

```text
 0               16              31
┌───────────────┬───────────────┐
│  Source port  │   Dest port   │
├───────────────┼───────────────┤
│    Length     │   Checksum    │
└───────────────┴───────────────┘
│            data …             │
```

| Field | Meaning |
|-------|---------|
| Source port | Sender's port (can be 0 if no reply is expected) |
| Destination port | Receiving application |
| Length | Header + data in bytes (minimum 8) |
| Checksum | Over header, data and a pseudo-header of IP addresses; optional in IPv4, mandatory in IPv6 |

Compare TCP's 20–60-byte header.

### Message boundaries are preserved

One `send()` = one datagram = one `receive()`. Unlike TCP's byte stream, UDP never merges or splits application messages. A datagram larger than the path MTU is fragmented at the IP level (and lost entirely if any fragment is lost), so UDP applications keep datagrams small (DNS traditionally ≤ 512 bytes; modern DNS with EDNS ~1,232).

### A runnable example

```java
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;

public class UdpDemo {

    public static void main(String[] args) throws Exception {
        InetAddress loopback = InetAddress.getLoopbackAddress();
        try (DatagramSocket server = new DatagramSocket(0, loopback);   // any free port
             DatagramSocket client = new DatagramSocket(0, loopback)) {

            // No connection, no handshake: the client just sends a datagram to IP:port.
            byte[] question = "status?".getBytes(StandardCharsets.UTF_8);
            client.send(new DatagramPacket(question, question.length, loopback, server.getLocalPort()));

            // Each receive() returns exactly one whole datagram, plus who sent it.
            byte[] buffer = new byte[512];
            DatagramPacket request = new DatagramPacket(buffer, buffer.length);
            server.receive(request);
            String text = new String(request.getData(), 0, request.getLength(), StandardCharsets.UTF_8);
            System.out.println("Server received " + request.getLength() + " bytes: " + text);

            // The reply goes back to the sender's address and port taken from the datagram.
            byte[] answer = "ok".getBytes(StandardCharsets.UTF_8);
            server.send(new DatagramPacket(answer, answer.length, request.getSocketAddress()));

            DatagramPacket reply = new DatagramPacket(new byte[512], 512);
            client.setSoTimeout(2000);   // UDP gives no delivery guarantee, so never wait forever
            client.receive(reply);
            System.out.println("Client received: "
                    + new String(reply.getData(), 0, reply.getLength(), StandardCharsets.UTF_8));
        }
    }
}
```

**Output:**

```text
Server received 7 bytes: status?
Client received: ok
```

On a real network the request or the reply could be lost; the timeout is how the client finds out, and the application decides whether to retry.

### What happens to a datagram for a closed port

If no socket is bound to the destination UDP port, the receiving host replies with ICMP *Port Unreachable* (if not blocked by a firewall). That is how classic `traceroute` detects it has reached the destination.

## Advantages and Limitations

| Advantages | Limitations |
|------------|-------------|
| No connection setup — first datagram carries data | No delivery guarantee; no notice of loss |
| Low overhead (8-byte header), no per-connection state on the server | No ordering; duplicates possible |
| No head-of-line blocking | No flow control — a fast sender can overrun a receiver |
| Supports broadcast and multicast | No congestion control — can flood a network (apps must behave) |
| Message boundaries preserved | Datagrams limited in practical size |
| Simple for request/response | Spoofable source address → used in amplification DDoS |

## Use Cases

| Application | Why UDP |
|-------------|---------|
| DNS (port 53) | One small query, one small answer; retries are cheap |
| DHCP (67/68) | Client has no IP yet; uses broadcast |
| VoIP, video calls (RTP), online games | Low latency matters more than every packet |
| Live streaming, IPTV multicast | One-to-many, real time |
| NTP (123), SNMP (161) | Small, periodic messages |
| QUIC / HTTP/3 (443) | Reliability and encryption rebuilt on top, avoiding TCP's limits |
| VPNs (WireGuard, OpenVPN UDP) | Tunnelled TCP already provides reliability end to end |

## Common Traps

- **"UDP is unreliable, so it is bad."** It is a deliberate choice; reliability is added only when needed (QUIC, application retries).
- **"UDP has no error checking."** It has a checksum; corrupted datagrams are dropped — it just does not retransmit.
- **"UDP is always faster."** It avoids handshakes and stalls, but bandwidth is the same; and without congestion control a careless UDP app can make things worse.
- **"DNS uses only UDP."** It uses TCP for large responses and zone transfers.

## Interview Follow-up

- *"Why does DNS use UDP?"* Small single-packet exchanges; a TCP handshake would add a round trip to every lookup.
- *"How does a UDP application become reliable?"* Sequence numbers, ACKs, timeouts and retries in the application, or a protocol like QUIC.

## Key Takeaways

- UDP = IP + ports + checksum. 8-byte header, connectionless, message-oriented.
- No handshake, ACKs, retransmission, ordering, flow or congestion control.
- Best for small request/response (DNS, DHCP), real-time media, multicast, and custom transports (QUIC).
