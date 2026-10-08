# Docker Fundamentals — Practice

### P1. Image or container?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** image vs container

Which statement is true?

- A) A container is a read-only template; an image is its running copy
- B) An image can be used to start many containers
- C) Removing a container deletes its image
- D) Each container needs its own copy of the image layers on disk

<details>
<summary>Answer</summary>

**Answer:** B) An image can be used to start many containers

**Explanation:** Containers share the image's read-only layers; each adds only its own writable layer. Removing a container leaves the image untouched.

</details>

### P2. Expand the reference

**Difficulty:** Easy · **Type:** Output · **Concepts:** image references

What full reference does Docker use for `docker pull nginx`?

<details>
<summary>Answer</summary>

`docker.io/library/nginx:latest` — the default registry is Docker Hub, official images live in the `library` namespace, and a missing tag means `latest`.

</details>

### P3. Shared kernel

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** container vs VM

Why does a container start much faster than a virtual machine?

- A) Containers are written in Go
- B) Containers do not boot an operating system kernel; they are processes on the host kernel
- C) Containers have no filesystem
- D) Containers skip networking

<details>
<summary>Answer</summary>

**Answer:** B) Containers do not boot an operating system kernel; they are processes on the host kernel

</details>

### P4. Where did it go?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** lifecycle, ps -a

You ran `docker stop api`. Which command still lists the container?

- A) `docker ps`
- B) `docker ps -a`
- C) `docker images`
- D) None — stop deletes it

<details>
<summary>Answer</summary>

**Answer:** B) `docker ps -a`

**Explanation:** `docker ps` shows running containers only; `-a` includes exited ones. Only `docker rm` deletes a container.

</details>

### P5. Which feature?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** namespaces, cgroups

Match each need to the kernel feature: (a) limit a container to 512 MB of RAM, (b) give the container its own `localhost` and network interfaces, (c) let 10 containers share one copy of the JRE layer.

<details>
<summary>Answer</summary>

(a) cgroups, (b) network namespace, (c) union filesystem (overlay2) with shared read-only layers.

</details>

### P6. Predict the state

**Difficulty:** Medium · **Type:** Output · **Concepts:** lifecycle

Commands in order: `docker run -d --name web nginx:1.30`, `docker stop web`, `docker start web`, `docker restart web`, `docker rm -f web`. What is the state after each?

<details>
<summary>Answer</summary>

running → exited → running → running (stopped and started again) → removed. `rm -f` stops (kills) a running container and removes it in one step.

</details>

### P7. Data loss

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** writable layer

PostgreSQL ran in a container without a volume. A teammate ran `docker rm -f db` and `docker run … postgres:18` again. Where is the data?

<details>
<summary>Answer</summary>

Gone. The database files lived in the removed container's writable layer. The new container starts with an empty data directory. A named volume would have kept them.

</details>

### P8. The daemon error

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** architecture

On a fresh server `docker ps` prints "permission denied while trying to connect to the Docker daemon socket", but `sudo docker ps` works. What is wrong?

<details>
<summary>Answer</summary>

The daemon runs; your user may not access its socket. Add the user to the `docker` group (`sudo usermod -aG docker $USER`) and log in again — knowing that this grants root-equivalent power.

</details>

### P9. VM, container or both?

**Difficulty:** Hard · **Type:** Architecture · **Concepts:** container vs VM

You rent one cloud server and want to run Nginx, a Spring Boot API and PostgreSQL. Where do VMs and containers each appear in this setup?

<details>
<summary>Answer</summary>

The rented server is a VM (the provider's hypervisor runs it on shared hardware). Inside it, Docker runs the API and PostgreSQL as containers sharing the VM's Linux kernel. Nginx can run on the VM directly or as a third container. Both technologies are used, at different levels.

</details>
