# I/O Basics — Interview Questions

## Beginner

### Q1. What is the difference between polling and interrupt-driven I/O?

**Style:** Comparison

<details>
<summary>Answer</summary>

With **polling**, the CPU repeatedly reads the device's status register until the device is ready, doing no other work (busy-waiting). With **interrupt-driven I/O**, the CPU starts the operation and continues with other work; the device raises an interrupt when it is ready, and the CPU runs a handler. Polling is acceptable only for very short waits; interrupts keep the CPU productive.

</details>

### Q2. What is DMA?

**Style:** Direct

<details>
<summary>Answer</summary>

Direct Memory Access: a DMA controller transfers a block of data between a device and memory without the CPU copying each byte. The CPU only sets up the transfer (source, destination, byte count) and receives one interrupt when the whole block is done. It is used for disks, network cards and other high-volume devices.

</details>

### Q3. What is a device driver?

**Style:** Direct

<details>
<summary>Answer</summary>

Kernel code that knows how to operate a specific kind of device controller — its registers, commands and interrupts — and presents a standard interface (read, write, ioctl) to the rest of the kernel. It isolates device-specific details so that the file system and applications work the same with any disk or network card.

</details>

## Intermediate

### Q4. Blocking, non-blocking and asynchronous I/O — what is the difference?

**Style:** Comparison

<details>
<summary>Answer</summary>

**Blocking:** the call returns only after the I/O completes; the caller is suspended meanwhile. **Non-blocking:** the call returns immediately with whatever data is available (possibly none, with an indication like `EAGAIN`); the program polls or uses readiness notification (`select`, `poll`, `epoll`). **Asynchronous:** the call starts the whole operation and returns immediately; the program is notified when it has completed (callback, signal, completion queue such as `io_uring`).

</details>

### Q5. What are buffering, caching and spooling?

**Style:** Comparison

<details>
<summary>Answer</summary>

**Buffering** holds data temporarily while it moves between producer and consumer, to cope with speed or size differences (a network receive buffer). **Caching** keeps a copy of frequently used data in faster storage (the page cache holds disk blocks in RAM). **Spooling** queues output for a device that can serve only one job at a time, such as a printer: jobs go to disk and a daemon sends them one by one.

</details>

### Q6. Why does DMA still need interrupts?

**Style:** Trap

<details>
<summary>Answer</summary>

The CPU must learn when the transfer has finished so that it can wake the waiting process and start the next request. DMA reduces interrupts from one per byte or word to one per block, but it still signals completion (and errors) with an interrupt.

</details>

## Advanced

### Q7. How can one server thread handle thousands of connections?

**Style:** Scenario

<details>
<summary>Answer</summary>

With non-blocking sockets and an event-notification mechanism: the thread registers all sockets with `epoll` (Linux), `kqueue` (BSD/macOS) or I/O completion ports (Windows) and waits once for "any socket ready". It then handles only the ready sockets and goes back to waiting. No thread is blocked per connection, so thousands of mostly idle connections cost little memory and few context switches. Java NIO selectors and frameworks such as Netty are built on this.

</details>

### Q8. When is polling actually better than interrupts?

**Style:** Trade-off

<details>
<summary>Answer</summary>

When the device responds faster than the cost of taking an interrupt and switching context — for example very fast NVMe storage or high-rate network packet processing. Taking an interrupt per event would then cost more than briefly spinning. High-performance systems (Linux NAPI for network cards, DPDK, polled NVMe queues) switch to polling under heavy load and use interrupts when traffic is light.

</details>
