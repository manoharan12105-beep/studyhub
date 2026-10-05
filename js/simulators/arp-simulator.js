// ARP, step by step: why a host needs it and whose MAC it asks for.
//
//   destination (same subnet / remote) + cache (empty / warm) →
//   decision with the subnet mask → cache lookup → broadcast request →
//   unicast reply → cache entry → the data frame that finally leaves.
//
// The LAN is 192.168.1.0/24 with PC A, PC B, a printer and the router
// (default gateway). Addresses are illustrative; the logic is the real one.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { select, sequenceView, tableView } from './network-common.js';

const HOSTS = {
  a: { ip: '192.168.1.10', mac: 'aa:aa:aa:00:00:10', label: 'PC A 192.168.1.10' },
  b: { ip: '192.168.1.20', mac: 'bb:bb:bb:00:00:20', label: 'PC B 192.168.1.20' },
  p: { ip: '192.168.1.50', mac: 'cc:cc:cc:00:00:50', label: 'Printer 192.168.1.50' },
  r: { ip: '192.168.1.1', mac: 'a4:91:b1:00:00:01', label: 'Router 192.168.1.1' },
};

const DESTINATIONS = {
  local: 'PC B 192.168.1.20 (same subnet)',
  remote: 'Web server 203.0.113.10 (another network)',
};
const CACHE = { empty: 'Empty (just booted)', warm: 'Already has the entry' };

export function mount(root, { options }) {
  const dest = select(DESTINATIONS, options.destination || 'local');
  const cache = select(CACHE, options.cache || 'empty');
  root.append(el('div', { class: 'viz-form' }, field('PC A sends to', dest), field('A\'s ARP cache', cache)));

  const seq = sequenceView([
    { id: 'a', label: HOSTS.a.label }, { id: 'b', label: HOSTS.b.label },
    { id: 'p', label: HOSTS.p.label }, { id: 'r', label: HOSTS.r.label },
    { id: 'all', label: 'Everyone (broadcast)' },
  ]);
  const arpTable = tableView('PC A\'s ARP cache (arp -a / ip neigh)', ['IP address', 'MAC address', 'State']);
  const frameTable = tableView('Frame A is building', ['Field', 'Value']);
  root.append(el('div', { class: 'viz-stage net-two-col' }, seq.node, el('div', {}, arpTable.node, frameTable.node)));
  const stepper = createStepper(root, { render, playDelay: 2000, nextLabel: 'Next step' });

  function render(frame) {
    seq.render(frame);
    arpTable.render(frame.cache, { highlight: frame.cacheHit != null ? [frame.cacheHit] : [], empty: '(no entries)' });
    frameTable.render(frame.frame, { highlight: frame.frameHighlight || [] });
  }

  function start() {
    const frames = build(dest.value, cache.value);
    stepper.load(frames[0], frames.slice(1));
  }

  dest.addEventListener('change', start);
  cache.addEventListener('change', start);
  start();
  return stepper;
}

function build(dest, cacheState) {
  const remote = dest === 'remote';
  const target = remote ? HOSTS.r : HOSTS.b;          // whose MAC A needs: the next hop
  const finalIp = remote ? '203.0.113.10' : HOSTS.b.ip; // the packet's destination IP
  const states = (extra = {}) => ({ a: '', b: '', p: '', r: '', all: '', ...extra });
  const frames = [];
  let log = [];
  let cache = cacheState === 'warm' ? [[target.ip, target.mac, 'REACHABLE']] : [];
  const frameRows = (mac) => [
    ['Destination MAC', mac || '?  (unknown)'],
    ['Source MAC', HOSTS.a.mac],
    ['EtherType', '0x0800 (IPv4)'],
    ['Source IP', HOSTS.a.ip],
    ['Destination IP', finalIp],
  ];
  const push = (text, extra = {}) => frames.push({ log, cache, frame: frameRows(null), states: states(), text, ...extra });

  push(`PC A wants to send an IP packet to ${finalIp}. It knows the IP address, but Ethernet delivers frames by MAC address — and the destination MAC is still unknown.`,
    { states: states({ a: 'has an IP packet to send' }), active: ['a'] });

  push(remote
    ? `Step 1 — local or remote? A ANDs both addresses with its mask 255.255.255.0: its network is 192.168.1.0, the destination's is 203.0.113.0 — different. So the next hop is the default gateway ${HOSTS.r.ip}. A will need the ROUTER's MAC, not the web server's.`
    : `Step 1 — local or remote? A ANDs both addresses with its mask 255.255.255.0: both give 192.168.1.0 — same subnet. So the next hop is PC B itself; A needs B's MAC.`,
  { states: states({ a: `next hop = ${target.ip}` }), active: ['a'] });

  if (cacheState === 'warm') {
    push(`Step 2 — A checks its ARP cache: hit! ${target.ip} is at ${target.mac}. No ARP traffic is needed.`,
      { states: states({ a: 'cache hit' }), cacheHit: 0, active: ['a'] });
  } else {
    push(`Step 2 — A checks its ARP cache for ${target.ip}: miss. The packet is queued while A asks.`,
      { states: states({ a: 'cache miss, packet queued' }), active: ['a'] });
    log = [...log, { from: 'a', to: 'all', label: `ARP request: Who has ${target.ip}? Tell ${HOSTS.a.ip}`, note: 'dst MAC ff:ff:ff:ff:ff:ff, EtherType 0x0806' }];
    push(`Step 3 — A broadcasts an ARP request. The switch floods it to every port in the VLAN, so B, the printer and the router all receive it. (The switch also learns which port A is on.)`,
      { states: states({ a: 'waiting for reply', b: 'received', p: 'received', r: 'received' }), active: ['a', 'b', 'p', 'r'] });
    push(`Every receiver compares the target IP with its own. ${remote ? 'PC B and the printer' : 'The printer and the router'} see it is not for them and ignore it. ${target === HOSTS.r ? 'The router' : 'PC B'} recognises its IP — and also caches A's IP → MAC from the request, since it will probably reply soon.`,
      { states: states({ a: 'waiting for reply', b: remote ? 'ignores' : 'it\'s me!', p: 'ignores', r: remote ? 'it\'s me!' : 'ignores' }), active: [remote ? 'r' : 'b'] });
    log = [...log, { from: remote ? 'r' : 'b', to: 'a', label: `ARP reply: ${target.ip} is at ${target.mac}`, note: 'unicast, straight to A' }];
    push(`Step 4 — ${remote ? 'The router' : 'PC B'} answers with a unicast ARP reply directly to A's MAC. Only A receives it.`,
      { states: states({ a: 'reply received' }), active: ['a'] });
    cache = [[target.ip, target.mac, 'REACHABLE']];
    push(`Step 5 — A stores ${target.ip} → ${target.mac} in its ARP cache. Entries expire after a while (seconds to minutes) so the cache follows devices that change.`,
      { states: states({ a: 'cache updated' }), cacheHit: 0, active: ['a'] });
  }

  log = [...log, { from: 'a', to: remote ? 'r' : 'b', label: `IPv4 frame: dst MAC ${target.mac}, dst IP ${finalIp}` }];
  frames.push({
    log, cache, states: states({ a: 'frame sent', [remote ? 'r' : 'b']: 'frame received' }), active: ['a', remote ? 'r' : 'b'],
    frame: frameRows(target.mac), frameHighlight: [0, 4],
    text: remote
      ? `Step ${cacheState === 'warm' ? 3 : 6} — The data frame leaves: destination MAC = the ROUTER, destination IP = the web server ${finalIp}. The router will strip this frame, route the packet and build a new frame for the next link — the server's MAC is never needed.`
      : `Step ${cacheState === 'warm' ? 3 : 6} — The data frame leaves: destination MAC = PC B, destination IP = PC B. The switch delivers it to B's port; no router is involved.`,
  });
  return frames;
}
