# Lab 03 — Interview Questions

## Beginner

### Q1. Why does the final stage use a JRE image instead of a JDK image?

**Style:** Why

<details>
<summary>Answer</summary>

Running compiled classes needs only the runtime. The compiler and tools of the JDK make the image larger and add packages that could contain vulnerabilities, without any benefit at run time.

</details>

## Intermediate

### Q2. The containerised Java server works with `docker exec` + `curl localhost` inside, but not from the host through the published port. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

The server listens only on `127.0.0.1` inside the container. Traffic forwarded from the host arrives on the container's network interface, not on its loopback. Bind to all interfaces (`0.0.0.0`, or `new InetSocketAddress(port)` in Java).

</details>

### Q3. How did one image run with different ports and greetings?

**Style:** How

<details>
<summary>Answer</summary>

The program reads `PORT` and `GREETING` from environment variables, and `docker run -e` sets them per container. The `-p HOST:CONTAINER` mapping is chosen per container too. Configuration lives outside the image, so the image never needs rebuilding for it.

</details>
