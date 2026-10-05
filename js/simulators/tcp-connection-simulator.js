// TCP connection setup and teardown, segment by segment.
//
//   scenario + client ISN → frames: each segment with flags, seq/ack numbers,
//   and both endpoints' TCP state after it.
//
// One module serves two interactions through options.group:
//   'open'  — three-way handshake, refused (RST), filtered (SYN dropped → timeout)
//   'close' — four-way termination with TIME_WAIT, three-segment close, reset
// Numbers follow the real rules: SYN and FIN each consume one sequence number,
// data consumes one per byte, ACK = next byte expected.

import { el } from '../util.js';
import { createStepper, field, errorLine } from '../engagement/stepper.js';
import { select, sequenceView } from './network-common.js';

const GROUPS = {
  open: {
    handshake: 'Normal three-way handshake + first data',
    refused: 'Nothing listening on the port (refused)',
    filtered: 'Firewall drops the SYN (timeout)',
  },
  close: {
    fourway: 'Four-way termination (client closes first)',
    combined: 'Three-segment close (FIN-ACK combined)',
    reset: 'Abort with RST (application crashes)',
  },
};

const SERVER_ISN = 5000;

export function mount(root, { options }) {
  const group = GROUPS[options.group] ? options.group : 'open';
  const scenario = select(GROUPS[group], options.scenario);
  const isn = el('input', { class: 'input', type: 'number', min: 0, max: 4294967295, value: options.isn ?? 1000, inputmode: 'numeric' });
  const error = errorLine();
  root.append(el('div', { class: 'viz-form' }, field('Scenario', scenario), field('Client initial sequence number', isn, 'Any number; real stacks pick it randomly')), error.node);

  const seq = sequenceView([{ id: 'c', label: 'Client 192.168.1.23:52100' }, { id: 's', label: 'Server 203.0.113.10:443' }]);
  const note = el('p', { class: 'viz-note' });
  root.append(el('div', { class: 'viz-stage' }, seq.node, note));
  const stepper = createStepper(root, { render, playDelay: 1700, nextLabel: 'Next segment' });

  function render(frame) {
    seq.render(frame);
    note.textContent = frame.rtt != null ? `Round trips used so far: ${frame.rtt}` : '';
  }

  function start() {
    const x = Number(isn.value);
    if (!Number.isInteger(x) || x < 0 || x > 4294967295) {
      error.show('Enter a whole number between 0 and 4294967295.');
      return;
    }
    error.clear();
    const frames = build(scenario.value, x);
    stepper.load(frames[0], frames.slice(1));
  }

  scenario.addEventListener('change', start);
  isn.addEventListener('change', start);
  start();
  return stepper;
}

/** Builds every frame of a scenario. Each frame carries the full log so Back is trivial. */
function build(name, x) {
  const y = SERVER_ISN;
  const frames = [];
  let log = [];
  const push = (states, message, text, extra = {}) => {
    if (message) log = [...log, message];
    frames.push({ states, log, text, ...extra });
  };

  if (name === 'handshake' || name === 'refused' || name === 'filtered') {
    push({ c: 'CLOSED', s: name === 'refused' ? 'nothing listening on :443' : 'LISTEN' }, null,
      name === 'refused'
        ? 'The server host is up, but no application has a listening socket on port 443. The client calls connect().'
        : `The server application listens on port 443 (state LISTEN). The client calls connect(); its OS picks the ephemeral port 52100 and a random initial sequence number — here ${x}.`, { rtt: 0 });
  }

  if (name === 'handshake') {
    push({ c: 'SYN-SENT', s: 'LISTEN' }, { from: 'c', to: 's', label: `SYN  seq=${x}`, note: 'options: MSS 1460, window scale, SACK permitted' },
      `Client → SYN with seq=${x}: "I want to connect; my byte numbering starts after ${x}." The SYN carries no data but consumes one sequence number. Client state: SYN-SENT.`, { rtt: 0 });
    push({ c: 'SYN-SENT', s: 'SYN-RECEIVED' }, { from: 's', to: 'c', label: `SYN-ACK  seq=${y} ack=${x + 1}` },
      `Server → SYN-ACK: its own ISN ${y}, and ack=${x + 1} = "I received your SYN; the next byte I expect from you is ${x + 1}." The server's kernel keeps a half-open entry in its SYN queue. Server state: SYN-RECEIVED.`, { rtt: 1 });
    push({ c: 'ESTABLISHED', s: 'ESTABLISHED' }, { from: 'c', to: 's', label: `ACK  seq=${x + 1} ack=${y + 1}` },
      `Client → ACK with ack=${y + 1}: "I received your SYN." Both ISNs are now sent and acknowledged, so both sides are ESTABLISHED. The connection moves to the server's accept queue; accept() returns it to the application. One round trip has passed.`, { rtt: 1 });
    push({ c: 'ESTABLISHED', s: 'ESTABLISHED' }, { from: 'c', to: 's', label: `PSH,ACK  seq=${x + 1} ack=${y + 1}  len=100`, note: 'first 100 bytes: the request' },
      `The first data segment carries bytes ${x + 1}–${x + 100} (100 bytes). Sequence numbers count bytes, not segments. (TLS for HTTPS would start here: its ClientHello is this first data.)`, { rtt: 1 });
    push({ c: 'ESTABLISHED', s: 'ESTABLISHED' }, { from: 's', to: 'c', label: `ACK  seq=${y + 1} ack=${x + 101}` },
      `Server → ACK ${x + 101}: "I have every byte up to ${x + 100}; send ${x + 101} next." ACKs are cumulative and name the next byte expected.`, { rtt: 2 });
  }

  if (name === 'refused') {
    push({ c: 'SYN-SENT', s: 'nothing listening on :443' }, { from: 'c', to: 's', label: `SYN  seq=${x}` },
      `Client → SYN seq=${x}. The packet reaches the server host — the network path works.`, { rtt: 0 });
    push({ c: 'CLOSED — "Connection refused"', s: 'nothing listening on :443' }, { from: 's', to: 'c', label: `RST,ACK  seq=0 ack=${x + 1}` },
      'The server\'s kernel finds no socket for port 443 and answers with RST. The client fails immediately: "Connection refused" (curl error 7, java.net.ConnectException). Check that the service runs, the port, and that it is not bound only to 127.0.0.1.', { rtt: 1 });
  }

  if (name === 'filtered') {
    let waited = 0;
    [1, 2, 4, 8].forEach((delay, i) => {
      push({ c: 'SYN-SENT', s: 'LISTEN (never sees the SYN)' }, { from: 'c', to: 's', label: `SYN  seq=${x}${i ? ' (retransmission)' : ''}`, lost: true, note: i ? `sent after waiting ${delay / 2} s more` : 'dropped by a firewall' },
        i === 0
          ? 'Client → SYN. A firewall or security group between them silently drops it. No RST, no ICMP — nothing comes back.'
          : `No reply, so the client retransmits the same SYN, doubling the wait each time (exponential back-off). Total waited so far: ${waited} s.`, { rtt: null });
      waited += delay;
    });
    push({ c: 'CLOSED — "Connection timed out"', s: 'LISTEN' }, { label: `No answer after 4 tries (SYNs at 0, 1, 3 and 7 s); the app's ${waited} s connect timeout fires. Without one, Linux keeps retrying for about 127 s.`, marker: true },
      'The client gives up: "Connection timed out" (curl error 28, SocketTimeoutException). Silence points to a firewall drop, a wrong IP or route, or a host that is down — compare with "refused", which proves the host answered.', { rtt: null });
  }

  const c = x + 101; // client's next sequence number after the handshake + 100 bytes
  const s = y + 1;
  if (name === 'fourway' || name === 'combined' || name === 'reset') {
    push({ c: 'ESTABLISHED', s: 'ESTABLISHED' }, null,
      `An established connection. The client has sent bytes up to ${c - 1}, so its next sequence number is ${c}; the server's next is ${s}.`);
  }

  if (name === 'fourway') {
    push({ c: 'FIN-WAIT-1', s: 'CLOSE-WAIT' }, { from: 'c', to: 's', label: `FIN,ACK  seq=${c} ack=${s}` },
      `The client application calls close(): its TCP sends FIN ("I have no more data"). Like SYN, FIN consumes one sequence number. The server's application will read end-of-stream; server state CLOSE-WAIT. The client is the active closer.`);
    push({ c: 'FIN-WAIT-2', s: 'CLOSE-WAIT' }, { from: 's', to: 'c', label: `ACK  seq=${s} ack=${c + 1}` },
      `Server → ACK ${c + 1}. Only the client→server direction is closed — a half-close. The server may still send data.`);
    push({ c: 'FIN-WAIT-2', s: 'CLOSE-WAIT' }, { from: 's', to: 'c', label: `PSH,ACK  seq=${s} ack=${c + 1}  len=200`, note: 'the rest of the response' },
      `The server still had 200 bytes to send (bytes ${s}–${s + 199}). This is why termination needs separate FINs: each direction closes on its own schedule.`);
    push({ c: 'FIN-WAIT-2', s: 'CLOSE-WAIT' }, { from: 'c', to: 's', label: `ACK  seq=${c + 1} ack=${s + 200}` },
      `The client acknowledges the data (ack ${s + 200}). A closed sending direction can still receive and ACK.`);
    push({ c: 'FIN-WAIT-2', s: 'LAST-ACK' }, { from: 's', to: 'c', label: `FIN,ACK  seq=${s + 200} ack=${c + 1}` },
      'The server application calls close(); its FIN closes the server→client direction. Server state LAST-ACK. (If the server application never called close(), it would stay in CLOSE-WAIT forever — a connection leak.)');
    push({ c: 'TIME-WAIT', s: 'CLOSED' }, { from: 'c', to: 's', label: `ACK  seq=${c + 1} ack=${s + 201}` },
      `Client → final ACK ${s + 201}. The server is CLOSED. The client enters TIME-WAIT: it must stay able to re-ACK if this ACK is lost, and old duplicate segments must expire before this 4-tuple is reused.`);
    push({ c: 'CLOSED', s: 'CLOSED' }, { label: 'TIME-WAIT expires after 2 × MSL (60 s on Linux)', marker: true },
      'After 2 × MSL the client forgets the connection. TIME-WAIT is on whichever side closed first; clients and proxies that open many short connections collect thousands of them — reuse connections instead.');
  }

  if (name === 'combined') {
    push({ c: 'FIN-WAIT-1', s: 'CLOSE-WAIT' }, { from: 'c', to: 's', label: `FIN,ACK  seq=${c} ack=${s}` },
      'The client closes first and sends FIN.');
    push({ c: 'TIME-WAIT', s: 'LAST-ACK' }, { from: 's', to: 'c', label: `FIN,ACK  seq=${s} ack=${c + 1}` },
      'The server had nothing left to send, so its application closed immediately and the server combined its ACK and its own FIN into one segment.');
    push({ c: 'TIME-WAIT', s: 'CLOSED' }, { from: 'c', to: 's', label: `ACK  seq=${c + 1} ack=${s + 1}` },
      'The final ACK. Three segments instead of four — still a valid TCP close. The client waits in TIME-WAIT, the server is CLOSED.');
  }

  if (name === 'reset') {
    push({ c: 'ESTABLISHED', s: 'process crashed' }, { from: 's', to: 'c', label: `RST  seq=${s}` },
      'The server process crashes (or closes a socket that still has unread data). Its kernel aborts the connection with RST: no FIN exchange, no TIME-WAIT, unsent data is discarded.');
    push({ c: 'CLOSED — "Connection reset by peer"', s: 'CLOSED' }, { label: 'client read() / write() fails', marker: true },
      'The client\'s next read or write fails with "connection reset by peer". The same RST also appears when a load balancer or NAT has dropped an idle connection and later sees a packet for it.');
  }

  return frames;
}
