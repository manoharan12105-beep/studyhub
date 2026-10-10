# Sparse Checkout, Partial Clone and Large-File Storage — Practice

### P1. Only one directory

**Difficulty:** Easy · **Type:** Command · **Concepts:** sparse checkout

In an existing clone, restrict the working directory to `src/main` (plus root files) using cone mode.

<details>
<summary>Answer</summary>

`git sparse-checkout set --cone src/main`

</details>

### P2. What did Git store?

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** LFS pointers

With `*.png` tracked by LFS, you commit a 300 KB image. What does `git cat-file -s HEAD:image.png` print, roughly, and why?

<details>
<summary>Answer</summary>

A small number (131 bytes in the lab) — Git's blob is the LFS pointer text, not the image. The image content is in `.git/lfs/objects` and on the LFS server.

</details>

### P3. Pick the technique

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** choosing

Match: (a) CI only needs the latest commit to build; (b) a developer in a 50-team monorepo works only in `services/grading`; (c) a project must version 2 GB of training images alongside code.

<details>
<summary>Answer</summary>

(a) Shallow clone (`--depth 1`) or blobless partial clone (b) Sparse checkout (often with a partial clone) (c) Git LFS — or store the dataset outside Git and reference a version.

</details>

### P4. Pointer text instead of images

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** LFS setup

After cloning, `docs/logo.png` opens as a text file starting with `version https://git-lfs.github.com/spec/v1`. What's wrong and how do you fix it?

<details>
<summary>Answer</summary>

Git LFS isn't installed or initialised on this machine, so the pointer wasn't replaced with real content. Install Git LFS, run `git lfs install`, then `git lfs pull` (or re-checkout) to download the files.

</details>
