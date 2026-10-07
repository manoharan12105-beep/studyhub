// Paging: logical address → page number + offset → frame → physical address.
//
//   page size + page table + logical address → four frames: the bit split,
//   the page-table lookup, and the physical address (or a page fault, or an
//   invalid address). The bits are drawn with the subnetting colours: page
//   number like the network part, offset like the host part.
//
// The arithmetic is translate() in js/simulators/os-common.js.

import { el } from '../util.js';
import { createStepper, errorLine, field } from '../engagement/stepper.js';
import { select, tableView } from '../simulators/network-common.js';
import { translate } from '../simulators/os-common.js';

const SIZES = { 256: '256 bytes', 512: '512 bytes', 1024: '1 KB (1024 bytes)', 2048: '2 KB (2048 bytes)', 4096: '4 KB (4096 bytes)' };

export function mount(root, { options }) {
  const size = select(SIZES, String(options.pageSize || 1024));
  const table = el('input', { class: 'input', type: 'text', value: options.pageTable || '5 2 7 1 -', spellcheck: 'false' });
  const address = el('input', { class: 'input', type: 'number', min: 0, value: options.address ?? 3000, style: 'width:8rem' });
  const error = errorLine();
  const tableField = field('Page table: frame for page 0, 1, 2 …', table, 'Use - for a page that is not in memory; up to 16 pages.');
  tableField.classList.add('field-grow');
  root.append(el('div', { class: 'viz-form' }, field('Page size', size), tableField, field('Logical address', address)), error.node);

  const bits = el('p', { class: 'bits os-bits', 'aria-live': 'off' });
  const pt = tableView('Page table', ['Page', 'Frame', 'In memory?']);
  const result = el('p', { class: 'verdict' });
  root.append(el('div', { class: 'viz-stage' },
    el('p', { class: 'tree-side-title' }, 'Address bits'), bits,
    el('ul', { class: 'viz-legend' }, el('li', {}, el('span', { class: 'bit-net' }, 'page number')), el('li', {}, el('span', { class: 'bit-host' }, 'offset'))),
    pt.node, result));
  const stepper = createStepper(root, { render, playDelay: 1600, nextLabel: 'Next step' });

  function render(frame) {
    bits.replaceChildren(...(frame.showSplit
      ? [el('span', { class: 'bit-net' }, frame.pageBits), ' ', el('span', { class: 'bit-host' }, frame.offsetBits),
        frame.physBits ? el('span', { class: 'os-bits-arrow' }, '  →  ') : '',
        frame.physBits ? el('span', { class: 'bit-net' }, frame.physBits[0]) : '', frame.physBits ? ' ' : '',
        frame.physBits ? el('span', { class: 'bit-host' }, frame.physBits[1]) : '']
      : [el('span', { class: 'bits-dec' }, `${frame.logical} = ${frame.allBits}`)]));
    pt.render(frame.entries.map((f, i) => [String(i), f === null ? '—' : String(f), f === null ? 'no (valid bit 0)' : 'yes']),
      { rowClass: (row, i) => (i === frame.lookup ? (frame.entries[i] === null ? 'is-unmatched' : 'is-matched') : '') });
    result.className = `verdict ${frame.verdict === 'bad' ? 'verdict-bad' : frame.verdict === 'ok' ? 'verdict-ok' : ''}`;
    result.textContent = frame.result || '';
    result.hidden = !frame.result;
  }

  function start() {
    error.clear();
    const pageSize = Number(size.value);
    const entries = table.value.trim().split(/[\s,]+/).filter(Boolean).map((t) => (t === '-' ? null : Number(t)));
    const logical = Number(address.value);
    if (!entries.length || entries.length > 16 || entries.some((f) => f !== null && (!Number.isInteger(f) || f < 0 || f > 63))) {
      error.show('Page table: 1 to 16 entries, each a frame number from 0 to 63 or - for "not in memory".');
      return;
    }
    if (!Number.isInteger(logical) || logical < 0 || logical > 99999) {
      error.show('The logical address must be a whole number from 0 to 99999.');
      return;
    }
    const offsetWidth = Math.log2(pageSize);
    const pageWidth = Math.max(1, Math.ceil(Math.log2(entries.length)));
    const t = translate(logical, pageSize, entries);
    const pageBin = t.page.toString(2).padStart(pageWidth, '0');
    const offsetBin = t.offset.toString(2).padStart(offsetWidth, '0');
    const base = { logical, entries, allBits: logical.toString(2), lookup: null };
    const frames = [
      { ...base, text: `Logical address ${logical}. A page holds ${pageSize} = 2^${offsetWidth} bytes, so the low ${offsetWidth} bits are the offset and the bits above them are the page number.` },
      { ...base, showSplit: true, pageBits: pageBin, offsetBits: offsetBin,
        text: `Split: page number p = ${logical} ÷ ${pageSize} = ${t.page}; offset d = ${logical} mod ${pageSize} = ${t.offset}. (Same as taking the high bits and the low ${offsetWidth} bits.)` },
    ];
    if (!t.valid) {
      frames.push({ ...base, showSplit: true, pageBits: pageBin, offsetBits: offsetBin, verdict: 'bad',
        result: `Page ${t.page} does not exist (the table has ${entries.length} pages) → trap: invalid address.`,
        text: `The page table has entries 0–${entries.length - 1}, so page ${t.page} is outside the process's address space. The MMU traps and the OS terminates the process (a segmentation fault).` });
    } else if (t.fault) {
      frames.push({ ...base, showSplit: true, pageBits: pageBin, offsetBits: offsetBin, lookup: t.page, verdict: 'bad',
        result: `Page ${t.page} is not in memory → PAGE FAULT.`,
        text: `Entry ${t.page} has its valid bit off: the page belongs to the process but is on disk. The MMU raises a page fault; the OS loads the page into a free frame, updates this entry and restarts the instruction.` });
    } else {
      frames.push({ ...base, showSplit: true, pageBits: pageBin, offsetBits: offsetBin, lookup: t.page,
        text: `Look up entry ${t.page} in the page table: page ${t.page} is in frame ${t.frame}. (A TLB hit would give the same answer without reading the table from memory.)` });
      const frameBin = t.frame.toString(2);
      frames.push({ ...base, showSplit: true, pageBits: pageBin, offsetBits: offsetBin, lookup: t.page, verdict: 'ok',
        physBits: [frameBin, offsetBin],
        result: `Physical address = ${t.frame} × ${pageSize} + ${t.offset} = ${t.physical}`,
        text: `Replace the page number with the frame number and keep the offset: physical = frame × page size + offset = ${t.frame} × ${pageSize} + ${t.offset} = ${t.physical}.` });
    }
    stepper.load(frames[0], frames.slice(1));
  }

  for (const c of [table, address]) c.addEventListener('change', start);
  size.addEventListener('change', start);
  start();
  return stepper;
}
