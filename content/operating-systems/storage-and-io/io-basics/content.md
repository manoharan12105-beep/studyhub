# I/O Basics

**Module:** Storage and I/O · **Interview priority:** Frequently asked

## Concept

**I/O management** is how the OS controls devices — disks, keyboards, network cards, displays — and moves data between them and memory. Devices are wildly different in speed and behaviour, so the OS hides them behind a uniform interface (`read`, `write`, `open`, `ioctl`) built from three layers:

```text
 application        read(fd, buf, n)
 ─────────────────────────────────────────────
 kernel I/O subsystem   buffering, caching, scheduling, spooling, errors
 device drivers         device-specific code (one per device type)
 ─────────────────────────────────────────────
 device controller  hardware with registers and a buffer; talks to the device
 device             disk, NIC, keyboard …
```

## Why It Matters

Devices are thousands to millions of times slower than the CPU. How the CPU waits for them — **polling**, **interrupts** or **DMA** — and how programs wait — **blocking**, **non-blocking** or **asynchronous** I/O — decides whether a system wastes its CPU or keeps it busy. These are common interview follow-ups to process states and system calls.

## How It Works

### How the CPU talks to a device

The CPU reads and writes the **controller's registers** (status, command, data) either through special I/O instructions (**port-mapped I/O**) or ordinary memory addresses mapped to the registers (**memory-mapped I/O**). The **device driver** knows the register details; the rest of the kernel does not.

### Three ways to wait for a device

| Technique | How it works | CPU cost | Good for |
|-----------|--------------|----------|----------|
| **Programmed I/O / polling** | CPU repeatedly checks the status register until the device is ready (busy-waiting) | High — CPU does nothing else | Very fast devices, or when the wait is extremely short |
| **Interrupt-driven I/O** | CPU starts the operation and continues other work; the controller raises an **interrupt** when done; the interrupt handler finishes the transfer | One interrupt per unit of data | Keyboards, mice, slow devices |
| **DMA (Direct Memory Access)** | CPU tells the **DMA controller** the source, destination and count; the DMA controller copies the whole block between device and memory and interrupts **once** at the end | One interrupt per block | Disks, network cards — bulk transfers |

### Interrupt handling in brief

1. The device controller raises an interrupt line.
2. The CPU finishes the current instruction, saves state and switches to kernel mode.
3. It uses the **interrupt vector** to jump to the right handler.
4. The handler services the device (often deferring longer work), then returns; the scheduler may now run a process that was waiting for this I/O.

### How applications wait

- **Blocking (synchronous) I/O** — the call returns only when the I/O is done; the process is moved to the **Waiting** state meanwhile. Simple; the normal default.
- **Non-blocking I/O** — the call returns immediately with whatever is available (possibly nothing); the program checks again later or uses `select`/`poll`/`epoll` to learn when data is ready.
- **Asynchronous I/O** — the call starts the operation and returns at once; the program is **notified** (callback, signal, completion queue) when the whole operation has finished.

### Services of the kernel I/O subsystem

- **Buffering** — temporary storage to absorb speed differences (network packets arrive faster than the program reads) and size differences between producer and consumer; **double buffering** lets one buffer fill while the other is processed.
- **Caching** — keeping copies of frequently used data in faster memory (the page cache keeps disk blocks in RAM).
- **Spooling** — queueing output for a device that can serve only one job at a time (print jobs go to disk; a daemon prints them in order).
- **I/O scheduling** — ordering requests ([Disk Scheduling](../disk-scheduling/content.md)).
- **Error handling and protection** — all I/O instructions are privileged, so programs must use system calls.

## Example

Copying a 1 MB file from disk with 4 KB blocks:

- **Polling:** the CPU spins on the status register during every block's seek and transfer — wasted for milliseconds per block.
- **Interrupt per byte:** about a million interrupts — the CPU drowns in interrupt handling.
- **DMA:** the CPU programs 256 block transfers (1 MB ÷ 4 KB); the DMA controller moves the data and raises **256 interrupts** in total; between them the CPU runs other processes.

A web server handling 10,000 connections uses **non-blocking I/O with `epoll`** (or asynchronous I/O): one thread waits for "any of these sockets is ready" instead of 10,000 threads each blocked on one socket.

## Comparison

| Aspect | Polling | Interrupts | DMA |
|--------|---------|------------|-----|
| Who checks readiness | CPU, in a loop | Device signals the CPU | DMA controller signals at block end |
| Who moves the data | CPU | CPU (in the handler) | DMA controller |
| CPU free while waiting? | No | Yes | Yes |
| Interrupts | None | Per unit (byte/word) | Per block |
| Best for | Short waits, very fast devices | Slow, small transfers | Large transfers |

## Important Points

- Layers: application → kernel I/O subsystem → drivers → controllers → devices.
- Polling wastes CPU; interrupts free the CPU; DMA also frees it from copying data.
- Blocking: wait until done. Non-blocking: return immediately. Asynchronous: return now, notify on completion.
- Kernel services: buffering, caching, spooling, scheduling, error handling.
- I/O instructions are privileged → programs use system calls.

## Common Confusion

> [!WARNING]
> **Non-blocking vs asynchronous.** Non-blocking returns immediately with *whatever is ready now* and the program must ask again. Asynchronous returns immediately and the *whole operation completes later*, with a notification.

- **Buffering vs caching:** a buffer may hold the only copy of data in transit; a cache holds a *copy* of data that also exists elsewhere.
- **DMA still uses interrupts** — one per block instead of one per byte.

## Interview Perspective

- *"Polling vs interrupts vs DMA?"* — who waits, who copies, interrupt frequency.
- *"What is DMA and why is it needed?"* — bulk transfers without the CPU copying.
- *"Blocking vs non-blocking vs asynchronous I/O?"*
- *"Buffering, caching and spooling — differences?"*

## Quick Revision

- Driver hides device details; controller has registers; port-mapped vs memory-mapped I/O.
- Polling (CPU spins) · interrupts (device signals) · DMA (controller copies, one interrupt per block).
- Blocking · non-blocking · asynchronous.
- Buffering (speed/size mismatch) · caching (fast copy) · spooling (queue for one device).
