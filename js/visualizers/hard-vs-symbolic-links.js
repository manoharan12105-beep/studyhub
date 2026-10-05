// Hard links vs symbolic links: directory entries, inodes and what `cat` sees.
//
//   command → directory table (name → inode) + inode table (links, data) + cat results
//
// A directory is a list of name → inode number. A hard link is one more name for
// the same inode; a symlink is a separate inode whose data is a path. The steps
// delete and recreate the original to show who survives. Inode numbers are
// illustrative (real ones come from `ls -i`); the behaviour matches the lesson's
// verified terminal output.

import { el } from '../util.js';
import { highlight } from '../highlight.js';
import { createStepper } from '../engagement/stepper.js';

const STEPS = [
  {
    cmd: 'echo "version 1" > original.txt',
    apply(s) { s.inodes[1001] = { type: 'file', links: 1, data: 'version 1' }; s.dir.push(['original.txt', 1001]); },
    text: 'Creating a file allocates an inode (here 1001) for its metadata and data, and adds ONE directory entry pointing to it. Link count: 1.',
  },
  {
    cmd: 'ln original.txt hard.txt',
    apply(s) { s.inodes[1001].links += 1; s.dir.push(['hard.txt', 1001]); },
    text: 'A hard link adds a second directory entry for the SAME inode. No data is copied; the link count becomes 2. Neither name is "the original" any more — they are equal.',
  },
  {
    cmd: 'ln -s original.txt soft.txt',
    apply(s) { s.inodes[1002] = { type: 'symlink', links: 1, data: 'original.txt' }; s.dir.push(['soft.txt', 1002]); },
    text: 'A symbolic link is a NEW inode (1002) whose data is just the path "original.txt". Opening it makes the kernel follow that path.',
  },
  {
    cmd: 'echo "version 2" >> hard.txt',
    apply(s) { s.inodes[1001].data += '\nversion 2'; },
    text: 'Writing through hard.txt changes inode 1001 — so original.txt shows the change too, and so does soft.txt, which leads to original.txt.',
  },
  {
    cmd: 'rm original.txt',
    apply(s) { s.dir = s.dir.filter(([n]) => n !== 'original.txt'); s.inodes[1001].links -= 1; },
    text: 'rm removes only the NAME original.txt. Inode 1001 still has one link (hard.txt), so its data survives. soft.txt now points to a path that does not exist: a dangling link.',
  },
  {
    cmd: 'echo "new file" > original.txt',
    apply(s) { s.inodes[1003] = { type: 'file', links: 1, data: 'new file' }; s.dir.push(['original.txt', 1003]); },
    text: 'A new original.txt gets a NEW inode (1003). soft.txt works again — it follows the name, so it now shows the new file. hard.txt still shows the old data: it is tied to inode 1001, not to a name.',
  },
  {
    cmd: 'rm hard.txt',
    apply(s) { s.dir = s.dir.filter(([n]) => n !== 'hard.txt'); s.inodes[1001].links -= 1; },
    text: 'Removing the last name drops inode 1001\'s link count to 0. With no process holding it open, the kernel frees the inode and its data blocks.',
  },
];

export function mount(root) {
  const cmd = el('pre', { class: 'mini-code', tabindex: 0 });
  const dirTable = el('table', { class: 'viz-table' });
  const inodeTable = el('table', { class: 'viz-table' });
  const catTable = el('table', { class: 'viz-table' });
  root.append(el('div', { class: 'code-block' }, cmd), el('div', { class: 'viz-stage join-stage' },
    el('div', {}, el('p', { class: 'tree-side-title' }, 'Directory: name → inode'), wrap(dirTable, 'Directory entries')),
    el('div', {}, el('p', { class: 'tree-side-title' }, 'Inode table'), wrap(inodeTable, 'Inodes')),
    el('div', { class: 'join-result' }, el('p', { class: 'tree-side-title' }, 'cat <name>'), wrap(catTable, 'Reading each name'))));
  const stepper = createStepper(root, { render, playDelay: 2200, nextLabel: 'Next command' });

  const frames = [];
  const state = { dir: [], inodes: {} };
  for (const step of STEPS) {
    step.apply(state);
    frames.push({ cmd: step.cmd, text: step.text, dir: state.dir.map((e) => e.slice()), inodes: JSON.parse(JSON.stringify(state.inodes)) });
  }
  const first = { cmd: '# empty directory', text: 'An empty directory. Run the commands one by one and watch the directory entries, the inodes and what reading each name returns.', dir: [], inodes: {} };
  stepper.load(first, frames);

  function render(frame) {
    cmd.innerHTML = highlight(frame.cmd, 'bash');
    dirTable.replaceChildren(head(['Name', 'Inode']), el('tbody', {}, frame.dir.length
      ? frame.dir.map(([name, ino]) => el('tr', {}, el('td', {}, name), el('td', {}, String(ino))))
      : el('tr', {}, el('td', { colspan: 2, class: 'muted' }, '(no entries)'))));
    const live = Object.entries(frame.inodes).filter(([, i]) => i.links > 0);
    inodeTable.replaceChildren(head(['Inode', 'Type', 'Links', 'Data']), el('tbody', {}, live.length
      ? live.map(([ino, i]) => el('tr', {}, el('td', {}, ino), el('td', {}, i.type), el('td', {}, String(i.links)), el('td', {}, i.type === 'symlink' ? `→ ${i.data}` : i.data.replace('\n', ' ⏎ '))))
      : el('tr', {}, el('td', { colspan: 4, class: 'muted' }, '(none)'))));
    catTable.replaceChildren(head(['Name', 'Result']), el('tbody', {}, frame.dir.length
      ? frame.dir.map(([name]) => {
        const result = read(frame, name);
        return el('tr', { class: result.ok ? '' : 'is-removed' }, el('td', {}, name), el('td', {}, result.text));
      })
      : el('tr', {}, el('td', { colspan: 2, class: 'muted' }, '—'))));
  }
  return stepper;
}

function read(frame, name, depth = 0) {
  const entry = frame.dir.find(([n]) => n === name);
  if (!entry) return { ok: false, text: `cat: ${name}: No such file or directory` };
  const inode = frame.inodes[entry[1]];
  if (inode.type === 'symlink') {
    if (depth > 5) return { ok: false, text: 'Too many levels of symbolic links' };
    const target = read(frame, inode.data, depth + 1);
    return target.ok ? target : { ok: false, text: `cat: ${name}: No such file or directory  (dangling → ${inode.data})` };
  }
  return { ok: true, text: inode.data.replace('\n', ' ⏎ ') };
}

function wrap(table, label) {
  return el('div', { class: 'table-wrap', tabindex: 0, role: 'region', 'aria-label': label }, table);
}

function head(cols) {
  return el('thead', {}, el('tr', {}, cols.map((c) => el('th', { scope: 'col' }, c))));
}
