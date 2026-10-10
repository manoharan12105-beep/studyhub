# Git Interview Questions: Advanced — Interview Questions

## Advanced

### Q1. Explain Git's object model.

**Style:** What happens internally

<details>
<summary>Answer</summary>

**Direct:** Four object types in a content-addressed store: blobs (file contents), trees (directories: names, modes, ids), commits (root tree, parents, author, committer, message) and annotated tags.

**Explanation:** Each id is a hash of the object's content, so identical content is stored once and any change produces a new id. Branches, tags and HEAD are refs outside the object store.

**Evidence:** `git cat-file -p HEAD`, `git ls-tree HEAD`.

**Follow-up:** "Where are file names stored?" — in trees.

</details>

### Q2. Why does rebasing change commit hashes?

**Style:** Why

<details>
<summary>Answer</summary>

**Direct:** A commit's hash covers its parent id; rebase gives each replayed commit a new parent, so each gets a new id — and so does every descendant.

**Explanation:** The old commits still exist (reachable via `ORIG_HEAD`/reflog) until garbage-collected.

**Risk:** Anyone who had the old commits now has diverged history — hence "don't rebase shared commits".

</details>

### Q3. How does the reflog let you recover "lost" commits?

**Style:** What happens internally

<details>
<summary>Answer</summary>

**Direct:** Every time HEAD or a branch moves, Git logs the old and new ids locally; commits removed from a branch remain in the object database and are listed there.

**Explanation:** `git reflog` shows entries like `reset: moving to HEAD~2`; `git reset --hard HEAD@{1}` or `git branch rescue <id>` restores them.

**Limits:** Local only; entries for unreachable commits expire (30 days by default) and `gc` then prunes; uncommitted work was never there.

</details>

### Q4. What does `--force-with-lease` actually check?

**Style:** What happens internally

<details>
<summary>Answer</summary>

**Direct:** That the remote branch still points to the commit your remote-tracking ref records (or a commit you name: `--force-with-lease=<ref>:<sha>`); otherwise the push fails with "stale info".

**Explanation:** A background `git fetch` updates the remote-tracking ref, so the lease can pass even if you never looked at the new commits; `--force-if-includes` additionally requires the remote tip to be in your branch's reflog history.

**Follow-up:** "What's the real protection?" — branch protection on the server.

</details>

### Q5. How does Git compute a three-way merge?

**Style:** What happens internally

<details>
<summary>Answer</summary>

**Direct:** It finds the merge base (best common ancestor) and compares each side's changes against it; changes on only one side are taken, identical changes are taken once, different changes to the same region conflict.

**Explanation:** The default `ort` strategy also detects renames; with several merge bases (criss-cross), it merges them into a virtual base first. During conflicts the index holds stages 1 (base), 2 (ours), 3 (theirs).

**Evidence:** `git merge-base A B`, `git ls-files -u`.

</details>

### Q6. If every commit is a snapshot, why is a Git repository small?

**Style:** Why

<details>
<summary>Answer</summary>

**Direct:** Unchanged files and directories reuse existing blobs and trees, everything is zlib-compressed, and packfiles store similar objects as deltas.

**Explanation:** A commit changing one file creates one blob, new trees along its path and one commit. In a measured example, older versions of a 18 KB file were stored as 24–37-byte deltas.

**Follow-up:** "Why are large binaries a problem?" — they compress and delta poorly and every clone gets all versions.

</details>

### Q7. What is detached HEAD internally, and how can work be lost there?

**Style:** What happens internally

<details>
<summary>Answer</summary>

**Direct:** `.git/HEAD` contains a commit id instead of `ref: refs/heads/<branch>`.

**Explanation:** New commits advance HEAD only; switching away leaves them referenced by no branch — only the reflog — so they're eventually garbage-collected.

**Fix:** `git switch -c <name>` before leaving, or `git branch <name> <id>` afterwards.

</details>

### Q8. How would you remove a file containing a secret from all of history?

**Style:** How

<details>
<summary>Answer</summary>

**Direct:** First revoke and rotate the secret. Then rewrite history with `git filter-repo --path <file> --invert-paths` (or BFG) on a fresh mirror clone and force-push all refs.

**Explanation:** Every commit after the first affected one gets a new id; everyone must re-clone; forks and caches keep old copies (contact GitHub support for cached views).

**Misconception:** Rewriting history makes a leaked secret safe — only rotation does.

</details>

### Q9. What are packfiles and what does `git gc` do?

**Style:** What

<details>
<summary>Answer</summary>

**Direct:** Packfiles store many objects in one file with delta compression; `git gc` packs loose objects and refs, expires old reflog entries and prunes unreachable objects past their expiry.

**Explanation:** Recently unreachable objects are kept (in a cruft pack) for about two weeks by default so recovery remains possible.

**Evidence:** `git count-objects -v`, `git verify-pack -v`.

</details>

### Q10. How does `git bisect` work, and what makes it reliable?

**Style:** How

<details>
<summary>Answer</summary>

**Direct:** Binary search over commits between a known good and bad commit; each test halves the range, so ~log₂ n steps.

**Explanation:** `git bisect run <script>` automates it using exit codes (0 good, 1–127 bad, 125 skip).

**Reliability:** Every commit must build and the test must detect only the target bug — atomic, buildable commits make bisect precise.

</details>

### Q11. Two developers' histories have diverged after one of them force-pushed. How do you reconcile without losing work?

**Style:** Scenario

<details>
<summary>Answer</summary>

**Direct:** Fetch, find both tips (`git reflog show origin/<branch>` for the pre-force tip), and identify which commits are unique to each side (`git log --left-right A...B`).

**Explanation:** Then rebuild: rebase your unique commits onto the new remote tip with `git rebase --onto origin/<branch> <old-base>`, or restore the old tip and re-apply the rewritten work; push with a lease; protect the branch afterwards.

</details>

### Q12. What does `git rev-parse` do, and when have you used it?

**Style:** What

<details>
<summary>Answer</summary>

**Direct:** It resolves any revision expression — branch, tag, `HEAD~2`, `main@{1}`, `HEAD:path`, `HEAD^{tree}` — to an object id, and reports repository facts (`--show-toplevel`, `--abbrev-ref HEAD`).

**Example:** In scripts: `version=$(git rev-parse --short HEAD)` for build metadata; `git rev-parse --abbrev-ref HEAD` for the branch name.

</details>

### Q13. Why can't the same branch be checked out in two worktrees?

**Style:** Why

<details>
<summary>Answer</summary>

**Direct:** Both working directories would advance the same ref, each with a stale view of the other's working tree and index, risking lost or confusing updates.

**Explanation:** Git refuses (`'main' is already used by worktree at …`); use `--detach` to inspect the same commit.

</details>

### Q14. What happens, object by object, when you run `git commit`?

**Style:** What happens internally

<details>
<summary>Answer</summary>

**Direct:** Git writes tree objects from the index (`write-tree`), writes a commit object with the root tree, the current HEAD as parent, identities, timestamps and message (`commit-tree`), then updates the current branch ref and appends to the reflog (`update-ref`).

**Explanation:** Blobs were already written at `git add` time; hooks (`pre-commit`, `commit-msg`) run around these steps in the porcelain command.

</details>
