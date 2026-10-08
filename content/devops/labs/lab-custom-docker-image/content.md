# Lab 02 — Build a Custom Docker Image

**Lab:** 02 · **Module:** Writing a Dockerfile · **Verification:** Instruction only

> [!NOTE]
> Run on your own machine. **Instruction only:** not executed when written; results are described.

## Objective

Write a Dockerfile, build an image from it, tag it, run it, change the content and rebuild — and watch the layer cache work.

## Prerequisites

- [Lab 01](../lab-first-docker-container/content.md) completed.
- Lesson: [Writing a Dockerfile](../../docker/dockerfile-fundamentals/content.md).

## Scenario

Your team's status page is a single HTML file. You package it with Nginx into an image, so it runs the same everywhere.

## Steps

### Step 1: Create the files

```bash
mkdir status-page && cd status-page
cat > index.html <<'EOF'
<!DOCTYPE html>
<html><head><title>Status</title></head>
<body><h1>All systems operational</h1></body></html>
EOF
cat > Dockerfile <<'EOF'
FROM nginx:1.30-alpine
COPY index.html /usr/share/nginx/html/index.html
EXPOSE 80
EOF
```

**Explanation:** the base image already contains Nginx and its start command (`CMD`); you only add your file. `EXPOSE 80` documents the port.

### Step 2: Build and inspect

```bash
docker build -t status-page:1.0 .
docker images status-page
docker history status-page:1.0
```

**Expected result:** the build lists the `FROM` and `COPY` steps and finishes with the image named `status-page:1.0`. `docker history` shows your `COPY` layer (a few hundred bytes) on top of the base image's layers.

### Step 3: Run it

```bash
docker run -d --name status -p 8082:80 status-page:1.0
curl -s http://localhost:8082
```

**Expected result:** your HTML with `All systems operational`.

### Step 4: Change and rebuild

```bash
sed -i 's/All systems operational/Maintenance at 22:00 UTC/' index.html
docker build -t status-page:1.1 .
docker rm -f status
docker run -d --name status -p 8082:80 status-page:1.1
curl -s http://localhost:8082
```

**Expected result:** the build reuses the base image layers (`CACHED` or already present) and rebuilds only the `COPY` step. The response now shows the maintenance message. Both tags `1.0` and `1.1` exist.

On macOS, use `sed -i '' 's/…/…/' index.html`.

### Step 5: Add a .dockerignore

```bash
echo "notes.txt" > .dockerignore
echo "internal notes" > notes.txt
docker build -t status-page:1.2 .
```

**Explanation:** `notes.txt` is excluded from the build context, so it can never be copied into the image by mistake.

### Step 6: Clean up

```bash
docker rm -f status
docker rmi status-page:1.0 status-page:1.1 status-page:1.2
```

## Verification Checklist

- ☐ `docker images status-page` showed your tags.
- ☐ The second build rebuilt only the `COPY` step.
- ☐ The running container served the changed page only after rebuilding and recreating it.

## Common Mistakes

- Editing `index.html` and expecting the running container to change — the image was copied at build time.
- `docker restart` instead of recreating the container from the new tag.
- Forgetting the `.` at the end of `docker build`.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `COPY failed: … not found` / `failed to compute cache key` | Run `docker build` in the folder that contains `index.html`, or check `.dockerignore` |
| Old page still shown | You ran the old tag or did not recreate the container: `docker ps` shows which image it uses |
| `port is already allocated` | Remove the old `status` container first |
