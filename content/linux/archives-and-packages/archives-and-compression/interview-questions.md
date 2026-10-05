# Archives and Compression — Interview Questions

## Beginner

### Q1. Is `tar` a compression tool?

<details>
<summary>Answer</summary>

No. `tar` is an archiver: it bundles files and directories (with paths, permissions, owners and timestamps) into one file. A plain `.tar` is about the same size as the input. Compression is added with `z` (gzip), `j` (bzip2) or `J` (xz), producing `.tar.gz`, `.tar.bz2`, `.tar.xz`.

</details>

### Q2. How do you create and extract a `.tar.gz` archive?

<details>
<summary>Answer</summary>

Create: `tar -czvf archive.tar.gz dir/` (create, gzip, verbose, file). Extract: `tar -xzvf archive.tar.gz` — add `-C /target/dir` to extract elsewhere.

</details>

### Q3. How do you list the contents of an archive without extracting it?

<details>
<summary>Answer</summary>

`tar -tzf archive.tar.gz` (or `tar -tvf` for details); `unzip -l archive.zip` for zip files.

</details>

### Q4. What happens to the original file when you run `gzip file.txt`?

<details>
<summary>Answer</summary>

It is replaced by `file.txt.gz` (with the same timestamps and permissions). Use `gzip -k` to keep the original or `gzip -c file.txt > file.txt.gz` to write to stdout.

</details>

## Intermediate

### Q5. How do you read or search a compressed log without decompressing it?

<details>
<summary>Answer</summary>

`zcat app.log.gz` (print), `zless app.log.gz` (page), `zgrep ERROR app.log.gz` (search). For xz and bzip2 there are `xzcat`/`xzgrep` and `bzcat`/`bzgrep`.

</details>

### Q6. What is the difference between gzip, bzip2 and xz?

<details>
<summary>Answer</summary>

All compress single streams. gzip is fast with a good ratio and is universally available. bzip2 compresses better but more slowly. xz achieves the best ratio but is slowest to compress (decompression is reasonably fast), so it is popular for distributing software. zstd is a modern alternative that is both fast and efficient.

</details>

### Q7. When would you use zip instead of tar.gz?

<details>
<summary>Answer</summary>

When sharing with Windows or macOS users who expect `.zip`, or when you need random access to individual files without decompressing the whole archive. tar.gz is the Linux norm because it preserves ownership, permissions, symlinks and special files, and compresses the whole stream (better ratio for many small files).

</details>

### Q8. How do you extract a single file from a tar archive?

<details>
<summary>Answer</summary>

Name it as listed by `tar -tf`: `tar -xzf backup.tar.gz path/inside/archive/file.conf` (add `-C dir` to choose the destination, `-O` to print it to stdout instead of writing it).

</details>

## Advanced

### Q9. How do you copy a large directory to another server without creating a temporary archive?

<details>
<summary>Answer</summary>

Stream tar through SSH: `tar -czf - /data | ssh host 'tar -xzf - -C /restore'`. The `-` means stdout/stdin. `rsync -a` is usually better for repeated transfers because it copies only differences and can resume.

</details>

### Q10. A downloaded `.tar.gz` fails with "gzip: stdin: not in gzip format". What do you check?

<details>
<summary>Answer</summary>

Run `file archive.tar.gz`: it may be an uncompressed tar (extract with `tar -xf`), a different compression (`xz`, `bzip2`, `zip`), or not an archive at all — often an HTML error or login page saved by `curl`/`wget` without following redirects (`curl -L`). Also compare the file size and checksum with the published values.

</details>

### Q11. Why should you be careful extracting archives from untrusted sources?

<details>
<summary>Answer</summary>

Archives can contain absolute paths or `../` components that write outside the target directory ("zip slip"), symlinks pointing elsewhere, device files, or extremely high compression ratios that fill the disk ("zip bomb"). List contents first, extract as an unprivileged user into an empty directory, and rely on tools' protections (GNU tar strips leading `/` and refuses `..` members by default).

</details>
