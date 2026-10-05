// One packet, hop by hop: which header fields change where.
//
//   scenario → path of devices → at each hop: what the device reads, what it
//   rewrites, and the full header (MACs, IPs, ports, TTL) with changes marked.
//
// Rule the learner should discover: MACs change on every link, TTL at every
// router, IP addresses and ports only at NAT.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { select } from './network-common.js';

const SCENARIOS = {
  remote: 'Laptop → web server on the Internet (through NAT)',
  local: 'Laptop → printer on the same LAN',
  reply: 'Web server → laptop (the reply, translated back)',
};

const FIELDS = ['Source MAC', 'Destination MAC', 'Source IP', 'Destination IP', 'Source port', 'Destination port', 'TTL'];

export function mount(root, { options }) {
  const scenario = select(SCENARIOS, options.scenario || 'remote');
  root.append(el('div', { class: 'viz-form' }, field('Packet', scenario)));
  const lane = el('ol', { class: 'flow-lane' });
  const what = el('p', { class: 'flow-status' });
  const table = el('table', { class: 'viz-table' });
  root.append(el('div', { class: 'viz-stage' }, lane, what,
    el('p', { class: 'tree-side-title ps-title' }, 'Headers on this link'),
    el('div', { class: 'table-wrap', tabindex: 0, role: 'region', 'aria-label': 'Header fields on the current link' }, table)));
  const stepper = createStepper(root, { render, playDelay: 2200, nextLabel: 'Next hop' });

  let path = [];
  function start() {
    const built = build(scenario.value);
    path = built.path;
    lane.replaceChildren(...path.map(([id, label]) => el('li', { class: 'flow-node', 'data-node': id }, el('span', {}, label))));
    stepper.load(built.frames[0], built.frames.slice(1));
  }

  function render(frame) {
    for (const li of lane.children) {
      const id = li.dataset.node;
      li.className = ['flow-node', id === frame.at ? 'is-current' : '', frame.visited.includes(id) ? 'is-visited' : ''].join(' ');
      li.toggleAttribute('aria-current', id === frame.at);
    }
    what.textContent = frame.device;
    what.className = 'flow-status';
    table.replaceChildren(
      el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, 'Field'), el('th', { scope: 'col' }, 'Value'), el('th', { scope: 'col' }, 'Changed here?'))),
      el('tbody', {}, FIELDS.map((f, i) => el('tr', { class: frame.changed.includes(i) ? 'is-changed' : '' },
        el('th', { scope: 'row' }, f), el('td', {}, frame.header[i]), el('td', {}, frame.changed.includes(i) ? 'changed' : '—')))));
  }

  scenario.addEventListener('change', start);
  start();
  return stepper;
}

function build(name) {
  const frames = [];
  let visited = [];
  const push = (at, device, header, changed, text) => {
    visited = visited.includes(at) ? visited : [...visited, at];
    frames.push({ at, device, header, changed, text, visited });
  };

  if (name === 'local') {
    const path = [['lap', 'Laptop 192.168.1.10'], ['sw', 'Switch'], ['prn', 'Printer 192.168.1.50']];
    const h = ['aa:…:10 (laptop)', 'cc:…:50 (printer)', '192.168.1.10', '192.168.1.50', '52200', '9100', '64'];
    push('lap', 'Laptop: same subnet → ARP for the printer itself', h, [0, 1, 2, 3, 4, 5, 6],
      'The printer is in 192.168.1.0/24 like the laptop, so the laptop ARPs for the PRINTER\'s MAC and addresses the frame directly to it. TTL starts at 64.');
    push('sw', 'Switch: reads the destination MAC only', h, [],
      'The switch looks up cc:…:50 in its MAC table and forwards the frame out of the printer\'s port. It changes NOTHING — not the MACs, not the TTL. It never looks at IP addresses.');
    push('prn', 'Printer: accepts the frame and the packet', h, [],
      'The printer\'s NIC sees its own MAC, IP sees its own address, TCP hands the data to the print service on port 9100. Same-LAN delivery: no router, TTL still 64.');
    return { path, frames };
  }

  const path = [['lap', 'Laptop'], ['sw', 'Switch'], ['r1', 'Home router + NAT'], ['isp', 'ISP router'], ['r3', 'Data-centre router'], ['srv', 'Web server 203.0.113.10']];

  if (name === 'reply') {
    path.reverse();
    let h = ['srv MAC', 'r3 MAC (gateway)', '203.0.113.10', '198.51.100.7', '443', '40001', '64'];
    push('srv', 'Server: replies to the address it saw — the public NAT address', h, [0, 1, 2, 3, 4, 5, 6],
      'The server answers the source it saw: 198.51.100.7:40001 — the router\'s public address, not the laptop. It sends the frame to its own default gateway.');
    h = ['r3 out MAC', 'isp MAC', '203.0.113.10', '198.51.100.7', '443', '40001', '63'];
    push('r3', 'Router: new frame, TTL − 1', h, [0, 1, 6], 'The data-centre router routes by destination IP (longest prefix match), decrements TTL to 63 and builds a new frame for the next link.');
    h = ['isp out MAC', 'r1 WAN MAC', '203.0.113.10', '198.51.100.7', '443', '40001', '62'];
    push('isp', 'Router: new frame, TTL − 1', h, [0, 1, 6], 'The ISP router does the same: new MACs, TTL 62. The IP addresses are untouched.');
    h = ['r1 LAN MAC', 'aa:…:23 (laptop)', '203.0.113.10', '192.168.1.23', '443', '52100', '61'];
    push('r1', 'Home router: NAT translates the DESTINATION back', h, [0, 1, 3, 5, 6],
      'The home router finds public port 40001 in its NAT table → 192.168.1.23:52100. It rewrites the destination IP and port, decrements TTL and delivers on the LAN using the laptop\'s MAC.');
    push('sw', 'Switch: forwards unchanged', h, [], 'The switch forwards the frame to the laptop\'s port without changing it.');
    push('lap', 'Laptop: TCP delivers to port 52100', h, [], 'The laptop receives a reply addressed to exactly the IP and port it used. NAT was invisible to both ends.');
    return { path, frames };
  }

  let h = ['aa:…:23 (laptop)', 'a4:…:01 (router LAN)', '192.168.1.23', '203.0.113.10', '52100', '443', '64'];
  push('lap', 'Laptop: remote destination → frame to the GATEWAY', h, [0, 1, 2, 3, 4, 5, 6],
    'The destination 203.0.113.10 is outside 192.168.1.0/24, so the laptop sends the frame to its default gateway\'s MAC (found by ARP) while the IP packet is addressed to the server.');
  push('sw', 'Switch: forwards by destination MAC, changes nothing', h, [],
    'The switch forwards the frame to the router\'s port. Frames are not modified by switches; TTL is untouched.');
  h = ['r1 WAN MAC', 'isp MAC', '198.51.100.7', '203.0.113.10', '40001', '443', '63'];
  push('r1', 'Home router: routes, TTL − 1, and NAT rewrites the SOURCE', h, [0, 1, 2, 4, 6],
    'The home router strips the old frame, routes the packet (default route → ISP), decrements TTL to 63, and — because it does PAT — replaces the private source 192.168.1.23:52100 with its public address 198.51.100.7:40001, remembering the mapping. Then it builds a new frame for the WAN link.');
  h = ['isp out MAC', 'r3 MAC', '198.51.100.7', '203.0.113.10', '40001', '443', '62'];
  push('isp', 'ISP router: new frame, TTL − 1 — IPs and ports unchanged', h, [0, 1, 6],
    'A plain router: longest prefix match on 203.0.113.10, TTL 62, new MAC addresses for the next link. It does not read the ports. (Real paths cross many such routers.)');
  h = ['r3 out MAC', 'srv MAC', '198.51.100.7', '203.0.113.10', '40001', '443', '61'];
  push('r3', 'Last router: ARP for the server on its LAN', h, [0, 1, 6],
    'The last router finds 203.0.113.10 on a directly connected network, ARPs for the server\'s MAC and delivers the frame. TTL is now 61.');
  push('srv', 'Server: accepts; TCP hands it to port 443', h, [],
    'The server sees source 198.51.100.7:40001 — the NAT\'s public address. Summary: MACs changed on every link, TTL at every router (3), IP and port only at NAT.');
  return { path, frames };
}
