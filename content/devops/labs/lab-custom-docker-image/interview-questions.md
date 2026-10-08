# Lab 02 — Interview Questions

## Beginner

### Q1. You changed a file used by your image. Why does the running container still serve the old version?

**Style:** Why

<details>
<summary>Answer</summary>

The file was copied into an image layer at build time; the container runs from that image. You must rebuild the image (new tag) and recreate the container from it — restarting the old container does not help.

</details>

## Intermediate

### Q2. Why did the rebuild finish in a second?

**Style:** How

<details>
<summary>Answer</summary>

The base image layers and every unchanged step were reused from the build cache; only the `COPY` step, whose input file changed, was executed again.

</details>

### Q3. What does `docker history` show and when is it useful?

**Style:** What

<details>
<summary>Answer</summary>

The layers of an image with the instruction that created each and its size. It helps find which step makes an image large, and it reveals values used in build steps — one reason never to pass secrets with `ARG` or `ENV`.

</details>
