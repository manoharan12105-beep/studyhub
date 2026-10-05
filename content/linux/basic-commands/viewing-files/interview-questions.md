# Viewing Files — Interview Questions

## Beginner

### Q1. What is the difference between `cat`, `less` and `more`?

<details>
<summary>Answer</summary>

`cat` prints the whole file at once (and can join several files). `less` and `more` are pagers that show one screen at a time. `less` scrolls both ways, searches with `/` and `?`, and opens large files instantly; `more` is older and mostly forward-only. For anything longer than a screen, use `less`.

</details>

### Q2. How do you see the last 50 lines of a log file?

<details>
<summary>Answer</summary>

`tail -n 50 file.log`. Add `-f` to keep watching new lines as they arrive.

</details>

### Q3. How do you watch a log file in real time?

<details>
<summary>Answer</summary>

`tail -f app.log` prints new lines as they are written; `Ctrl+C` stops it. `tail -F` also handles log rotation. `less +F app.log` does the same inside `less`, where `Ctrl+C` lets you scroll and search, and `F` resumes following. For systemd services: `journalctl -u name -f`.

</details>

### Q4. How do you print only the first line of a file?

<details>
<summary>Answer</summary>

`head -n 1 file` (or `head -1 file`). Common for checking a CSV header.

</details>

### Q5. What does the `file` command do?

<details>
<summary>Answer</summary>

It determines a file's type by examining its content ("magic" byte patterns, text encoding), not its extension — for example ASCII text, a shell script, an ELF executable, gzip data or a directory. Linux does not use extensions to decide how to treat a file.

</details>

## Intermediate

### Q6. How do you print lines 20 to 30 of a file?

<details>
<summary>Answer</summary>

`head -n 30 file | tail -n 11` (lines 20–30 inclusive is 11 lines), or `sed -n '20,30p' file`, or `awk 'NR>=20 && NR<=30' file`. `sed` and `awk` stop being clumsy when the range is in variables.

</details>

### Q7. What is the difference between `tail -f` and `tail -F`?

<details>
<summary>Answer</summary>

`tail -f` follows the open file descriptor. When a log is rotated (renamed to `app.log.1` and a new `app.log` created), it keeps reading the old file and shows nothing new. `tail -F` follows the **name**: it notices the file was replaced and reopens it, retrying if it temporarily does not exist.

</details>

### Q8. What do atime, mtime and ctime mean?

<details>
<summary>Answer</summary>

**atime**: last access (read). **mtime**: last modification of the content. **ctime**: last change of the inode — metadata such as permissions, owner or link count, and also content changes. ctime is not creation time; some filesystems record creation separately as "birth time", shown by `stat`.

</details>

### Q9. A config file looks correct but the application rejects a value. How do you check for invisible problems?

<details>
<summary>Answer</summary>

`cat -A file` shows tabs as `^I`, line ends as `$`, and Windows carriage returns as `^M` — trailing spaces and CRLF line endings are the usual culprits. Fix CRLF with `dos2unix file` or `sed -i 's/\r$//' file`. `file` also reports "with CRLF line terminators".

</details>

## Advanced

### Q10. Why should you avoid `cat` on a 10 GB log, and what do you use instead?

<details>
<summary>Answer</summary>

`cat` streams all 10 GB to the terminal — slow, useless to read, and it ties up the session. Use `less` (opens immediately, reads only what is displayed, searches), `tail -n 1000` for recent entries, or `grep`/`awk` to extract matching lines. If the problem is the size itself, see who is writing and set up rotation.

</details>

### Q11. Your terminal shows garbage characters after you accidentally `cat` a binary file. What happened and how do you fix it?

<details>
<summary>Answer</summary>

The binary data contained terminal control sequences that changed the terminal's character set or modes. Typing `reset` (even if the characters you type look garbled) and pressing Enter reinitialises the terminal; `stty sane` restores line settings. Next time check with `file` first or use `less`, which warns about binary files.

</details>
