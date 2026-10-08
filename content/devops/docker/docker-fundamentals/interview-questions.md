# Docker Fundamentals — Interview Questions

## Beginner

### Q1. What is Docker?

**Style:** What

<details>
<summary>Answer</summary>

Docker is a platform for packaging an application with its runtime and dependencies into an image, and running that image as an isolated container. The same image runs identically on a laptop, a CI runner and a server, which removes "works on my machine" problems and makes deployments repeatable.

</details>

### Q2. What is the difference between an image and a container?

**Style:** Comparison

<details>
<summary>Answer</summary>

An image is a read-only template made of layers plus metadata (default command, ports, environment). A container is a running (or stopped) instance of an image: the image's layers plus its own writable layer, isolated with namespaces and limited with cgroups. One image can run as many containers — like a class and its objects.

</details>

### Q3. How is a container different from a virtual machine?

**Style:** Comparison

<details>
<summary>Answer</summary>

A VM virtualises hardware and runs a full guest OS with its own kernel on a hypervisor. A container is an isolated process that shares the host's kernel. Containers are therefore much smaller (MB vs GB) and start in about a second, while VMs give stronger isolation and can run a different OS kernel. In practice containers often run inside VMs (a cloud VPS).

</details>

### Q4. What is a container registry?

**Style:** What

<details>
<summary>Answer</summary>

A server that stores and distributes images, organised as repositories with tags. Docker Hub is the default; GitHub Container Registry (`ghcr.io`) and cloud registries (ECR, Artifact Registry, ACR) are common. CI pushes images to a registry; servers pull them from it.

</details>

## Intermediate

### Q5. What are image layers and why do they matter?

**Style:** Why

<details>
<summary>Answer</summary>

Each build step produces a read-only layer containing its filesystem changes. Layers are content-addressed, so they are cached during builds, shared between images on disk, and only missing layers are downloaded on pull or uploaded on push. Ordering a Dockerfile so rarely changing layers (base image, dependencies) come before often changing ones (your code) makes builds and deployments fast.

</details>

### Q6. Which Linux kernel features make containers possible?

**Style:** How

<details>
<summary>Answer</summary>

Namespaces give each container its own view of processes (PID), network, mounts, hostname (UTS), IPC and users. Control groups (cgroups) limit and account CPU, memory and I/O. A union filesystem such as overlay2 stacks the image layers with a per-container writable layer using copy-on-write.

</details>

### Q7. Your container starts and immediately exits. What does that mean and what do you do?

**Style:** Troubleshooting

<details>
<summary>Answer</summary>

A container runs only as long as its main process. It exited because that process finished or crashed — for a Spring Boot app, typically a start-up failure such as a bad database URL or a missing environment variable. Run `docker ps -a` to see the exit code, then `docker logs <name>` to read the error. An exit code of 137 means the process was killed (SIGKILL, often out of memory).

</details>

### Q8. What happens to files written inside a container when the container is removed?

**Style:** What happens if

<details>
<summary>Answer</summary>

They are lost. Writes go to the container's writable layer, which is deleted by `docker rm`. Stopping and starting keeps the layer, but removing does not. Data that must survive — database files, uploads — goes into a volume or a bind mount.

</details>

## Advanced

### Q9. "Cannot connect to the Docker daemon at unix:///var/run/docker.sock." Explain the architecture behind this error and how to fix it.

**Style:** Debugging

<details>
<summary>Answer</summary>

The `docker` CLI is only a client; it sends REST API calls to the Docker Engine daemon (`dockerd`) over a Unix socket. The error means the client cannot reach that socket: the daemon is not running (`sudo systemctl start docker`, check `systemctl status docker`), or the user lacks permission on the socket (add the user to the `docker` group and log in again, or use `sudo`). With Docker Desktop, the desktop app (and its VM) must be running.

</details>

### Q10. Are containers secure enough to run untrusted code from different customers on one host?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Not by default. Containers share the host kernel, so a kernel vulnerability can allow escape, and misconfiguration (privileged containers, mounted Docker socket, running as root) weakens isolation further. For untrusted multi-tenant workloads use VMs or sandboxed runtimes (microVMs such as Firecracker, gVisor). For your own services, harden containers: non-root user, minimal images, no privileged mode, resource limits.

</details>
