// PAT on a home router: how many private devices share one public IP.
//
//   events → the packet before and after the router + the translation table.
//
// Outbound connections create mappings (private IP:port ↔ public port);
// replies are translated back by port; unsolicited inbound traffic has no
// mapping and is dropped unless a port-forwarding rule exists; idle mappings
// expire. Addresses are documentation ranges.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { sequenceView, tableView } from './network-common.js';

const PUBLIC = '198.51.100.7';
const SERVER = '203.0.113.10';

export function mount(root, { options }) {
  const forward = el('input', { type: 'checkbox' });
  forward.checked = Boolean(options.portForward);
  const label = el('label', { class: 'perm-special' }, forward, ' Port forwarding rule: public TCP 8080 → 192.168.1.10:8080');
  root.append(el('div', { class: 'viz-form' }, label));

  const seq = sequenceView([
    { id: 'lap', label: 'Laptop 192.168.1.10' }, { id: 'ph', label: 'Phone 192.168.1.11' },
    { id: 'nat', label: `Router (NAT) public ${PUBLIC}` }, { id: 'net', label: 'Internet hosts' },
  ]);
  const before = tableView('Packet before the router', ['Source', 'Destination']);
  const after = tableView('Packet after the router', ['Source', 'Destination']);
  const table = tableView('NAT translation table', ['Proto', 'Inside (private)', 'Outside (public)', 'Remote']);
  root.append(el('div', { class: 'viz-stage net-two-col' }, seq.node, el('div', {}, before.node, after.node, table.node)));
  const stepper = createStepper(root, { render, playDelay: 2200, nextLabel: 'Next packet' });

  function render(frame) {
    seq.render(frame);
    before.render(frame.before ? [frame.before] : [], { empty: '—' });
    after.render(frame.after ? [frame.after] : [], { empty: frame.dropped ? 'DROPPED — no matching entry' : '—' });
    table.render(frame.table, { highlight: frame.hit != null ? [frame.hit] : [], empty: '(no mappings)' });
  }
  function start() {
    const frames = build(forward.checked);
    stepper.load(frames[0], frames.slice(1));
  }
  forward.addEventListener('change', start);
  start();
  return stepper;
}

function build(forwarding) {
  const frames = [];
  let log = [];
  let table = forwarding ? [['TCP', '192.168.1.10:8080', `${PUBLIC}:8080`, '* (static rule)']] : [];
  const push = (text, o = {}) => frames.push({ log, table, text, states: o.states || {}, active: o.active, before: o.before, after: o.after, hit: o.hit, dropped: o.dropped });
  const base = forwarding ? 1 : 0;

  push(`Two devices share one public address, ${PUBLIC}. Their own addresses (192.168.1.x) are private and cannot be routed on the Internet, so the router must rewrite every packet that crosses it.${forwarding ? ' A static port-forwarding rule is already configured.' : ''}`,
    { states: { nat: `${table.length} mapping(s)` } });

  log = [...log, { from: 'lap', to: 'nat', label: `SYN 192.168.1.10:52100 → ${SERVER}:443` }];
  table = [...table, ['TCP', '192.168.1.10:52100', `${PUBLIC}:40001`, `${SERVER}:443`]];
  log = [...log, { from: 'nat', to: 'net', label: `SYN ${PUBLIC}:40001 → ${SERVER}:443` }];
  push('The laptop opens an HTTPS connection from its ephemeral port 52100. The router rewrites the SOURCE address and port to its public IP and a free public port (40001), records the mapping, and recomputes the checksums. The destination is unchanged.',
    { states: { lap: 'connecting', nat: `${table.length} mapping(s)` }, active: ['lap', 'nat'], hit: base,
      before: [`192.168.1.10:52100`, `${SERVER}:443`], after: [`${PUBLIC}:40001`, `${SERVER}:443`] });

  log = [...log, { from: 'ph', to: 'nat', label: `SYN 192.168.1.11:52100 → ${SERVER}:443` }];
  table = [...table, ['TCP', '192.168.1.11:52100', `${PUBLIC}:40002`, `${SERVER}:443`]];
  log = [...log, { from: 'nat', to: 'net', label: `SYN ${PUBLIC}:40002 → ${SERVER}:443` }];
  push('The phone happens to use the SAME private source port, 52100, to the same server. The router gives it a different public port, 40002 — that is the whole trick of PAT: the public port tells the two connections apart.',
    { states: { ph: 'connecting', nat: `${table.length} mapping(s)` }, active: ['ph', 'nat'], hit: base + 1,
      before: [`192.168.1.11:52100`, `${SERVER}:443`], after: [`${PUBLIC}:40002`, `${SERVER}:443`] });

  log = [...log, { from: 'net', to: 'nat', label: `SYN-ACK ${SERVER}:443 → ${PUBLIC}:40002` }];
  log = [...log, { from: 'nat', to: 'ph', label: `SYN-ACK ${SERVER}:443 → 192.168.1.11:52100` }];
  push('A reply arrives for public port 40002. The router looks the port up in the table and rewrites the DESTINATION back to 192.168.1.11:52100 — the phone. The server never learns the private address.',
    { states: { ph: 'connected', nat: 'translated reply' }, active: ['net', 'nat', 'ph'], hit: base + 1,
      before: [`${SERVER}:443`, `${PUBLIC}:40002`], after: [`${SERVER}:443`, `192.168.1.11:52100`] });

  log = [...log, { from: 'net', to: 'nat', label: `SYN-ACK ${SERVER}:443 → ${PUBLIC}:40001` }];
  log = [...log, { from: 'nat', to: 'lap', label: `SYN-ACK ${SERVER}:443 → 192.168.1.10:52100` }];
  push('The reply for port 40001 goes back to the laptop the same way.', {
    states: { lap: 'connected', nat: 'translated reply' }, active: ['net', 'nat', 'lap'], hit: base,
    before: [`${SERVER}:443`, `${PUBLIC}:40001`], after: [`${SERVER}:443`, `192.168.1.10:52100`] });

  if (forwarding) {
    log = [...log, { from: 'net', to: 'nat', label: `SYN 192.0.2.99:61000 → ${PUBLIC}:8080` }];
    log = [...log, { from: 'nat', to: 'lap', label: 'SYN 192.0.2.99:61000 → 192.168.1.10:8080' }];
    push('A friend on the Internet connects to the public IP on port 8080. Nobody inside started this connection, but the static port-forwarding rule matches, so the router rewrites the destination to the laptop. (The laptop must still listen on 8080 and its firewall must allow it.)',
      { states: { lap: 'incoming on :8080', nat: 'forwarded (static rule)' }, active: ['net', 'nat', 'lap'], hit: 0,
        before: ['192.0.2.99:61000', `${PUBLIC}:8080`], after: ['192.0.2.99:61000', '192.168.1.10:8080'] });
  } else {
    log = [...log, { from: 'net', to: 'nat', label: `SYN 192.0.2.99:61000 → ${PUBLIC}:8080`, lost: true, note: 'no mapping' }];
    push('Someone on the Internet tries to connect to the public IP on port 8080. There is no mapping for 8080 — no inside device asked for this — so the router drops it. This side effect is why NAT "hides" devices, but it is not a security policy. Tick the port-forwarding box to see the alternative.',
      { states: { nat: 'dropped unsolicited inbound' }, active: ['net', 'nat'], dropped: true,
        before: ['192.0.2.99:61000', `${PUBLIC}:8080`] });
  }

  table = table.filter((row) => row[1] !== '192.168.1.11:52100');
  log = [...log, { marker: true, label: 'The phone\'s connection goes idle for longer than the NAT idle timeout' }];
  push('Mappings are not permanent. The phone\'s connection sat idle longer than the router\'s timeout, so its entry was removed. The phone still believes the connection is open.',
    { states: { ph: 'thinks it is still connected', nat: `${table.length} mapping(s)` }, active: ['nat'] });

  log = [...log, { from: 'net', to: 'nat', label: `Data ${SERVER}:443 → ${PUBLIC}:40002`, lost: true, note: 'mapping expired' }];
  push('A late packet from the server for port 40002 arrives — no mapping any more, so it is dropped (or answered with RST). The phone sees a hung or reset connection. Fix in applications: TCP/HTTP keep-alives shorter than the NAT timeout, and connection pools that retire idle connections.',
    { states: { ph: 'connection silently broken', nat: 'dropped' }, active: ['net', 'nat'], dropped: true,
      before: [`${SERVER}:443`, `${PUBLIC}:40002`] });
  return frames;
}
