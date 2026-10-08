# Lab 01 — Interview Questions

## Beginner

### Q1. What happens when you run `docker run -d --name web -p 8081:80 nginx:1.30` and the image is not on your machine?

**Style:** What happens internally

<details>
<summary>Answer</summary>

The CLI asks the Docker Engine to create the container; the engine finds no local `nginx:1.30`, pulls its missing layers from Docker Hub, creates a container with a writable layer, sets up the port forwarding from host 8081 to container port 80, starts Nginx as the main process and returns the container ID because of `-d`.

</details>

### Q2. After `docker stop web`, why does `docker ps` not show the container?

**Style:** Why

<details>
<summary>Answer</summary>

`docker ps` lists only running containers. The stopped container still exists with its configuration and writable layer; `docker ps -a` shows it as `Exited`. Only `docker rm` deletes it.

</details>

## Intermediate

### Q3. How would you check from the command line that a containerised web server is serving pages?

**Style:** How

<details>
<summary>Answer</summary>

Confirm it runs and which port is published (`docker ps`), request it from the host (`curl -i http://localhost:8081`), and read `docker logs` to see the request arrive. If the request fails, check the port mapping and whether the process inside listens on the expected port (`docker exec web ss -ltn` or the image documentation).

</details>
