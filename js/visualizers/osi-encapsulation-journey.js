// Encapsulation and decapsulation through the layers.
//
//   model (OSI / TCP/IP) → the sender adds one header per layer (and the
//   Ethernet trailer), the bits cross the wire, a router strips and rebuilds
//   Layer 2 and changes TTL, and the receiver removes the headers again.
//
// The message is an HTTPS request; header contents are the realistic fields
// each layer adds.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { select } from '../simulators/network-common.js';

const MODELS = { osi: 'OSI model (7 layers)', tcpip: 'TCP/IP model (5 layers)' };

const LAYERS = {
  osi: [['7', 'Application'], ['6', 'Presentation'], ['5', 'Session'], ['4', 'Transport'], ['3', 'Network'], ['2', 'Data Link'], ['1', 'Physical']],
  tcpip: [['5', 'Application'], ['4', 'Transport'], ['3', 'Network'], ['2', 'Data Link'], ['1', 'Physical']],
};

// Segments of the PDU, outermost first when rendered.
const SEG = {
  data: { label: 'HTTP: GET /orders', cls: 'pkt-data', fields: 'GET /orders HTTP/1.1 · Host: api.example.com · Cookie …' },
  tls: { label: 'TLS record', cls: 'pkt-tls', fields: 'content type, version, length + encrypted HTTP + auth tag' },
  tcp: { label: 'TCP', cls: 'pkt-tcp', fields: 'src port 52100 · dst port 443 · seq 1001 · ack 5001 · flags PSH,ACK · window' },
  ip: { label: 'IP', cls: 'pkt-ip', fields: 'src 192.168.1.23 · dst 203.0.113.10 · TTL 64 · protocol 6 (TCP)' },
  ipr: { label: 'IP', cls: 'pkt-ip', fields: 'src 192.168.1.23 · dst 203.0.113.10 · TTL 63 · protocol 6 (TCP)' },
  eth: { label: 'Ethernet', cls: 'pkt-eth', fields: 'dst MAC a4:…:01 (router) · src MAC aa:…:23 (laptop) · EtherType 0x0800' },
  ethr: { label: 'Ethernet', cls: 'pkt-eth', fields: 'dst MAC 52:…:9e (next hop) · src MAC 3c:…:02 (router WAN) · EtherType 0x0800' },
  fcs: { label: 'FCS', cls: 'pkt-eth', fields: 'CRC-32 over the frame' },
};

export function mount(root, { options }) {
  const model = select(MODELS, options.model || 'osi');
  root.append(el('div', { class: 'viz-form' }, field('Model', model)));

  const stack = el('ol', { class: 'flow-lane enc-stack', 'aria-label': 'Layers' });
  const where = el('p', { class: 'flow-status' });
  const pdu = el('div', { class: 'pkt-bar', role: 'img' });
  const detail = el('p', { class: 'viz-note' });
  root.append(el('div', { class: 'viz-stage' }, where, stack, el('p', { class: 'tree-side-title ps-title' }, 'The data unit right now'), pdu, detail));
  const stepper = createStepper(root, { render, playDelay: 1700, nextLabel: 'Next layer' });

  function render(frame) {
    stack.replaceChildren(...LAYERS[model.value].map(([n, name]) => el('li', {
      class: ['flow-node', frame.layer === n ? 'is-current' : '', frame.done.includes(n) ? 'is-visited' : ''].join(' '),
      'aria-current': frame.layer === n ? 'true' : null,
    }, el('span', {}, `L${n} ${name}`))));
    where.textContent = frame.where;
    const segs = frame.segs.map((k) => SEG[k]);
    pdu.replaceChildren(...(frame.bits
      ? [el('span', { class: 'pkt-seg pkt-bits' }, '010110010111010010110… (signals on the medium)')]
      : segs.map((s, i) => el('span', { class: `pkt-seg ${s.cls} ${frame.fresh === i ? 'is-new' : ''}` }, s.label))));
    pdu.setAttribute('aria-label', frame.bits ? 'Bits on the wire' : `Data unit: ${segs.map((s) => s.label).join(', ')}`);
    detail.textContent = frame.fresh != null && segs[frame.fresh] ? `${segs[frame.fresh].label} header: ${segs[frame.fresh].fields}` : frame.pduName || '';
  }

  function start() {
    const frames = build(model.value);
    stepper.load(frames[0], frames.slice(1));
  }
  model.addEventListener('change', start);
  start();
  return stepper;
}

function build(model) {
  const osi = model === 'osi';
  const top = osi ? '7' : '5';
  const frames = [];
  let done = [];
  const push = (where, layer, segs, text, extra = {}) => {
    if (layer && !done.includes(layer)) done = [...done, layer];
    frames.push({ where, layer, segs, text, done, ...extra });
  };
  const reset = () => { done = []; };

  push('Sender: laptop', top, ['data'], `The browser creates the HTTP request at the Application layer: just data, no addressing yet.`, { fresh: 0, pduName: 'PDU: data (message)' });
  if (osi) {
    push('Sender: laptop', '6', ['tls'], 'Presentation: TLS encrypts the HTTP data into a TLS record (also: encoding as UTF-8/JSON, compression). Observers will see only ciphertext.', { fresh: 0 });
    push('Sender: laptop', '5', ['tls'], 'Session: the dialogue is kept open (TLS session, HTTP keep-alive). No new header in the TCP/IP world — session functions live inside the application and TLS.', { pduName: 'PDU: data' });
  } else {
    push('Sender: laptop', '5', ['tls'], 'Still in the TCP/IP Application layer: TLS (part of the application layer here) encrypts the HTTP data into a TLS record.', { fresh: 0 });
  }
  const t = osi ? '4' : '4';
  push('Sender: laptop', t, ['tcp', 'tls'], 'Transport: TCP adds its header — ports select the application at each end, sequence and ACK numbers make it reliable. Data unit: a SEGMENT.', { fresh: 0, pduName: 'PDU: segment' });
  push('Sender: laptop', '3', ['ip', 'tcp', 'tls'], 'Network: IP adds its header — end-to-end source and destination addresses and a TTL of 64. Data unit: a PACKET.', { fresh: 0, pduName: 'PDU: packet' });
  push('Sender: laptop', '2', ['eth', 'ip', 'tcp', 'tls', 'fcs'], 'Data Link: Ethernet/Wi-Fi adds a header with MAC addresses — destination = the default GATEWAY (the server is remote) — and the only TRAILER: the FCS (CRC-32). Data unit: a FRAME.', { fresh: 0, pduName: 'PDU: frame' });
  push('Sender: laptop', '1', [], 'Physical: the NIC turns the frame into signals — radio for Wi-Fi, light in fibre further on.', { bits: true, pduName: 'PDU: bits' });

  reset();
  push('Router on the path', '1', [], 'A router receives the bits…', { bits: true });
  push('Router on the path', '2', ['eth', 'ip', 'tcp', 'tls', 'fcs'], '…checks the FCS and that the destination MAC is its own, then REMOVES the Ethernet header and trailer.', { pduName: 'Decapsulated up to Layer 3 only' });
  push('Router on the path', '3', ['ipr', 'tcp', 'tls'], 'It reads the destination IP, finds the route (longest prefix match) and DECREMENTS TTL 64 → 63. It never looks at TCP, TLS or HTTP: transport and above are end to end.', { fresh: 0, pduName: 'Packet: only TTL (and the IP checksum) changed' });
  push('Router on the path', '2', ['ethr', 'ipr', 'tcp', 'tls', 'fcs'], 'It builds a NEW frame for the next link: new source and destination MACs, new FCS. The IP addresses inside are unchanged (no NAT in this example).', { fresh: 0, pduName: 'New frame for the next link' });

  reset();
  push('Receiver: server', '1', [], 'After several more hops, the server\'s NIC receives the bits.', { bits: true });
  push('Receiver: server', '2', ['ethr', 'ipr', 'tcp', 'tls', 'fcs'], 'Data Link: the NIC checks the FCS and its own MAC, reads EtherType 0x0800 (IPv4), and strips header and trailer.', { pduName: 'Decapsulation: frame → packet' });
  push('Receiver: server', '3', ['ipr', 'tcp', 'tls'], 'Network: IP checks the destination address is its own, reads protocol 6 (TCP) and passes the payload up.', { pduName: 'packet → segment' });
  push('Receiver: server', '4', ['tcp', 'tls'], 'Transport: TCP uses the 4-tuple to find the connection, orders the bytes by sequence number, ACKs them, and hands the stream to the socket on port 443.', { pduName: 'segment → data' });
  push('Receiver: server', osi ? '6' : '5', ['tls'], 'TLS decrypts the record with the session key and verifies its integrity.', { pduName: 'data' });
  push('Receiver: server', top, ['data'], 'Application: Tomcat/Spring receive exactly the HTTP request the browser created. Each layer only read the header added by its peer on the other side.', { fresh: 0, pduName: 'Original data delivered' });
  return frames;
}
