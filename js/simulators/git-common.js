// Shared, DOM-free models for the Git & GitHub Mastery interactions.
//
//   COMMANDS            the command explorer's reference data
//   graph model         commits, branches, HEAD and the operations that change them
//                       (commit, branch, switch, merge, rebase, cherry-pick, reset,
//                       revert, fetch, pull) — used by the branch visualizer and
//                       the command predictor
//   areas model         working directory, index, local repository and remote for
//                       the repository state simulator
//   TROUBLE_SCENARIOS   decision scenarios for the troubleshooting simulator
//
// Everything here is a StudyHub simulation with fixed rules: nothing runs Git.
// The behaviour mirrors what the lessons demonstrate with real Git output, and
// the module is checked with Node (no DOM access here).

// ---------------------------------------------------------------- commands

export const SAFETY = {
  safe: { label: 'Safe anywhere', note: 'Read-only: inspects, never changes anything.' },
  local: { label: 'Changes local state', note: 'Changes your repository or files; easy to undo.' },
  risky: { label: 'Practice repository first', note: 'Can discard uncommitted work or rewrite history.' },
  remote: { label: 'Changes the remote', note: 'Affects the shared repository and your teammates.' },
};

export const CATEGORIES = ['Basics', 'Inspection', 'Branching', 'Remotes', 'Recovery', 'Collaboration', 'Advanced'];

const C = (category, name, syntax, purpose, options, example, effect, mistake, safety, topic) =>
  ({ category, name, syntax, purpose, options, example, effect, mistake, safety, topic });

export const COMMANDS = [
  C('Basics', 'git init', 'git init [-b <branch>] [<dir>]', 'Create a new, empty repository.', ['-b <name>: name of the first branch', '--bare: repository without a working tree'], 'git init', 'Creates .git/; files stay untracked; the first branch appears with the first commit.', 'Running it in the wrong folder (e.g. your home directory).', 'local', 'creating-repositories'),
  C('Basics', 'git clone', 'git clone <url> [<dir>]', 'Copy a repository with its full history.', ['-b <branch>: check out another branch', '--depth <n>: shallow clone', '--recurse-submodules'], 'git clone https://github.com/your-org/gradebook.git', 'New folder with full history, an origin remote, remote-tracking branches and the default branch checked out.', 'Downloading a ZIP instead — no history, no remote.', 'safe', 'creating-repositories'),
  C('Basics', 'git config', 'git config [--global] <key> [<value>]', 'Read or set configuration (identity, editor, defaults).', ['--global / --local: level', '--show-origin: which file sets a value', '--unset: remove a value'], 'git config --global user.email "priya@example.com"', 'Writes ~/.gitconfig or .git/config; affects future commits only.', 'Forgetting that a local value overrides the global one.', 'local', 'git-configuration'),
  C('Basics', 'git status', 'git status [-s] [-b]', 'Show branch, staged, unstaged and untracked changes, and operations in progress.', ['-s: short two-column format', '-b: branch and ahead/behind line', '--ignored: list ignored files'], 'git status -sb', 'None.', 'Trusting ahead/behind without fetching first.', 'safe', 'git-status-and-add'),
  C('Basics', 'git add', 'git add [-A | -u | -p] <pathspec>', 'Copy changes into the staging area for the next commit.', ['-A: all changes in the repository', '-u: tracked files only', '-p: choose hunks', '-n: dry run'], 'git add src/main/java/com/example/gradebook/GradeCalculator.java', 'Writes blobs and updates the index; nothing is committed.', 'git add . without looking — stages stray files or secrets.', 'local', 'git-status-and-add'),
  C('Basics', 'git commit', 'git commit [-m <msg>] [-a] [--amend]', 'Record the staged snapshot as a new commit.', ['-m: message', '-a: stage tracked modifications first', '-v: show the diff in the editor', '--amend: replace the last commit'], 'git commit -m "Add D grade for averages from 50 to 59"', 'Creates a commit and moves the current branch to it.', 'Expecting unstaged edits to be included; amending a pushed commit.', 'local', 'git-commit'),
  C('Basics', 'git diff', 'git diff [--staged] [<a> [<b>]] [-- <path>]', 'Show line-by-line differences.', ['--staged: index vs HEAD', '--stat: summary', '--word-diff: in-line changes', '-w: ignore whitespace'], 'git diff --staged', 'None.', 'Using plain git diff after staging and seeing nothing.', 'safe', 'git-diff'),
  C('Basics', 'git rm', 'git rm [--cached] [-r] <path>', 'Delete (or untrack) a tracked file and stage it.', ['--cached: keep the file on disk', '-r: directories', '-f: force (discards uncommitted edits)'], 'git rm --cached .env', 'Stages the deletion; with --cached the file stays on disk, untracked.', 'Thinking --cached removes the file from history.', 'local', 'git-rm-and-mv'),
  C('Basics', 'git mv', 'git mv <source> <destination>', 'Rename or move a tracked file and stage it.', ['-f: overwrite the destination'], 'git mv App.java GradebookApp.java', 'Stages a rename; Git detects renames by similarity.', 'Renaming and rewriting a file in the same commit.', 'local', 'git-rm-and-mv'),
  C('Inspection', 'git log', 'git log [<options>] [<range>] [-- <path>]', 'List commits reachable from HEAD or given revisions.', ['--oneline --graph --decorate --all', '--author / --since (with a time) / --grep', '-S <string> / -G <regex>', '--follow -- <file>'], 'git log --oneline --graph --decorate --all', 'None.', 'Date-only --since uses the current time of day.', 'safe', 'git-log'),
  C('Inspection', 'git show', 'git show [<commit>] | git show <commit>:<path>', 'Show one commit with its diff, or a file at a commit.', ['--stat / --name-status', '--format=…'], 'git show 8ddf4ed:README.md', 'None.', 'Expecting a merge commit to show the feature diff.', 'safe', 'git-show-and-comparing'),
  C('Inspection', 'git blame', 'git blame [-L <from>,<to>] [-w] <file>', 'Annotate each line with the commit that last changed it.', ['-L: line range or :function', '-w: ignore whitespace', '-C: detect moved/copied lines', '--ignore-rev <hash>'], 'git blame -L 18,26 src/main/java/com/example/gradebook/GradeCalculator.java', 'None.', 'Using blame to assign fault instead of finding context.', 'safe', 'git-blame'),
  C('Inspection', 'git grep', 'git grep [-n] [-e <pattern>] [<commit>] [-- <path>]', 'Search tracked file contents, now or at any commit.', ['-n: line numbers', '-c: counts', '--and / -e: combine patterns'], 'git grep -n letterGrade', 'None.', 'grep -r in a Maven project floods results with target/.', 'safe', 'searching-code-and-history'),
  C('Inspection', 'git rev-parse', 'git rev-parse <rev>', 'Resolve any revision name to a commit id.', ['--short', '--abbrev-ref HEAD', '--show-toplevel'], 'git rev-parse --abbrev-ref HEAD', 'None.', 'Reading .git/refs files directly in scripts (refs may be packed).', 'safe', 'head-and-relative-references'),
  C('Inspection', 'git reflog', 'git reflog [show <ref>]', 'Show where HEAD and branches have pointed in this clone.', ['-n <count>', 'show origin/main: a remote-tracking ref\'s history'], 'git reflog -10', 'None.', 'Expecting it to contain uncommitted work or other clones\' history.', 'safe', 'git-reflog'),
  C('Branching', 'git branch', 'git branch [-v] [-a] [-d | -D] [<name>] [<start>]', 'List, create, rename or delete branches.', ['-vv: upstream and ahead/behind', '-m: rename', '-d: delete if merged', '-D: force delete'], 'git branch -vv', 'Creating/deleting moves pointers only; -D on unmerged work strands commits (recoverable via reflog for a while).', 'Habitual -D.', 'local', 'branches-fundamentals'),
  C('Branching', 'git switch', 'git switch [-c <new>] [--detach] <branch>', 'Change branches (Git 2.23+).', ['-c: create and switch', '-: previous branch', '--detach <commit>'], 'git switch -c feature/class-report', 'Moves HEAD; updates the index and files; uncommitted changes travel along unless they collide.', 'Expecting uncommitted changes to stay on the old branch.', 'local', 'git-switch-and-checkout'),
  C('Branching', 'git checkout', 'git checkout <branch> | git checkout [<commit>] -- <path>', 'Older command: switch branches or overwrite files.', ['-b <new>: create and switch', '-- <path>: overwrite the file'], 'git checkout -b fix/rounding', 'Path form overwrites files without asking.', 'git checkout <file> discards unstaged edits.', 'risky', 'git-switch-and-checkout'),
  C('Branching', 'git merge', 'git merge [--no-ff | --ff-only] [--squash] <branch>', 'Integrate another branch into the current one.', ['--no-ff: always a merge commit', '--ff-only: refuse unless fast-forward', '--abort: cancel a conflicted merge'], 'git merge feature/class-report', 'Fast-forward or a two-parent merge commit; may stop on conflicts.', 'Merging in the wrong direction.', 'local', 'merging-branches'),
  C('Branching', 'git rebase', 'git rebase [-i] <base>', 'Replay the current branch\'s commits on top of another base.', ['-i: edit the todo list', '--continue / --skip / --abort', '--autosquash', '--onto'], 'git rebase main', 'Creates new commits with new ids; old ones reachable only via reflog/ORIG_HEAD.', 'Rebasing commits others already have.', 'risky', 'git-rebase'),
  C('Branching', 'git cherry-pick', 'git cherry-pick [-x] <commit>…', 'Copy a commit\'s change onto the current branch.', ['-x: record the source commit', '--continue / --abort'], 'git cherry-pick -x a9f609c', 'Adds a new commit with the same change.', 'Cherry-picking a whole branch instead of merging.', 'local', 'git-cherry-pick'),
  C('Remotes', 'git remote', 'git remote [-v] | add | remove | rename | set-url', 'Manage the names and URLs of other repositories.', ['-v: show URLs', 'set-url: change HTTPS/SSH', 'show <name>: details'], 'git remote add upstream https://github.com/your-org/gradebook.git', 'Local configuration only.', 'Embedding credentials in the URL.', 'local', 'remotes-and-origin'),
  C('Remotes', 'git fetch', 'git fetch [<remote>] [--prune]', 'Download new commits and update remote-tracking branches.', ['--prune: drop deleted remote branches', '--all: every remote', '--tags'], 'git fetch origin', 'Updates origin/* only; your branches and files are untouched.', 'Expecting fetch to update your code.', 'safe', 'git-fetch-and-pull'),
  C('Remotes', 'git pull', 'git pull [--rebase | --no-rebase | --ff-only]', 'Fetch, then integrate the upstream into the current branch.', ['--rebase: replay local commits', '--ff-only: refuse unless fast-forward', '--autostash'], 'git pull --rebase', 'Moves your branch; may create a merge commit or conflicts.', 'Pulling after rebasing an already pushed branch.', 'local', 'git-fetch-and-pull'),
  C('Remotes', 'git push', 'git push [-u] [<remote> [<branch>]]', 'Upload commits and move the remote branch (fast-forward only by default).', ['-u: set upstream', '--force-with-lease: replace if unchanged', '--delete <branch>', '--follow-tags'], 'git push -u origin feature/class-report', 'Changes the shared repository; CI may run.', 'Using --force to get past a rejection.', 'remote', 'git-push-and-upstream'),
  C('Remotes', 'git push --force-with-lease', 'git push --force-with-lease[=<ref>:<expect>]', 'Replace a remote branch only if it is still where you last saw it.', ['=<ref>:<sha>: pin the expected commit', '--force-if-includes: stronger check'], 'git push --force-with-lease', 'Rewrites the remote branch; refused as "stale info" if someone pushed.', 'Assuming it is safe after a background fetch.', 'remote', 'push-rejection-and-divergence'),
  C('Remotes', 'git ls-remote', 'git ls-remote [--heads | --tags] <remote>', 'Ask a remote what refs it has right now.', ['--heads', '--tags'], 'git ls-remote --tags origin', 'None (contacts the remote).', 'Confusing it with your possibly stale origin/* refs.', 'safe', 'git-tags'),
  C('Recovery', 'git restore', 'git restore [--source=<commit>] [--staged] [--worktree] <path>', 'Discard edits, unstage, or bring back a file from a commit.', ['--staged: unstage', '--source=<commit>: take content from a commit', '-p: per hunk'], 'git restore --staged pom.xml', 'Without --staged it overwrites the working file — unstaged edits are lost.', 'Using git restore <file> when you meant to unstage.', 'risky', 'git-restore'),
  C('Recovery', 'git reset --soft', 'git reset --soft <commit>', 'Move the branch back; keep changes staged.', ['HEAD~1: undo the last commit'], 'git reset --soft HEAD~3', 'Branch moves; index and files unchanged.', 'Resetting a pushed branch.', 'local', 'git-reset'),
  C('Recovery', 'git reset --hard', 'git reset --hard <commit>', 'Move the branch and make index and files match.', ['ORIG_HEAD / HEAD@{1}: undo a previous reset', '--keep: safer alternative'], 'git reset --hard HEAD@{1}', 'Discards uncommitted changes to tracked files permanently.', 'Running it without checking git status first.', 'risky', 'git-reset'),
  C('Recovery', 'git revert', 'git revert [-m 1] <commit>', 'Add a commit that undoes an earlier one.', ['-m 1: revert a merge', '--no-commit: combine several', '--no-edit'], 'git revert 3a070e0', 'Adds a commit; history preserved; safe on shared branches.', 'Re-merging a reverted branch and expecting the old commits back.', 'local', 'git-revert'),
  C('Recovery', 'git stash', 'git stash push [-u] [-m <msg>] | list | pop | apply | drop', 'Shelve uncommitted work and restore it later.', ['-u: include untracked files', '--index: restore staged state', 'branch <name>: apply on a new branch'], 'git stash push -u -m "class report WIP"', 'Cleans the working tree; work saved as stash commits (local only).', 'Forgetting -u; letting stashes pile up.', 'local', 'git-stash'),
  C('Recovery', 'git clean', 'git clean -n | -f [-d] [-x]', 'Delete untracked files.', ['-n: dry run (always first)', '-d: directories', '-x: also ignored files'], 'git clean -nd', 'Permanently deletes files Git never stored.', 'git clean -fdx deleting .env and local config.', 'risky', 'safe-recovery-workflows'),
  C('Recovery', 'git fsck', 'git fsck [--unreachable] [--lost-found]', 'Check the object database; find unreachable commits and blobs.', ['--unreachable --no-reflogs', '--lost-found: write dangling objects to .git/lost-found'], 'git fsck --unreachable --no-reflogs', 'None (--lost-found writes copies only).', 'Expecting file names for dangling blobs.', 'safe', 'git-reflog'),
  C('Collaboration', 'git tag', 'git tag [-a -m <msg>] <name> [<commit>]', 'Mark a commit, usually a release.', ['-a: annotated', '-l --sort=v:refname', '-d: delete locally'], 'git tag -a v1.0.0 -m "gradebook 1.0.0"', 'Creates a ref (and a tag object if annotated); not pushed automatically.', 'Moving a published tag.', 'local', 'git-tags'),
  C('Collaboration', 'git describe', 'git describe [--tags]', 'Name the current commit relative to the nearest tag.', ['--tags: include lightweight tags', '--abbrev=0: tag only'], 'git describe', 'None.', 'Expecting it to use lightweight tags by default.', 'safe', 'git-tags'),
  C('Collaboration', 'gh pr create', 'gh pr create [--draft] [--fill] [--base <branch>]', 'Open a pull request from the terminal (GitHub CLI).', ['--draft', '--fill: title/body from commits', '--base'], 'gh pr create --base main --fill', 'Creates a pull request on GitHub.', 'Opening against the wrong base branch.', 'remote', 'pull-requests-fundamentals'),
  C('Collaboration', 'git range-diff', 'git range-diff <old-range> <new-range>', 'Compare two versions of a series of commits (e.g. before and after a rebase).', ['<base>..<old> <base>..<new>'], 'git range-diff backup~2..backup HEAD~2..HEAD', 'None.', 'Comparing ranges with the wrong bases.', 'safe', 'git-rebase'),
  C('Advanced', 'git bisect', 'git bisect start <bad> <good> | good | bad | skip | run <cmd> | reset', 'Binary-search history for the first bad commit.', ['run <script>: automate (0 good, 1–127 bad, 125 skip)', 'skip', 'reset'], 'git bisect run sh ../check-b-boundary.sh', 'Checks out commits (detached HEAD) until reset.', 'Forgetting git bisect reset.', 'local', 'git-bisect'),
  C('Advanced', 'git worktree', 'git worktree add [-b <new>] <path> [<commit>] | list | remove', 'Check out another branch in a separate folder.', ['-b: new branch', '--detach', 'prune'], 'git worktree add -b hotfix/1.0.1 ../gradebook-hotfix v1.0.0', 'New working directory sharing the repository.', 'Deleting worktree folders by hand.', 'local', 'git-worktrees'),
  C('Advanced', 'git submodule', 'git submodule add <url> <path> | update --init | status', 'Embed another repository pinned to a commit.', ['update --init --recursive', 'update --remote'], 'git submodule update --init --recursive', 'Changes the pinned commit pointer, which must be committed.', 'Cloning without --recurse-submodules.', 'local', 'git-submodules'),
  C('Advanced', 'git sparse-checkout', 'git sparse-checkout set [--cone] <dirs>', 'Check out only some directories.', ['add', 'list', 'disable'], 'git sparse-checkout set --cone src/main', 'Files outside the set disappear from disk, not from history.', 'Expecting it to reduce what is downloaded.', 'local', 'sparse-checkout-and-lfs'),
  C('Advanced', 'git archive', 'git archive --format=zip [--prefix=<dir>/] -o <file> <commit>', 'Export a clean snapshot of a commit.', ['--prefix', 'tar.gz / zip'], 'git archive --format=zip --prefix=gradebook-1.1.0/ -o ../gradebook-1.1.0.zip v1.1.0', 'Writes an archive file; repository unchanged.', 'Expecting uncommitted changes to be included.', 'safe', 'archive-and-aliases'),
  C('Advanced', 'git cat-file', 'git cat-file -t | -s | -p <object>', 'Inspect any object in the database.', ['-t: type', '-s: size', '-p: pretty-print'], 'git cat-file -p HEAD', 'None.', 'Editing files under .git/objects by hand.', 'safe', 'git-object-model'),
  C('Advanced', 'git gc', 'git gc [--prune=<date>]', 'Pack objects and refs; prune expired unreachable objects.', ['--prune=now: delete unreachable objects immediately (dangerous)'], 'git gc', 'Repacks; with aggressive pruning, recovery options disappear.', 'Pruning while you may still need the reflog.', 'local', 'packfiles-and-storage'),
  C('Advanced', 'git lfs track', 'git lfs track "<pattern>"', 'Store matching large files in Git LFS (pointer files in Git).', ['git lfs install', 'git lfs ls-files'], 'git lfs track "*.png"', 'Writes .gitattributes; affects new commits only.', 'Adding LFS after the binaries are already committed.', 'local', 'sparse-checkout-and-lfs'),
];

/** Case-insensitive search over name, purpose, syntax and options. */
export function searchCommands(query = '', category = 'All', safety = 'all') {
  const q = query.trim().toLowerCase();
  return COMMANDS.filter((c) => (category === 'All' || c.category === category)
    && (safety === 'all' || c.safety === safety)
    && (!q || [c.name, c.purpose, c.syntax, c.effect, ...c.options].join(' ').toLowerCase().includes(q)));
}

// ---------------------------------------------------------------- graph model

const clone = (value) => JSON.parse(JSON.stringify(value));

/** A repository with one commit on main. */
export function initialGraph(msg = 'Create gradebook project') {
  return {
    commits: [{ id: 'c1', label: 'A', parents: [], msg, lane: 0 }],
    branches: { main: 'c1' },
    remotes: {},            // e.g. { 'origin/main': 'c1' } — read-only labels
    lanes: { main: 0 },
    head: { branch: 'main' },
    seq: 1,
    conflict: null,
    note: '',
  };
}

const LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function nextLabel(g) { const n = g.seq; return n < 26 ? LABELS[n] : `${LABELS[n % 26]}${Math.floor(n / 26)}`; }

export const headCommit = (g) => (g.head.branch ? g.branches[g.head.branch] : g.head.detached);
export const byId = (g, id) => g.commits.find((c) => c.id === id);

function laneFor(g, branch) {
  if (branch && g.lanes[branch] !== undefined) return g.lanes[branch];
  const lane = Math.max(-1, ...Object.values(g.lanes)) + 1;
  if (branch) g.lanes[branch] = lane;
  return lane;
}

function addCommit(g, parents, msg, label, lane) {
  g.seq += 1;
  const id = `c${g.seq}`;
  g.commits.push({ id, label: label || nextLabel({ seq: g.seq - 1 }), parents, msg, lane });
  return id;
}

/** All commits reachable from a commit (following every parent). */
export function ancestors(g, id) {
  const seen = new Set();
  const stack = id ? [id] : [];
  while (stack.length) {
    const cur = stack.pop();
    if (seen.has(cur)) continue;
    seen.add(cur);
    stack.push(...byId(g, cur).parents);
  }
  return seen;
}

/** Commits reachable from any branch, remote-tracking ref or HEAD. */
export function reachable(g) {
  const all = new Set();
  for (const id of [...Object.values(g.branches), ...Object.values(g.remotes), headCommit(g)]) {
    for (const a of ancestors(g, id)) all.add(a);
  }
  return all;
}

function moveHead(g, id) {
  if (g.head.branch) g.branches[g.head.branch] = id;
  else g.head.detached = id;
}

function resolve(g, ref) {
  if (g.branches[ref]) return g.branches[ref];
  if (g.remotes[ref]) return g.remotes[ref];
  const m = /^HEAD~(\d+)$/.exec(ref);
  if (m) { let id = headCommit(g); for (let i = 0; i < Number(m[1]); i += 1) id = byId(g, id).parents[0]; return id; }
  if (ref === 'HEAD') return headCommit(g);
  const byLabel = g.commits.find((c) => c.label === ref);
  return byLabel ? byLabel.id : null;
}

/** Commits in `from` not reachable from `notFrom`, oldest first (first-parent order). */
function uniqueCommits(g, from, notFrom) {
  const exclude = ancestors(g, notFrom);
  const out = [];
  let id = from;
  while (id && !exclude.has(id)) { out.unshift(id); id = byId(g, id).parents[0]; }
  return out;
}

const describeHead = (g) => (g.head.branch ? g.head.branch : `detached HEAD at ${byId(g, g.head.detached).label}`);

/**
 * Apply one operation; returns { graph, text }.
 * ops: ['commit', msg] ['branch', name] ['switch', name] ['switchCreate', name] ['detach', ref]
 *      ['merge', name, { noFf, conflict }] ['resolve', msg] ['rebase', onto]
 *      ['cherryPick', ref] ['reset', ref, mode] ['revert', ref] ['deleteBranch', name, force]
 *      ['remote', name, ref] ['remoteCommits', remoteRef, [msgs]] ['fetch', remoteRef] ['pull', remoteRef]
 */
export function applyOp(graph, op) {
  const g = clone(graph);
  g.note = '';
  const [kind, ...args] = op;
  const label = (id) => byId(g, id).label;
  switch (kind) {
    case 'commit': {
      const lane = g.head.branch ? laneFor(g, g.head.branch) : laneFor(g, 'detached');
      const id = addCommit(g, [headCommit(g)], args[0], null, lane);
      moveHead(g, id);
      return { graph: g, text: g.head.branch ? `New commit ${label(id)} "${args[0]}" on ${g.head.branch}; the branch pointer moved to it.` : `New commit ${label(id)} "${args[0]}" while detached: HEAD moved to it, but no branch did.` };
    }
    case 'branch': {
      g.branches[args[0]] = args[1] ? resolve(g, args[1]) : headCommit(g);
      return { graph: g, text: `Branch ${args[0]} created at ${label(g.branches[args[0]])}. Only a pointer was written — no files were copied, and HEAD did not move.` };
    }
    case 'switchCreate': {
      g.branches[args[0]] = headCommit(g);
      g.head = { branch: args[0] };
      return { graph: g, text: `git switch -c ${args[0]}: a new branch at ${label(g.branches[args[0]])}, and HEAD now points to it.` };
    }
    case 'switch': {
      g.head = { branch: args[0] };
      return { graph: g, text: `HEAD now points to ${args[0]} (commit ${label(g.branches[args[0]])}); the working directory matches that commit.` };
    }
    case 'detach': {
      const id = resolve(g, args[0]);
      g.head = { detached: id };
      return { graph: g, text: `Detached HEAD: HEAD points directly at ${label(id)}, not at a branch. New commits here belong to no branch.` };
    }
    case 'merge': {
      const name = args[0];
      const opts = args[1] || {};
      const target = resolve(g, name);
      const head = headCommit(g);
      if (ancestors(g, head).has(target)) return { graph: g, text: `Already up to date: ${name} is already part of ${describeHead(g)}.` };
      if (ancestors(g, target).has(head) && !opts.noFf) {
        moveHead(g, target);
        return { graph: g, text: `Fast-forward: ${describeHead(g)} had no commits of its own, so its pointer simply moved to ${label(target)}. No merge commit.` };
      }
      if (opts.conflict) {
        g.conflict = { into: describeHead(g), from: name, target, file: opts.conflict };
        return { graph: g, text: `CONFLICT in ${opts.conflict}: both sides changed the same lines since the merge base. Git stops; no commit was created yet.` };
      }
      const lane = g.head.branch ? laneFor(g, g.head.branch) : laneFor(g, 'detached');
      const id = addCommit(g, [head, target], `Merge branch '${name}'`, null, lane);
      moveHead(g, id);
      return { graph: g, text: `Three-way merge: both branches had new commits, so Git created merge commit ${label(id)} with two parents (${label(head)} and ${label(target)}).` };
    }
    case 'resolve': {
      const c = g.conflict;
      const lane = g.head.branch ? laneFor(g, g.head.branch) : laneFor(g, 'detached');
      const id = addCommit(g, [headCommit(g), c.target], args[0] || `Merge branch '${c.from}'`, null, lane);
      moveHead(g, id);
      g.conflict = null;
      return { graph: g, text: `Conflict resolved: you edited ${c.file}, ran git add, then git commit — merge commit ${label(id)} has two parents.` };
    }
    case 'rebase': {
      const onto = resolve(g, args[0]);
      const branch = g.head.branch;
      const mine = uniqueCommits(g, headCommit(g), onto);
      let base = onto;
      const lane = laneFor(g, branch);
      for (const old of mine) {
        const o = byId(g, old);
        base = addCommit(g, [base], o.msg, `${o.label}'`, lane);
      }
      moveHead(g, base);
      const names = mine.map((m) => label(m)).join(', ');
      return { graph: g, text: mine.length
        ? `Rebase: ${names} were replayed on top of ${label(onto)} as new commits (${mine.map((m) => `${label(m)}'`).join(', ')}) with new ids. The originals are now unreachable (faded) — only the reflog remembers them.`
        : `Nothing to rebase: ${branch} has no commits that ${args[0]} lacks.` };
    }
    case 'cherryPick': {
      const src = byId(g, resolve(g, args[0]));
      const lane = g.head.branch ? laneFor(g, g.head.branch) : laneFor(g, 'detached');
      const id = addCommit(g, [headCommit(g)], src.msg, `${src.label}'`, lane);
      moveHead(g, id);
      return { graph: g, text: `Cherry-pick: the change from ${src.label} was applied as a new commit ${label(id)} on ${describeHead(g)}. ${src.label} itself is unchanged.` };
    }
    case 'reset': {
      const target = resolve(g, args[0]);
      const mode = args[1] || 'mixed';
      const before = headCommit(g);
      moveHead(g, target);
      const lost = [...ancestors(g, before)].filter((id) => !reachable(g).has(id)).map((id) => label(id));
      const where = { soft: 'its changes stay staged', mixed: 'its changes stay in your files, unstaged', hard: 'its changes are removed from the index and the files' }[mode];
      return { graph: g, text: `git reset --${mode} ${args[0]}: ${describeHead(g)} moved back to ${label(target)}; ${where}.${lost.length ? ` ${lost.join(', ')} ${lost.length > 1 ? 'are' : 'is'} no longer on any branch (faded) — recoverable from the reflog for a while.` : ''}` };
    }
    case 'revert': {
      const src = byId(g, resolve(g, args[0]));
      const lane = g.head.branch ? laneFor(g, g.head.branch) : laneFor(g, 'detached');
      const id = addCommit(g, [headCommit(g)], `Revert "${src.msg}"`, null, lane);
      moveHead(g, id);
      return { graph: g, text: `Revert: new commit ${label(id)} applies the inverse of ${src.label}. History is not rewritten — ${src.label} is still there — so this is safe on shared branches.` };
    }
    case 'deleteBranch': {
      const [name, force] = args;
      const tip = g.branches[name];
      const merged = ancestors(g, headCommit(g)).has(tip);
      if (!merged && !force) return { graph: g, text: `error: the branch '${name}' is not fully merged. git branch -d refuses; nothing changed.` };
      delete g.branches[name];
      const lost = [...ancestors(g, tip)].filter((id) => !reachable(g).has(id)).map((id) => label(id));
      return { graph: g, text: `Deleted branch ${name} (was ${label(tip)}).${lost.length ? ` ${lost.join(', ')} ${lost.length > 1 ? 'are' : 'is'} now unreachable (faded): find ${label(tip)} in the reflog and run git branch ${name} <id> to recover.` : ' Its commits are still reachable from another branch.'}` };
    }
    case 'remote': {
      g.remotes[args[0]] = resolve(g, args[1]);
      return { graph: g, text: `${args[0]} records where the remote branch pointed at your last fetch: ${label(g.remotes[args[0]])}.` };
    }
    case 'remoteCommits': {
      // Commits that exist only on the server; kept aside until fetched.
      g.pending = g.pending || {};
      g.pending[args[0]] = args[1];
      return { graph: g, text: `A teammate pushed ${args[1].length} commit(s) to the remote. Your repository doesn't know yet.` };
    }
    case 'fetch': {
      const ref = args[0];
      const msgs = (g.pending && g.pending[ref]) || [];
      let base = g.remotes[ref];
      const lane = laneFor(g, ref);
      for (const msg of msgs) base = addCommit(g, [base], msg, null, lane);
      g.remotes[ref] = base;
      if (g.pending) delete g.pending[ref];
      return { graph: g, text: msgs.length
        ? `git fetch: downloaded ${msgs.length} commit(s) and moved ${ref} to ${label(base)}. Your own branches and files did not change.`
        : `git fetch: nothing new; ${ref} is unchanged.` };
    }
    case 'pull': {
      const fetched = applyOp(g, ['fetch', args[0]]);
      const merged = applyOp(fetched.graph, ['merge', args[0]]);
      return { graph: merged.graph, text: `git pull = fetch + merge. ${fetched.text} Then: ${merged.text}` };
    }
    default:
      throw new Error(`unknown op ${kind}`);
  }
}

/** Run a list of ops from a start graph; returns the final graph. */
export function runOps(ops, start = initialGraph()) {
  return ops.reduce((g, op) => applyOp(g, op).graph, start);
}

/** Precomputed frames for a scenario: [first, ...frames]. */
export function scenarioFrames(scenario) {
  let g = runOps(scenario.setup || []);
  const first = { graph: g, cmd: '', text: scenario.intro };
  const frames = [];
  for (const step of scenario.steps) {
    const res = applyOp(g, step.op);
    g = res.graph;
    frames.push({ graph: g, cmd: step.cmd, text: step.note ? `${res.text} ${step.note}` : res.text });
  }
  return [first, frames];
}

/** Layout for drawing: x by creation order, y by lane. */
export function layout(g) {
  const live = reachable(g);
  const lanesUsed = [...new Set(g.commits.map((c) => c.lane))].sort((a, b) => a - b);
  const laneIndex = Object.fromEntries(lanesUsed.map((l, i) => [l, i]));
  const nodes = g.commits.map((c, i) => ({ ...c, x: i, y: laneIndex[c.lane], live: live.has(c.id) }));
  const pos = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const edges = [];
  for (const n of nodes) for (const p of n.parents) edges.push({ from: n, to: pos[p], live: n.live });
  const labels = {};
  const push = (id, text, kind) => { (labels[id] = labels[id] || []).push({ text, kind }); };
  for (const [name, id] of Object.entries(g.branches)) push(id, (g.head.branch === name ? `HEAD → ${name}` : name), g.head.branch === name ? 'head' : 'branch');
  for (const [name, id] of Object.entries(g.remotes)) push(id, name, 'remote');
  if (g.head.detached) push(g.head.detached, 'HEAD (detached)', 'head');
  return { nodes, edges, labels, lanes: lanesUsed.length };
}

export const BRANCH_SCENARIOS = {
  'create-branch': {
    title: 'Creating a branch',
    intro: 'main has two commits. Watch what a branch really is.',
    setup: [['commit', 'Add D grade']],
    steps: [
      { cmd: 'git branch feature/class-report', op: ['branch', 'feature/class-report'] },
      { cmd: 'git switch feature/class-report', op: ['switch', 'feature/class-report'] },
      { cmd: 'git commit -m "Add ClassReport"', op: ['commit', 'Add ClassReport'], note: 'main did not move — only the branch HEAD points to advances.' },
    ],
  },
  'fast-forward': {
    title: 'Fast-forward merge',
    intro: 'A feature branch with two commits; main has not changed since the branch started.',
    setup: [['switchCreate', 'feature/class-report'], ['commit', 'Add ClassReport'], ['commit', 'Test ClassReport'], ['switch', 'main']],
    steps: [
      { cmd: 'git merge feature/class-report', op: ['merge', 'feature/class-report'] },
      { cmd: 'git branch -d feature/class-report', op: ['deleteBranch', 'feature/class-report'] },
    ],
  },
  'three-way': {
    title: 'Three-way merge',
    intro: 'Both main and the feature branch gained commits after they split.',
    setup: [['switchCreate', 'feature/class-report'], ['commit', 'Add ClassReport'], ['switch', 'main'], ['commit', 'Fix README typo']],
    steps: [
      { cmd: 'git merge feature/class-report', op: ['merge', 'feature/class-report'], note: 'The merge base is A — the commit where the branches diverged.' },
      { cmd: 'git branch -d feature/class-report', op: ['deleteBranch', 'feature/class-report'] },
    ],
  },
  conflict: {
    title: 'Merge conflict',
    intro: 'main raised the B threshold to 78; feature/strict-b raised it to 80 — the same line.',
    setup: [['switchCreate', 'feature/strict-b'], ['commit', 'Raise B to 80'], ['switch', 'main'], ['commit', 'Raise B to 78']],
    steps: [
      { cmd: 'git merge feature/strict-b', op: ['merge', 'feature/strict-b', { conflict: 'GradeCalculator.java' }], note: 'git merge --abort would return to the state before the merge.' },
      { cmd: '# edit, git add GradeCalculator.java, git commit', op: ['resolve', 'Merge feature/strict-b: keep 78'] },
    ],
  },
  rebase: {
    title: 'Rebase a feature branch',
    intro: 'feature has two commits; main moved on by one commit.',
    setup: [['switchCreate', 'feature/class-report'], ['commit', 'Add ClassReport'], ['commit', 'Document ClassReport'], ['switch', 'main'], ['commit', 'Raise B to 78'], ['switch', 'feature/class-report']],
    steps: [
      { cmd: 'git rebase main', op: ['rebase', 'main'] },
      { cmd: 'git switch main', op: ['switch', 'main'] },
      { cmd: 'git merge feature/class-report', op: ['merge', 'feature/class-report'], note: 'After a rebase, the merge is a fast-forward and history is linear.' },
    ],
  },
  'cherry-pick': {
    title: 'Cherry-pick a fix to a release branch',
    intro: 'release/1.0 was cut at B. main then got a fix (C) and an unrelated change (D).',
    setup: [['commit', 'Add D grade'], ['branch', 'release/1.0'], ['commit', 'Clarify empty-marks error'], ['commit', 'Unrelated README note']],
    steps: [
      { cmd: 'git switch release/1.0', op: ['switch', 'release/1.0'] },
      { cmd: 'git cherry-pick -x C', op: ['cherryPick', 'C'], note: 'Only the fix was copied; D stays on main only.' },
    ],
  },
  'reset-revert': {
    title: 'Reset vs revert',
    intro: 'main has three commits after A. The last one (D) is wrong.',
    setup: [['commit', 'Add D grade'], ['commit', 'Round averages'], ['commit', 'Raise B to 80 (wrong)']],
    steps: [
      { cmd: 'git reset --hard HEAD~1', op: ['reset', 'HEAD~1', 'hard'], note: 'Fine for unpushed work — but if D had been pushed, teammates would still have it.' },
      { cmd: 'git reset --hard <D from the reflog>', op: ['reset', 'D', 'hard'], note: 'The reflog still knew D, so the reset was undone. Now try the shared-history way.' },
      { cmd: 'git revert D', op: ['revert', 'D'], note: 'Revert undoes D by adding commit E — nothing is rewritten, so it is the safe choice once D is pushed.' },
    ],
  },
  'detached-head': {
    title: 'Detached HEAD',
    intro: 'You check out an old commit to look around, then commit by mistake.',
    setup: [['commit', 'Add D grade'], ['commit', 'Round averages']],
    steps: [
      { cmd: 'git switch --detach B', op: ['detach', 'B'] },
      { cmd: 'git commit -m "Try a shorter README"', op: ['commit', 'Try a shorter README'] },
      { cmd: 'git switch main', op: ['switch', 'main'], note: 'D is now on no branch (faded). Git prints its id; git branch experiment <id> rescues it.' },
      { cmd: 'git branch experiment D', op: ['branch', 'experiment', 'D'] },
    ],
  },
  'fetch-pull': {
    title: 'Fetch, then pull',
    intro: 'origin/main and main are at B. Arjun pushes two commits to the remote.',
    setup: [['commit', 'Add D grade'], ['remote', 'origin/main', 'main'], ['remoteCommits', 'origin/main', ['Add Student record', 'Explain tests in README']]],
    steps: [
      { cmd: 'git fetch', op: ['fetch', 'origin/main'] },
      { cmd: 'git merge origin/main   (what git pull does next)', op: ['merge', 'origin/main'] },
    ],
  },
};

// ---------------------------------------------------------------- predictor

export const PREDICT_QUESTIONS = [
  {
    setup: [['switchCreate', 'feature'], ['commit', 'Add ClassReport'], ['switch', 'main']],
    cmd: 'git merge feature', op: ['merge', 'feature'],
    options: ['main moves to B; no new commit', 'A merge commit with two parents is created', 'feature moves to A', 'Git reports a conflict'],
    answer: 0,
    explanation: 'main has no commits of its own since feature started, so the merge is a fast-forward: the main pointer just moves to B.',
  },
  {
    setup: [['switchCreate', 'feature'], ['commit', 'Add ClassReport'], ['switch', 'main'], ['commit', 'Fix README']],
    cmd: 'git merge feature', op: ['merge', 'feature'],
    options: ['Fast-forward to B', 'A merge commit D with parents C and B', 'feature is rebased onto C', 'Nothing — already up to date'],
    answer: 1,
    explanation: 'Both branches have new commits, so Git performs a three-way merge using base A and records merge commit D with two parents.',
  },
  {
    setup: [['commit', 'Add D grade'], ['commit', 'Wrong change']],
    cmd: 'git reset --hard HEAD~1', op: ['reset', 'HEAD~1', 'hard'],
    options: ['A new commit undoing C is added', 'main moves back to B; C is no longer on any branch', 'C is deleted from the disk immediately', 'Only the working files change; main stays at C'],
    answer: 1,
    explanation: 'reset moves the branch. C still exists (reflog) but no branch points to it. With --hard the files also match B.',
  },
  {
    setup: [['commit', 'Add D grade'], ['commit', 'Wrong change']],
    cmd: 'git revert HEAD', op: ['revert', 'HEAD'],
    options: ['main moves back to B', 'A new commit D undoing C is added; C stays in history', 'C is removed from history', 'The command fails on a shared branch'],
    answer: 1,
    explanation: 'revert adds a new commit with the inverse change. History is preserved, so it is safe after pushing.',
  },
  {
    setup: [['remote', 'origin/main', 'main'], ['remoteCommits', 'origin/main', ['Add Student record']]],
    cmd: 'git fetch', op: ['fetch', 'origin/main'],
    options: ['main and origin/main both move to the new commit', 'Only origin/main moves; main and your files stay the same', 'A merge commit is created', 'Your uncommitted changes are overwritten'],
    answer: 1,
    explanation: 'fetch downloads commits and updates remote-tracking branches only. Integrating them is a separate merge or rebase (which git pull does).',
  },
  {
    setup: [['remote', 'origin/main', 'main'], ['remoteCommits', 'origin/main', ['Add Student record']]],
    cmd: 'git pull   (main has no local commits)', op: ['pull', 'origin/main'],
    options: ['Only origin/main moves', 'origin/main moves and main fast-forwards to it', 'A merge commit is always created', 'pull refuses without --rebase'],
    answer: 1,
    explanation: 'pull = fetch + integrate. With no local commits, the integration is a fast-forward of main.',
  },
  {
    setup: [['switchCreate', 'feature'], ['commit', 'Add ClassReport'], ['switch', 'main'], ['commit', 'Raise B to 78'], ['switch', 'feature']],
    cmd: 'git rebase main', op: ['rebase', 'main'],
    options: ['B is moved and keeps its id', "A new commit B' is created on top of C; B becomes unreachable", 'main moves to B', 'A merge commit is created'],
    answer: 1,
    explanation: "Rebase replays B on top of C as a new commit B' (new parent, new id). The original B is only in the reflog.",
  },
  {
    setup: [['commit', 'Add D grade'], ['branch', 'release'], ['commit', 'Fix empty-marks message'], ['switch', 'release']],
    cmd: 'git cherry-pick C', op: ['cherryPick', 'C'],
    options: ["release gets a new commit C' with C's change", 'C moves from main to release', 'release fast-forwards to C', 'main is reset to B'],
    answer: 0,
    explanation: "Cherry-pick copies the change into a new commit on the current branch. C stays on main; the copy has a new id.",
  },
  {
    setup: [['switchCreate', 'spike'], ['commit', 'Sketch CSV export'], ['switch', 'main']],
    cmd: 'git branch -D spike', op: ['deleteBranch', 'spike', true],
    options: ['The branch and its commit are erased permanently at once', 'The pointer is deleted; B becomes unreachable but recoverable via the reflog', 'Git refuses because the branch is not merged', 'main moves to B'],
    answer: 1,
    explanation: '-D forces the deletion. Only the pointer goes; commit B remains in the database (reflog) until garbage collection.',
  },
  {
    setup: [['commit', 'Add D grade'], ['commit', 'Round averages']],
    cmd: 'git switch --detach B', op: ['detach', 'B'],
    options: ['main moves to B', 'HEAD points directly at B; no branch moves', 'C is deleted', 'A new branch named B is created'],
    answer: 1,
    explanation: 'Detached HEAD: HEAD holds a commit id instead of a branch name. Commits made now would belong to no branch.',
  },
];

/** Before/after graphs for a prediction question. */
export function predictionStates(q) {
  const before = runOps(q.setup);
  const result = applyOp(before, q.op);
  return { before, after: result.graph, effect: result.text };
}

// ---------------------------------------------------------------- areas model

const AREA_FILES = ['App.java', 'README.md', 'pom.xml'];

/** Working directory, index, local commits and a remote. Versions are labels like "v1". */
export function initialAreas() {
  const tree = { 'App.java': 'v1', 'README.md': 'v1', 'pom.xml': 'v1' };
  return {
    files: [...AREA_FILES],
    work: { ...tree },
    index: { ...tree },
    commits: [{ id: 'C1', parent: null, parent2: null, tree, msg: 'Create gradebook project', by: 'you' }],
    branches: { main: 'C1' },
    head: 'main',
    remote: { commits: ['C1'], branches: { main: 'C1' } },
    tracking: { main: 'C1' },     // origin/main as last fetched
    remoteExtra: [],               // commits on the server you have not fetched
    seq: 1,
    teamSeq: 0,
  };
}

const areaCommit = (s, id) => s.commits.find((c) => c.id === id) || s.remoteExtra.find((c) => c.id === id);
const headTree = (s) => areaCommit(s, s.branches[s.head]).tree;
const bump = (v) => (v ? `v${Number(v.slice(1)) + 1}` : 'v1');

function areaAncestors(s, id) {
  const seen = new Set();
  const stack = id ? [id] : [];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || seen.has(cur)) continue;
    seen.add(cur);
    const c = areaCommit(s, cur);
    stack.push(c.parent, c.parent2);
  }
  return seen;
}

/** Status of each file: untracked, modified, staged, staged+modified, deleted or clean. */
export function fileStatus(s) {
  const head = headTree(s);
  return s.files.map((f) => {
    const inHead = head[f]; const inIndex = s.index[f]; const inWork = s.work[f];
    let code;
    if (!inHead && !inIndex) code = inWork ? '??' : null;
    else {
      const left = inHead === inIndex ? ' ' : (inHead ? 'M' : 'A');
      const right = inIndex === inWork ? ' ' : 'M';
      code = `${left}${right}`;
    }
    return { file: f, code: code === '  ' ? null : code, work: inWork || '—', index: inIndex || '—', head: inHead || '—' };
  });
}

function mergeTrees(base, ours, theirs) {
  const out = {};
  for (const f of new Set([...Object.keys(base), ...Object.keys(ours), ...Object.keys(theirs)])) {
    out[f] = ours[f] === base[f] ? theirs[f] : ours[f];
  }
  return out;
}

function mergeBase(s, a, b) {
  const aa = areaAncestors(s, a);
  // Newest common ancestor by creation order.
  const ordered = [...s.commits, ...s.remoteExtra];
  for (let i = ordered.length - 1; i >= 0; i -= 1) if (aa.has(ordered[i].id) && areaAncestors(s, b).has(ordered[i].id)) return ordered[i].id;
  return null;
}

const clean = (s) => fileStatus(s).every((f) => !f.code || f.code === '??');

export const AREA_ACTIONS = [
  { id: 'edit:App.java', label: 'Edit App.java', group: 'Files' },
  { id: 'edit:README.md', label: 'Edit README.md', group: 'Files' },
  { id: 'create:Student.java', label: 'Create Student.java', group: 'Files' },
  { id: 'add:all', label: 'git add -A', group: 'Stage' },
  { id: 'add:App.java', label: 'git add App.java', group: 'Stage' },
  { id: 'unstage:all', label: 'git restore --staged .', group: 'Stage' },
  { id: 'restore:App.java', label: 'git restore App.java', group: 'Stage' },
  { id: 'commit', label: 'git commit', group: 'Commit' },
  { id: 'branch:feature', label: 'git switch -c feature', group: 'Branch' },
  { id: 'switch:main', label: 'git switch main', group: 'Branch' },
  { id: 'switch:feature', label: 'git switch feature', group: 'Branch' },
  { id: 'merge:feature', label: 'git merge feature', group: 'Branch' },
  { id: 'team', label: 'Arjun pushes a commit', group: 'Remote' },
  { id: 'fetch', label: 'git fetch', group: 'Remote' },
  { id: 'pull', label: 'git pull', group: 'Remote' },
  { id: 'push', label: 'git push', group: 'Remote' },
];

/** Apply an action; returns { state, text, error } — on error the state is unchanged. */
export function applyArea(state, action) {
  const s = clone(state);
  const [kind, arg] = action.split(':');
  const err = (text) => ({ state, text, error: true });
  switch (kind) {
    case 'edit': {
      if (!s.work[arg]) return err(`${arg} doesn't exist in the working directory.`);
      s.work[arg] = bump(s.work[arg]);
      return { state: s, text: `You edited ${arg} (now ${s.work[arg]} on disk). Only the working directory changed — Git hasn't recorded anything.` };
    }
    case 'create': {
      if (s.work[arg]) return err(`${arg} already exists.`);
      s.work[arg] = 'v1';
      if (!s.files.includes(arg)) s.files.push(arg);
      return { state: s, text: `You created ${arg}. It is untracked (??): Git sees it but will not commit it until you add it.` };
    }
    case 'add': {
      const targets = arg === 'all' ? s.files : [arg];
      const changed = targets.filter((f) => s.work[f] !== s.index[f]);
      if (!changed.length) return err(`Nothing to stage: the working directory already matches the index${arg === 'all' ? '' : ` for ${arg}`}.`);
      for (const f of changed) s.index[f] = s.work[f];
      return { state: s, text: `git add copied ${changed.join(', ')} into the staging area. The next commit will contain exactly what the index holds.` };
    }
    case 'unstage': {
      const head = headTree(s);
      const changed = s.files.filter((f) => s.index[f] !== head[f]);
      if (!changed.length) return err('Nothing is staged.');
      for (const f of changed) { if (head[f]) s.index[f] = head[f]; else delete s.index[f]; }
      return { state: s, text: `Unstaged ${changed.join(', ')}: the index matches the last commit again; your edits are still in the working directory.` };
    }
    case 'restore': {
      if (s.work[arg] === s.index[arg]) return err(`${arg} has no unstaged changes.`);
      s.work[arg] = s.index[arg];
      return { state: s, text: `git restore ${arg} copied the index version over your working file. The unstaged edit is gone for good — Git never stored it.` };
    }
    case 'commit': {
      const head = headTree(s);
      if (s.files.every((f) => s.index[f] === head[f])) return err('nothing to commit — stage changes with git add first. (git commit only records what is staged.)');
      s.seq += 1;
      const id = `C${s.seq}`;
      const tree = Object.fromEntries(s.files.filter((f) => s.index[f]).map((f) => [f, s.index[f]]));
      s.commits.push({ id, parent: s.branches[s.head], parent2: null, tree, msg: `Commit ${id}`, by: 'you' });
      s.branches[s.head] = id;
      const leftover = s.files.filter((f) => s.work[f] !== s.index[f]);
      return { state: s, text: `Commit ${id} recorded the staged snapshot; ${s.head} now points to ${id}.${leftover.length ? ` Unstaged changes to ${leftover.join(', ')} were not included.` : ''}` };
    }
    case 'branch': {
      if (s.branches[arg]) return err(`fatal: a branch named '${arg}' already exists.`);
      s.branches[arg] = s.branches[s.head];
      s.head = arg;
      return { state: s, text: `Created ${arg} at ${s.branches[arg]} and switched to it. Your uncommitted changes came along — they don't belong to any branch.` };
    }
    case 'switch': {
      if (!s.branches[arg]) return err(`fatal: invalid reference: ${arg}`);
      if (s.head === arg) return err(`Already on '${arg}'.`);
      const target = areaCommit(s, s.branches[arg]).tree;
      const head = headTree(s);
      const blocking = s.files.filter((f) => (s.work[f] !== head[f] || s.index[f] !== head[f]) && target[f] !== head[f] && head[f]);
      if (blocking.length) return err(`error: Your local changes to ${blocking.join(', ')} would be overwritten by checkout. Commit or stash them first. (Nothing changed.)`);
      for (const f of s.files) {
        const dirty = s.work[f] !== head[f] || s.index[f] !== head[f];
        if (!dirty) { if (target[f]) { s.work[f] = target[f]; s.index[f] = target[f]; } else { delete s.work[f]; delete s.index[f]; } }
      }
      s.head = arg;
      return { state: s, text: `Switched to ${arg}: files that differ between the branches were updated; uncommitted changes that don't collide stayed with you.` };
    }
    case 'merge': {
      if (!s.branches[arg]) return err(`merge: ${arg} - not something we can merge`);
      if (!clean(s)) return err('Commit or stash your changes before merging (the simulator keeps merges clean).');
      const ours = s.branches[s.head]; const theirs = s.branches[arg];
      if (areaAncestors(s, ours).has(theirs)) return err('Already up to date.');
      if (areaAncestors(s, theirs).has(ours)) {
        s.branches[s.head] = theirs;
        const t = areaCommit(s, theirs).tree;
        for (const f of s.files) { if (t[f]) { s.work[f] = t[f]; s.index[f] = t[f]; } }
        return { state: s, text: `Fast-forward: ${s.head} moved to ${theirs}. No merge commit was needed.` };
      }
      const base = areaCommit(s, mergeBase(s, ours, theirs)).tree;
      const tree = mergeTrees(base, areaCommit(s, ours).tree, areaCommit(s, theirs).tree);
      s.seq += 1;
      const id = `C${s.seq}`;
      s.commits.push({ id, parent: ours, parent2: theirs, tree, msg: `Merge branch '${arg}'`, by: 'you' });
      s.branches[s.head] = id;
      for (const f of Object.keys(tree)) { s.work[f] = tree[f]; s.index[f] = tree[f]; }
      return { state: s, text: `Three-way merge: created ${id} with parents ${ours} and ${theirs}.` };
    }
    case 'team': {
      s.teamSeq += 1;
      const id = `R${s.teamSeq}`;
      const parentId = s.remoteExtra.length ? s.remoteExtra[s.remoteExtra.length - 1].id : s.remote.branches.main;
      const parentTree = areaCommit(s, parentId).tree;
      const tree = { ...parentTree, 'pom.xml': bump(parentTree['pom.xml']) };
      s.remoteExtra.push({ id, parent: parentId, parent2: null, tree, msg: `Arjun: bump JUnit (${id})`, by: 'Arjun' });
      s.remote.commits.push(id);
      s.remote.branches.main = id;
      return { state: s, text: `Arjun pushed ${id} (pom.xml changed) to the remote's main. Your origin/main still says ${s.tracking.main} — you haven't fetched.` };
    }
    case 'fetch': {
      const fresh = s.remoteExtra.filter((c) => !s.commits.some((k) => k.id === c.id));
      if (!fresh.length && s.tracking.main === s.remote.branches.main) return err('git fetch: nothing new on the remote.');
      for (const c of fresh) s.commits.push(c);
      s.remoteExtra = s.remoteExtra.filter((c) => !fresh.includes(c));
      s.tracking.main = s.remote.branches.main;
      return { state: s, text: `git fetch downloaded ${fresh.map((c) => c.id).join(', ') || 'nothing new'} and moved origin/main to ${s.tracking.main}. Your branches and files are unchanged.` };
    }
    case 'pull': {
      if (s.head !== 'main') return err('This simulator pulls only on main. Switch to main first.');
      const f = applyArea(s, 'fetch');
      const afterFetch = f.error ? s : f.state;
      if (!clean(afterFetch)) return err('error: your local changes would be overwritten by merge. Commit or stash them first.');
      const ours = afterFetch.branches.main; const theirs = afterFetch.tracking.main;
      if (areaAncestors(afterFetch, ours).has(theirs)) return { state: afterFetch, text: `${f.error ? '' : `${f.text} `}Already up to date.` };
      const m = applyArea({ ...afterFetch, branches: { ...afterFetch.branches, __origin: theirs } }, 'merge:__origin');
      const merged = clone(m.state);
      delete merged.branches.__origin;
      merged.commits = merged.commits.map((c) => (c.msg === "Merge branch '__origin'" ? { ...c, msg: "Merge branch 'main' of origin" } : c));
      return { state: merged, text: `git pull = fetch + merge. ${f.error ? '' : `${f.text} `}${m.text.replace('__origin', 'origin/main')}` };
    }
    case 'push': {
      if (s.head !== 'main') return err('This simulator pushes main only. Switch to main first.');
      const local = s.branches.main; const remote = s.remote.branches.main;
      if (local === remote) return err('Everything up-to-date.');
      if (!areaAncestors(s, local).has(remote)) return err(` ! [rejected] main -> main (${s.commits.some((c) => c.id === remote) ? 'non-fast-forward' : 'fetch first'}) — the remote has commits you don't. Pull (or fetch + merge/rebase) first.`);
      const sent = [...areaAncestors(s, local)].filter((id) => !s.remote.commits.includes(id)).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
      s.remote.commits.push(...sent);
      s.remote.branches.main = local;
      s.tracking.main = local;
      return { state: s, text: `git push sent ${sent.join(', ')} and moved the remote's main to ${local}; origin/main updated too.` };
    }
    default:
      return err(`Unknown action ${action}`);
  }
}

/** Replay an action history from the initial state into frames (errors included as frames). */
export function areaFrames(history) {
  let s = initialAreas();
  const first = { state: s, action: null, error: false, text: 'A clean repository: one commit (C1) on main, pushed to the remote. Choose an action.' };
  const frames = [];
  for (const action of history) {
    const res = applyArea(s, action);
    if (!res.error) s = res.state;
    frames.push({ state: s, action, error: !!res.error, text: res.text });
  }
  return [first, frames];
}

// ---------------------------------------------------------------- troubleshooting

export const TROUBLE_SCENARIOS = {
  'push-rejected': {
    title: 'git push is rejected',
    intro: 'git push prints "! [rejected] main -> main (fetch first)". Your two commits are unpushed. What do you do first?',
    stages: [
      [
        { cmd: 'git fetch', ok: true, out: 'From github.com:your-org/gradebook\n   a73641f..c080e23  main       -> origin/main', why: 'Fetch only updates origin/main — safe, and now you can see what arrived.' },
        { cmd: 'git push --force', why: 'Force would overwrite the remote main and delete the teammate\'s commit for everyone.' },
        { cmd: 'git reset --hard origin/main', why: 'That throws away your two unpushed commits. Inspect first.' },
      ],
      [
        { cmd: 'git log --oneline main..origin/main', ok: true, out: 'c080e23 Explain how to run the tests', why: 'One commit from a teammate — a README change, unlikely to conflict.' },
        { cmd: 'git push', why: 'Nothing changed locally; the push is rejected again.' },
      ],
      [
        { cmd: 'git pull --rebase', ok: true, out: 'Successfully rebased and updated refs/heads/main.', why: 'Your unpushed commits are replayed on top of the teammate\'s commit: linear history, nobody else affected.' },
        { cmd: 'git push --force-with-lease', why: 'Lease protects against unseen changes, but here you DO want the teammate\'s commit. Integrate it instead of replacing it.' },
      ],
      [
        { cmd: 'mvn -B verify && git push', ok: true, out: '[INFO] BUILD SUCCESS\nTo github.com:your-org/gradebook.git\n   c080e23..d9b72cf  main -> main', why: 'Build passes with both changes, and the push is a fast-forward.', done: 'Rule: a rejected push means "integrate first" — fetch, inspect, rebase or merge, test, push. Never force a shared branch.' },
        { cmd: 'git push --no-verify', why: '--no-verify skips hooks; it doesn\'t solve a non-fast-forward. Run the tests and push normally.' },
      ],
    ],
  },
  'lost-commits': {
    title: 'Commits disappeared after a reset',
    intro: 'You meant git reset --soft HEAD~1 but typed git reset --hard HEAD~2. Two commits are gone from git log.',
    stages: [
      [
        { cmd: 'git status', ok: true, out: 'On branch main\nnothing to commit, working tree clean', why: 'No uncommitted work is at risk, so a recovery reset won\'t destroy anything.' },
        { cmd: 'rm -rf .git && git clone …', why: 'A fresh clone has no reflog and none of your unpushed commits. That would make the loss permanent.' },
        { cmd: 'git reset --hard HEAD~2   (again)', why: 'Repeating the command moves further back. Look at what happened first.' },
      ],
      [
        { cmd: 'git reflog -3', ok: true, out: 'd0e8c67 HEAD@{0}: reset: moving to HEAD~2\n3a070e0 HEAD@{1}: commit: Raise the B threshold to 78\n10b9974 HEAD@{2}: merge feature/class-report: Merge made by the \'ort\' strategy.', why: 'The reflog shows where HEAD was before the reset: 3a070e0.' },
        { cmd: 'git log --oneline', why: 'git log follows the branch, which no longer contains the commits. The reflog remembers where HEAD has been.' },
      ],
      [
        { cmd: 'git reset --hard HEAD@{1}', ok: true, out: 'HEAD is now at 3a070e0 Raise the B threshold to 78', why: 'main points at the old tip again; both commits are back.', done: 'Commits are recoverable from the reflog for weeks. Uncommitted changes destroyed by --hard are not — check git status before any hard reset.' },
        { cmd: 'git revert HEAD', why: 'Revert adds an undo commit; it doesn\'t bring back commits the branch lost.' },
      ],
    ],
  },
  'wrong-branch': {
    title: 'Committed on the wrong branch',
    intro: 'You just committed "Round averages to two decimals" on main. It should be on a new branch fix/rounding. Nothing is pushed.',
    stages: [
      [
        { cmd: 'git status -sb', ok: true, out: '## main...origin/main [ahead 1]', why: 'One unpushed commit on main and a clean tree — safe to move it.' },
        { cmd: 'git push', why: 'That would publish the commit on main — the opposite of what you want.' },
      ],
      [
        { cmd: 'git branch fix/rounding', ok: true, out: '', why: 'A branch at the current commit keeps the work safe before main moves.' },
        { cmd: 'git reset --hard HEAD~1', why: 'Doing this first would leave the commit on no branch. Create the branch first.' },
      ],
      [
        { cmd: 'git reset --hard HEAD~1', ok: true, out: 'HEAD is now at c378147 Create gradebook project', why: 'main goes back one commit; the commit lives on fix/rounding.' },
        { cmd: 'git revert HEAD', info: true, why: 'Revert works but leaves a commit and its undo on main. For unpushed work, moving the pointer is cleaner.' },
      ],
      [
        { cmd: 'git switch fix/rounding', ok: true, out: "Switched to branch 'fix/rounding'", why: 'Continue the work on the right branch.', done: 'If the commit had been pushed to main, you would revert it on main and cherry-pick it onto the branch instead.' },
      ],
    ],
  },
  'secret-pushed': {
    title: 'A secret reached GitHub',
    intro: 'You pushed application.properties containing the real database password to a public repository an hour ago.',
    stages: [
      [
        { cmd: 'Change the database password (and update where it\'s used)', ok: true, out: 'The leaked value no longer works.', why: 'Rotation is the only step that makes the leak harmless — copies may already exist.' },
        { cmd: 'git rm --cached src/main/resources/application.properties', why: 'Untracking changes future commits only; the password stays in history and in every clone. Rotate first.' },
        { cmd: 'git filter-repo …', why: 'Rewriting history doesn\'t remove copies already made. It can come later; rotation comes first.' },
      ],
      [
        { cmd: 'Check database and GitHub security logs for access since the push', ok: true, out: 'No unexpected logins found.', why: 'You need to know whether the credential was used.' },
        { cmd: 'Delete the repository and recreate it', why: 'Forks, clones and caches keep the data; it also destroys issues and history. Not a fix.' },
      ],
      [
        { cmd: 'Use ${DB_PASSWORD}, ignore local config, commit .env.example, push', ok: true, out: '[main 5c2a1d0] Read the datasource password from DB_PASSWORD', why: 'The code no longer contains a secret; real values come from the environment.', done: 'Optional, coordinated: purge history with git filter-repo and ask everyone to re-clone. Prevent repeats with push protection and a pre-commit check.' },
        { cmd: 'Keep the password but make the repository private', why: 'Everyone with access — and everyone who already cloned — can still read it.' },
      ],
    ],
  },
  'detached-work': {
    title: 'Work made in detached HEAD',
    intro: 'git status says "HEAD detached at 4b17431". You made two commits here and now want to go back to main.',
    stages: [
      [
        { cmd: 'git log --oneline -3', ok: true, out: '9c1e2f0 Shorter README intro\n332c03d Try a shorter README\n4b17431 Document the grading scale in README', why: 'Two commits sit on top of 4b17431 — on no branch.' },
        { cmd: 'git switch main', why: 'Leaving now strands the two commits; they would only be findable through the reflog.' },
      ],
      [
        { cmd: 'git switch -c experiment/short-readme', ok: true, out: "Switched to a new branch 'experiment/short-readme'", why: 'The commits now belong to a branch and are safe.', done: 'If you had already left, git reflog shows the commit ids; git branch <name> <id> rescues them.' },
        { cmd: 'git reset --hard main', why: 'That moves HEAD to main and abandons the two commits.' },
      ],
    ],
  },
  'force-pushed': {
    title: 'Someone force-pushed main',
    intro: 'git fetch prints " + 3a070e0...550dd7f main -> origin/main  (forced update)". Three commits vanished from main on GitHub.',
    stages: [
      [
        { cmd: 'git reflog show origin/main', ok: true, out: '550dd7f refs/remotes/origin/main@{0}: fetch: forced-update', why: 'Your remote-tracking reflog recorded the forced update; @{1} is the value before it.' },
        { cmd: 'git pull', why: 'That would merge or rebase your main onto the damaged history. Find the lost tip first.' },
      ],
      [
        { cmd: 'git log --oneline -1 origin/main@{1}', ok: true, out: '3a070e0 Raise the B threshold to 78', why: 'The tip before the force push — the lost commits are its ancestors.' },
        { cmd: 'git push --force origin main', why: 'Your local main may be outdated too; pushing it blindly could lose even more.' },
      ],
      [
        { cmd: 'git push --force-with-lease=main:550dd7f origin origin/main@{1}:main', ok: true, out: ' + 550dd7f...3a070e0 origin/main@{1} -> main (forced update)', why: 'The remote main is restored, and the lease guarantees you only replace the bad tip you saw.', done: 'Re-apply any wanted commit from the bad push, tell the team, and enable branch protection to block force pushes on main.' },
      ],
    ],
  },
};
