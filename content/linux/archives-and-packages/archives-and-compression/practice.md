# Archives and Compression — Practice

All items start in `~/linux-lab`.

### P1. Read the flags

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** tar options

What does `tar -xzvf release.tar.gz` do?

- A) Creates a gzip-compressed archive named `release.tar.gz`
- B) Extracts a gzip-compressed archive, listing each file
- C) Lists the archive without extracting
- D) Compresses `release.tar` with gzip

<details>
<summary>Answer</summary>

**Answer:** B) Extracts a gzip-compressed archive, listing each file

**Explanation:** `x` extract, `z` gzip, `v` verbose, `f` archive file.

</details>

### P2. Archive the config

**Difficulty:** Easy · **Type:** Command · **Concepts:** tar -czf

Create `config-backup.tar.gz` containing the `config` directory, then list its contents.

<details>
<summary>Answer</summary>

```bash
tar -czf config-backup.tar.gz config
tar -tzf config-backup.tar.gz | sort
```

**Output:**

```text
config/
config/app.conf
config/db.conf
```

</details>

### P3. Restore elsewhere

**Difficulty:** Easy · **Type:** Output · **Concepts:** -C

What does the final `ls` print?

```bash
mkdir -p /tmp/lab-restore-$$
tar -xzf config-backup.tar.gz -C /tmp/lab-restore-$$
ls /tmp/lab-restore-$$/config
rm -r /tmp/lab-restore-$$
```

<details>
<summary>Answer</summary>

**Output:**

```text
app.conf  db.conf
```

`-C` extracts into the given directory; the archive's `config/` prefix is recreated there.

</details>

### P4. Where did my file go?

**Difficulty:** Easy · **Type:** Output · **Concepts:** gzip replaces the original

What does this print?

```bash
cp notes.txt n.txt
gzip n.txt
ls n.txt*
```

<details>
<summary>Answer</summary>

**Output:**

```text
n.txt.gz
```

`gzip` removed `n.txt` after compressing it.

</details>

### P5. Search inside

**Difficulty:** Medium · **Type:** Output · **Concepts:** zgrep, zcat

What do these print?

```bash
zcat n.txt.gz | wc -l
zgrep -ci linux n.txt.gz
```

<details>
<summary>Answer</summary>

**Output:**

```text
5
3
```

</details>

### P6. Leave out the big file

**Difficulty:** Medium · **Type:** Command · **Concepts:** --exclude

Archive `logs` into `small-logs.tar.gz` without `debug.log` and without anything in `archive/`, then list it.

<details>
<summary>Answer</summary>

```bash
tar -czf small-logs.tar.gz --exclude='debug.log' --exclude='logs/archive' logs
tar -tzf small-logs.tar.gz | sort
```

**Output:**

```text
logs/
logs/app-2026-01-01.log
logs/app-2026-01-08.log
logs/app-2026-01-14.log
```

</details>

### P7. Option order

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** f takes the next argument

`tar -cfz backup.tar.gz project` creates a strange file named `z` and an error. Explain and fix.

<details>
<summary>Answer</summary>

`f` takes the **next** argument as the archive name, so tar created an archive called `z` from `backup.tar.gz` (missing) and `project`. Put `f` last in the option cluster: `tar -czf backup.tar.gz project`.

</details>

### P8. Is it really gzip?

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** file, broken downloads

`curl -o app.tar.gz https://example.com/download/app` succeeds, but `tar -xzf app.tar.gz` prints `gzip: stdin: not in gzip format`. Describe how you investigate.

<details>
<summary>Answer</summary>

Run `file app.tar.gz` and `head -c 300 app.tar.gz`. If it is HTML, the server returned an error page or a redirect page — download again with `curl -fL -o app.tar.gz URL` (`-L` follows redirects, `-f` fails on HTTP errors instead of saving the error body). If it is another format (xz, plain tar, zip), use the matching tool. Finally verify the published checksum with `sha256sum app.tar.gz`.

</details>
