# Comparing Files: diff and comm

**Module:** Text Processing · **Interview priority:** Frequently asked

## What Is It?

| Command | Answers |
|---------|---------|
| `diff` | "What changed between these two files (or directories)?" — line by line, with instructions to turn one into the other |
| `comm` | "Which lines are only in A, only in B, or in both?" — for two **sorted** files |
| `cmp` | "Are these two files byte-for-byte identical, and where do they first differ?" (works on binary files) |

## Why It Matters

- Configuration drift: why does the staging server behave differently from production? `diff` the two config files.
- Code review and patches: `diff -u` output is the format of Git diffs and patch files.
- Set operations on lists: users in system A but not in system B, packages installed on one server but not another — `comm`.

## Commands

### diff

**Purpose:** compare two files line by line.

**Syntax:**

```text
diff [options] FILE1 FILE2
diff -r [options] DIR1 DIR2
```

| Option | Meaning |
|--------|---------|
| `-u` | Unified format (what Git and code reviews use) |
| `-y` | Side by side (`-W` sets the width) |
| `-q` | Only report **whether** files differ |
| `-r` | Compare directories recursively |
| `-i` | Ignore case |
| `-w` | Ignore all whitespace |
| `-B` | Ignore blank lines |

#### Normal format

```bash
diff v1.txt v2.txt
echo "status $?"
```

**Output:**

```text
1c1
< server.port=8080
---
> server.port=9090
3c3
< log.level=INFO
---
> log.level=DEBUG
4a5
> metrics.enabled=true
status 1
```

How to read it:

| Line | Meaning |
|------|---------|
| `1c1` | Line 1 of the first file must be **c**hanged into line 1 of the second |
| `< …` | A line from the first file |
| `> …` | A line from the second file |
| `4a5` | After line 4 of the first file, **a**dd line 5 of the second |
| `3d2` (not here) | **D**elete line 3 of the first file (the files would then line up at line 2) |

Exit status: `0` identical, `1` different, `2` trouble (such as a missing file).

#### Unified format

```bash
diff -u v1.txt v2.txt
```

**Output (varies):**

```text
--- v1.txt      2026-01-15 09:30:35.273541748 +0000
+++ v2.txt      2026-01-15 09:30:35.273541748 +0000
@@ -1,4 +1,5 @@
-server.port=8080
+server.port=9090
 server.host=localhost
-log.level=INFO
+log.level=DEBUG
 cache.enabled=false
+metrics.enabled=true
```

The header shows each file's name and modification time (hence "varies"). `@@ -1,4 +1,5 @@` means "lines 1–4 of the old file become lines 1–5 of the new file". Lines start with `-` (removed), `+` (added) or a space (unchanged context). This is exactly what `git diff` shows.

#### Side by side

```bash
diff -y -W 60 v1.txt v2.txt
```

**Output:**

```text
server.port=8080             |  server.port=9090
server.host=localhost           server.host=localhost
log.level=INFO               |  log.level=DEBUG
cache.enabled=false             cache.enabled=false
                             >  metrics.enabled=true
```

`|` marks a changed line, `>` a line only in the right file, `<` a line only in the left file.

#### Just tell me if they differ

```bash
diff -q v1.txt v2.txt
cp v1.txt v1-copy.txt
diff v1.txt v1-copy.txt && echo identical
```

**Output:**

```text
Files v1.txt and v2.txt differ
identical
```

#### Directories

```bash
cp -r config config-new
echo 'app.debug=true' >> config-new/app.conf
diff -r config config-new
```

**Output:**

```text
diff -r config/app.conf config-new/app.conf
7a8
> app.debug=true
```

Files that exist on only one side are reported as `Only in config-new: file`.

#### Ignoring case and whitespace

```bash
printf 'Hello  World\n' > a.txt
printf 'hello world\n' > b.txt
diff a.txt b.txt > /dev/null
echo "plain diff: $?"
diff -iw a.txt b.txt
echo "with -iw: $?"
```

**Output:**

```text
plain diff: 1
with -iw: 0
```

### patch

**Purpose:** apply a unified diff to a file — how changes travelled before Git, and still how patches are shared.

```bash
diff -u v1.txt v2.txt > change.patch
cp v1.txt target.txt
patch target.txt < change.patch
cat target.txt
```

**Output:**

```text
patching file target.txt
server.port=9090
server.host=localhost
log.level=DEBUG
cache.enabled=false
metrics.enabled=true
```

`patch -R` reverses a patch.

### comm

**Purpose:** compare two **sorted** files and print three columns:

```text
column 1: lines only in FILE1
column 2: lines only in FILE2        (indented one tab)
column 3: lines in both              (indented two tabs)
```

```bash
comm list1.txt list2.txt
```

**Output:**

```text
apple
                banana
cherry
        grape
                mango
        orange
```

Options **suppress** columns: `-1`, `-2`, `-3`. Combine them to get set operations:

| Command | Result | Set operation |
|---------|--------|---------------|
| `comm -12 A B` | Lines in both | Intersection |
| `comm -23 A B` | Lines only in A | A minus B |
| `comm -13 A B` | Lines only in B | B minus A |

```bash
comm -12 list1.txt list2.txt
comm -23 list1.txt list2.txt
comm -13 list1.txt list2.txt
```

**Output:**

```text
banana
mango
apple
cherry
grape
orange
```

`comm` requires sorted input and says so when it is not — and its results are then wrong:

```bash
comm -12 fruits.txt list1.txt
```

**Output:**

```text
banana
comm: file 1 is not in sorted order
cherry
mango
comm: input is not in sorted order
```

`apple` is in both files but is missing from the result, because `comm` walks both files in step and assumes they are sorted. Sort on the fly with process substitution: `comm -12 <(sort -u fruits.txt) list1.txt`.

### cmp

**Purpose:** byte-by-byte comparison; reports the first difference. Works for binary files (images, JARs, archives).

```bash
cmp v1.txt v2.txt
```

**Output:**

```text
v1.txt v2.txt differ: byte 13, line 1
```

`cmp -s` prints nothing and only sets the exit status — useful in scripts. For "is this download intact?", compare checksums instead: `sha256sum file`.

## Examples

### Users that exist on server A but not on server B

```bash
# Illustrative
cut -d: -f1 /etc/passwd | sort > users-a.txt        # on server A
cut -d: -f1 /etc/passwd | sort > users-b.txt        # on server B
comm -23 users-a.txt users-b.txt
```

### Compare a remote file without copying it first

```bash
# Illustrative
diff <(ssh web01 cat /etc/nginx/nginx.conf) <(ssh web02 cat /etc/nginx/nginx.conf)
```

`<( … )` (process substitution) presents a command's output as a file name.

## Comparison

### diff vs comm vs cmp

| | `diff` | `comm` | `cmp` |
|---|---|---|---|
| Input | Any two text files or directories | Two **sorted** text files | Any two files, including binary |
| Output | Edit instructions (normal, unified, side-by-side) | Three columns: only A, only B, both | First differing byte and line |
| Order matters? | Yes — lines are compared in sequence | Treats files as sorted sets | Byte positions |
| Typical use | Config changes, patches, code review | Set difference / intersection of lists | Binary equality |

## Common Mistakes

- Running `comm` (or `join`) on unsorted files — results are silently incomplete apart from the warning.
- Sorting with one locale and running `comm` with another; use `LC_ALL=C` for both.
- Reading `<` and `>` the wrong way round: `<` is the first file, `>` the second.
- Expecting `diff` to ignore whitespace or case by default.
- Using `diff` on binary files — it only says "Binary files … differ"; use `cmp` or checksums.

## Key Takeaways

- `diff A B`: `c` change, `a` add, `d` delete; `<` from A, `>` from B; exit 0 same, 1 different.
- `diff -u` is the unified format used by Git and `patch`; `-y` side by side; `-q` yes/no; `-r` directories; `-i`, `-w` to ignore case and whitespace.
- `comm` needs sorted input: `-12` intersection, `-23` only in A, `-13` only in B.
- `cmp` compares bytes, including binary files.
