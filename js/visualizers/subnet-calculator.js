// Subnet calculator that shows its work.
//
//   IP + prefix → binary octets with network/host bits marked → AND with the
//   mask → network address → host bits set to 1 → broadcast → range and count,
//   plus the block-size shortcut that gives the same answer without binary.

import { el } from '../util.js';
import { createStepper, field, errorLine } from '../engagement/stepper.js';

export function mount(root, { options }) {
  const ip = el('input', { class: 'input', value: options.ip || '192.168.10.77', inputmode: 'decimal', spellcheck: 'false', autocomplete: 'off' });
  const prefix = el('input', { class: 'input', type: 'number', min: 1, max: 30, value: options.prefix ?? 26 });
  const go = el('button', { type: 'button', class: 'btn btn-secondary' }, 'Calculate');
  const error = errorLine();
  root.append(el('div', { class: 'viz-form' }, field('IPv4 address', ip), field('Prefix length /n', prefix, '1 to 30'), go), error.node);

  const grid = el('table', { class: 'viz-table bits-table' });
  const facts = el('dl', { class: 'viz-stats' });
  root.append(el('div', { class: 'viz-stage' },
    el('div', { class: 'table-wrap', tabindex: 0, role: 'region', 'aria-label': 'Address bits' }, grid), facts));
  const stepper = createStepper(root, { render, playDelay: 2000, nextLabel: 'Next step' });

  function start() {
    const octets = ip.value.trim().split('.');
    const n = Number(prefix.value);
    if (octets.length !== 4 || octets.some((o) => !/^\d{1,3}$/.test(o) || Number(o) > 255)) {
      error.show('Enter an IPv4 address like 192.168.10.77 (four numbers from 0 to 255).');
      return;
    }
    if (!Number.isInteger(n) || n < 1 || n > 30) {
      error.show('Enter a prefix length from 1 to 30.');
      return;
    }
    error.clear();
    const frames = build(octets.map(Number), n);
    stepper.load(frames[0], frames.slice(1));
  }

  function render(frame) {
    const rows = frame.rows.map(([label, values, cls]) => el('tr', { class: cls || '' },
      el('th', { scope: 'row' }, label),
      values.map((v, i) => el('td', {}, typeof v === 'string' ? v : bitsCell(v, i, frame.prefix)))));
    grid.replaceChildren(
      el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, ''), [1, 2, 3, 4].map((i) => el('th', { scope: 'col' }, `Octet ${i}`)))),
      el('tbody', {}, rows));
    facts.replaceChildren(...frame.facts.map(([k, v]) => el('div', {}, el('dt', {}, k), el('dd', {}, v))));
  }

  go.addEventListener('click', start);
  for (const input of [ip, prefix]) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); });
  start();
  return stepper;
}

/** One octet as 8 bits; network bits and host bits get different classes. */
function bitsCell(octet, index, prefix) {
  const bits = octet.toString(2).padStart(8, '0').split('');
  return el('span', { class: 'bits', 'aria-label': `${octet} = ${bits.join('')}` },
    bits.map((b, j) => el('span', { class: index * 8 + j < prefix ? 'bit-net' : 'bit-host' }, b)),
    el('span', { class: 'bits-dec' }, ` = ${octet}`));
}

const toNum = (o) => ((o[0] * 256 + o[1]) * 256 + o[2]) * 256 + o[3];
const toOctets = (n) => [Math.floor(n / 16777216) % 256, Math.floor(n / 65536) % 256, Math.floor(n / 256) % 256, n % 256];
const dotted = (o) => o.join('.');

function build(octets, prefix) {
  const size = 2 ** (32 - prefix);
  const maskNum = 2 ** 32 - size;
  const mask = toOctets(maskNum);
  const ipNum = toNum(octets);
  const network = toOctets(Math.floor(ipNum / size) * size);
  const broadcast = toOctets(Math.floor(ipNum / size) * size + size - 1);
  const first = toOctets(toNum(network) + 1);
  const last = toOctets(toNum(broadcast) - 1);
  const k = Math.floor((prefix - 1) / 8);            // the "interesting" octet (0-based)
  const block = 256 - mask[k];
  const rowsIp = ['IP address', octets];
  const rowsMask = ['Subnet mask', mask];
  const kind = ipNum === toNum(network) ? 'the NETWORK address — not usable by a host'
    : ipNum === toNum(broadcast) ? 'the BROADCAST address — not usable by a host' : 'a usable host address';
  const facts = [];
  const frames = [];
  const push = (rows, text, extra = []) => {
    facts.push(...extra);
    frames.push({ rows, prefix, text, facts: [...facts] });
  };

  push([rowsIp], `Write ${dotted(octets)} in binary. Each octet is 8 bits; the whole address is 32 bits. Bits in the first ${prefix} positions (accent colour) are the NETWORK part; the remaining ${32 - prefix} are the HOST part.`);
  push([rowsIp, rowsMask], `/${prefix} means ${prefix} ones followed by ${32 - prefix} zeros: mask ${dotted(mask)}.`, [['Mask', dotted(mask)]]);
  push([rowsIp, rowsMask, ['IP AND mask = network', network, 'is-current']],
    `AND the address with the mask bit by bit: network bits are kept, host bits become 0. Network address = ${dotted(network)}.`, [['Network', dotted(network)]]);
  push([rowsIp, rowsMask, ['Network', network], ['Host bits all 1 = broadcast', broadcast, 'is-current']],
    `Set every host bit to 1 to get the broadcast address: ${dotted(broadcast)}.`, [['Broadcast', dotted(broadcast)]]);
  push([rowsIp, rowsMask, ['Network', network], ['Broadcast', broadcast], ['First host', first], ['Last host', last]],
    `Usable hosts lie strictly between them: ${dotted(first)} to ${dotted(last)} — 2^${32 - prefix} − 2 = ${(size - 2).toLocaleString('en-US')} addresses.`,
    [['Host range', `${dotted(first)} – ${dotted(last)}`], ['Usable hosts', (size - 2).toLocaleString('en-US')]]);
  push([rowsIp, rowsMask, ['Network', network], ['Broadcast', broadcast]],
    `Shortcut (no binary): the interesting octet is octet ${k + 1} (mask value ${mask[k]}), so the block size is 256 − ${mask[k]} = ${block}. ${octets[k]} lies in the block starting at ${network[k]} (a multiple of ${block}); the next block starts at ${network[k] + block}, so the broadcast ends at ${network[k] + block - 1}${k < 3 ? ' with every later octet 255' : ''}. ${dotted(octets)} is ${kind}.`,
    [['Block size', `${block} in octet ${k + 1}`]]);
  return frames;
}
