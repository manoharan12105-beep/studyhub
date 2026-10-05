# Archives and Compression: tar, gzip and zip

**Module:** Archives and Package Management · **Interview priority:** Core

## What Is It?

Two different jobs that are often combined:

- **Archiving** bundles many files and directories into **one** file, preserving paths, permissions, owners and timestamps. Tool: `tar` (tape archive). A plain `.tar` is **not** smaller than its contents.
- **Compression** makes a single stream of data smaller. Tools: `gzip` (`.gz`), `bzip2` (`.bz2`), `xz` (`.xz`), `zstd` (`.zst`). They compress **one file**, not directories.

`tar` can call a compressor for you, producing the familiar `.tar.gz` (also `.tgz`):

```text
project/  ──tar──►  project.tar  ──gzip──►  project.tar.gz
(many files)        (one file, same size)    (one file, smaller)

tar -czf project.tar.gz project      ← both steps in one command
```

`zip` does both jobs in one format and is common for exchanging files with Windows users.

## Why It Matters

- Backups, releases and log archiving all produce `.tar.gz` files; deployments and software downloads ship them.
- Rotated logs are gzipped; you need to read them without unpacking (`zcat`, `zgrep`, `zless`).
- Interview classics: `tar -czvf` vs `tar -xzvf`, "is tar compression?", list an archive's contents, extract to a directory.

## Core Concept

### tar options

`tar` needs exactly one **mode** plus modifiers. `f` must be followed by the archive name.

| Option | Meaning |
|--------|---------|
| `c` | **C**reate an archive |
| `x` | E**x**tract |
| `t` | Lis**t** contents |
| `f FILE` | Archive **f**ile name (use `-` for stdin/stdout) |
| `v` | **V**erbose: list files as they are processed |
| `z` | Compress/decompress with gzip (`.tar.gz`, `.tgz`) |
| `j` | bzip2 (`.tar.bz2`) |
| `J` | xz (`.tar.xz`) |
| `C DIR` | Change to `DIR` first (extract into it, or archive relative to it) |
| `--exclude=PATTERN` | Skip matching files |
| `-p` | Preserve permissions on extract (default for root) |

Read `tar -czvf project.tar.gz project` as: **c**reate, g**z**ip, **v**erbose, **f**ile `project.tar.gz`, from `project`. Extraction is the same with `x`: `tar -xzvf project.tar.gz`. Modern GNU tar detects compression automatically on extract and list, so `tar -xf file.tar.gz` also works.

### Compressors compared

| Tool | Extension | Speed | Ratio | Notes |
|------|-----------|-------|-------|-------|
| `gzip` | `.gz` | Fast | Good | Universal default; `-1` (fast) … `-9` (best) |
| `bzip2` | `.bz2` | Slow | Better | Older; may not be installed on minimal systems |
| `xz` | `.xz` | Slowest to compress | Best | Common for software releases |
| `zstd` | `.zst` | Very fast | Very good | Increasingly used (package formats, backups) |
| `zip` | `.zip` | Fast | Good | Archive + compression; Windows-friendly; stores no Unix owners |

## Commands

### Create and list a tar archive

```bash
tar -cvf project.tar project | sort
```

**Output:**

```text
project/
project/.gitignore
project/build.sh
project/docs/
project/docs/design.md
project/readme.md
project/src/
project/src/Main.java
project/src/Order.java
project/src/OrderService.java
project/src/PaymentService.java
project/test/
project/test/OrderServiceTest.java
```

`v` printed each file (sorted here for a stable order). Hidden files such as `.gitignore` are included — tar archives the whole directory.

List the contents without extracting:

```bash
tar -tf project.tar | head -n 3
```

**Output (varies):**

```text
project/
project/build.sh
project/src/
```

(The order follows the directory order on disk and can differ on your machine.)

### Compressed archives: `tar -czf`

```bash
tar -czf project.tar.gz project
ls -lh project.tar project.tar.gz | awk '{print $5, $9}'
```

**Output (varies):**

```text
20K project.tar
596 project.tar.gz
```

The `.tar` is larger than the source files (it stores headers in 512-byte blocks); the `.tar.gz` is a fraction of it. `file` tells them apart:

```bash
file project.tar project.tar.gz
```

**Output (varies):**

```text
project.tar:    POSIX tar archive (GNU)
project.tar.gz: gzip compressed data, from Unix, original size modulo 2^32 20480
```

### Extract: `tar -xzf`, into a directory with `-C`

```bash
mkdir restore
tar -xzf project.tar.gz -C restore
ls restore/project
```

**Output:**

```text
build.sh  docs  readme.md  src  test
```

Extract a single file:

```bash
tar -xzvf project.tar.gz -C restore project/readme.md
```

**Output:**

```text
project/readme.md
```

The member name must match what `tar -tf` lists.

> [!CAUTION]
> Extracting overwrites existing files with the same names without asking. List the archive first (`tar -tf`) and extract into an empty directory (`-C`) when unsure — especially with archives from others, which might contain absolute paths or `../` entries (GNU tar strips leading `/` and refuses `..` by default, but other tools may not).

### Exclude files

```bash
tar -czf logs.tar.gz --exclude='*.gz' logs
tar -tzf logs.tar.gz | sort
```

**Output:**

```text
logs/
logs/app-2026-01-01.log
logs/app-2026-01-08.log
logs/app-2026-01-14.log
logs/archive/
logs/debug.log
```

The already-compressed archive in `logs/archive` was skipped.

### gzip and gunzip: single files

```bash
cp app.log copy.log
gzip copy.log
ls copy.log*
gzip -l copy.log.gz
```

**Output:**

```text
copy.log.gz
         compressed        uncompressed  ratio uncompressed_name
                389                 765  52.7% copy.log
```

`gzip` **replaces** the original with the `.gz` file. Read it without decompressing:

```bash
zcat copy.log.gz | head -n 2
zgrep -c ERROR copy.log.gz
```

**Output:**

```text
2026-01-15 09:00:01 INFO  [main] Application starting
2026-01-15 09:00:02 INFO  [main] Loading configuration from config/app.conf
3
```

`zless` pages through it. Decompress:

```bash
gunzip copy.log.gz
ls copy.log*
```

**Output:**

```text
copy.log
```

`gunzip` = `gzip -d`. Keep the original while compressing with `-k`, or write to stdout with `-c`:

```bash
gzip -k app.log
ls app.log*
```

**Output:**

```text
app.log  app.log.gz
```

Repetitive data compresses extremely well:

```bash
gzip -c logs/debug.log > debug.log.gz
ls -lh logs/debug.log debug.log.gz | awk '{print $5, $9}'
```

**Output (varies):**

```text
9.1K debug.log.gz
3.0M logs/debug.log
```

### zip and unzip

```bash
zip -r config.zip config
unzip -l config.zip
```

**Output (varies):**

```text
  adding: config/ (stored 0%)
  adding: config/db.conf (stored 0%)
  adding: config/app.conf (deflated 14%)
Archive:  config.zip
  Length      Date    Time    Name
---------  ---------- -----   ----
        0  2026-01-15 09:30   config/
       40  2026-01-15 09:30   config/db.conf
      119  2026-01-15 09:30   config/app.conf
---------                     -------
      159                     3 files
```

`-r` is required to include directory contents. Extract into a directory:

```bash
mkdir unz
unzip -q config.zip -d unz
ls unz/config
```

**Output:**

```text
app.conf  db.conf
```

`zip` and `unzip` are separate packages on some minimal systems (`sudo apt install zip unzip`).

### When things go wrong

```bash
tar -xzf nosuch.tar.gz
```

**Output:**

```text
tar (child): nosuch.tar.gz: Cannot open: No such file or directory
tar (child): Error is not recoverable: exiting now
tar: Child returned status 2
tar: Error is not recoverable: exiting now
```

`gzip: stdin: not in gzip format` means the file is not actually gzipped (for example a plain `.tar` named `.tar.gz`, or an HTML error page saved by a failed download) — check with `file`.

## Examples

### Dated backup of a directory

```bash
# Illustrative
tar -czf "/backup/etc-$(date +%F).tar.gz" -C / etc
```

`-C /` with `etc` stores paths as `etc/…` (relative), so the archive can be restored anywhere.

### Copy a directory tree to another server through a pipe

```bash
# Illustrative
tar -czf - project | ssh backup01 'tar -xzf - -C /srv/backups'
```

`f -` writes the archive to stdout on one side and reads it from stdin on the other — no temporary file.

### Compress old logs, keep reading them

```bash
# Illustrative
find /var/log/myapp -name '*.log' -mtime +1 -exec gzip {} +
zgrep 'OutOfMemoryError' /var/log/myapp/*.log.gz
```

## Comparison

### tar vs gzip vs zip

| | `tar` | `gzip` | `zip` |
|---|---|---|---|
| Bundles many files | Yes | No (one file only) | Yes |
| Compresses | Only with `z`/`j`/`J` | Yes | Yes |
| Keeps Unix permissions and owners | Yes | — (single file) | Permissions partly; no owners |
| Original file after running | Kept | **Replaced** (unless `-k`/`-c`) | Kept |
| Typical use | Backups, releases, Linux transfers | Logs, single files, tar streams | Sharing with Windows users |

### Create vs extract

| Task | Command |
|------|---------|
| Create `.tar.gz` | `tar -czvf out.tar.gz dir/` |
| Extract `.tar.gz` | `tar -xzvf out.tar.gz` |
| Extract into a directory | `tar -xzf out.tar.gz -C /target` |
| List contents | `tar -tzf out.tar.gz` |
| Compress a single file | `gzip file` (→ `file.gz`) |
| Decompress | `gunzip file.gz` or `gzip -d file.gz` |
| Zip a directory | `zip -r out.zip dir/` |
| Unzip | `unzip out.zip -d /target` |

## Common Mistakes

- Believing a `.tar` file is compressed.
- Putting options after `f` in the wrong order: `tar -cfz out.tar.gz dir` makes `z` the archive name. Keep `f` last in the cluster: `-czf out.tar.gz`.
- Forgetting the archive name entirely, or archiving the archive into itself (`tar -czf backup.tar.gz .` inside the same directory).
- Running `gzip` on a file and being surprised that the original is gone.
- Trying to `gzip` a directory (use `tar -czf` or `gzip -r`, which compresses each file separately).
- Extracting into the current directory and overwriting files.
- Expecting `zip` to preserve Linux ownership.

## Key Takeaways

- tar archives (bundles); gzip/bzip2/xz compress; `.tar.gz` does both.
- Create `tar -czvf out.tar.gz dir`, extract `tar -xzvf out.tar.gz [-C dir]`, list `tar -tzf out.tar.gz`.
- `gzip` replaces the file (`-k` keeps it); `gunzip` reverses it; `zcat`, `zgrep`, `zless` read `.gz` directly.
- `zip -r out.zip dir` / `unzip out.zip -d dir` for cross-platform sharing.
- List before extracting; extract into a clean directory.
