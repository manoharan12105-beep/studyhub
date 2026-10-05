// The TLS handshake behind HTTPS, simplified to what an interview needs.
//
//   scenario → TCP handshake → ClientHello → ServerHello (+ keys) →
//   Certificate → CertificateVerify → Finished → encrypted HTTP,
//   counting round trips and showing when traffic becomes encrypted.
//
// Failure scenarios show which check rejects a bad certificate; TLS 1.2 and
// resumption show why TLS 1.3 and session reuse are faster.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { select, sequenceView, tableView } from './network-common.js';

const SCENARIOS = {
  ok: 'TLS 1.3, valid certificate',
  expired: 'Certificate expired',
  hostname: 'Certificate for a different host name',
  tls12: 'TLS 1.2 (for comparison)',
  resume: 'TLS 1.3 resumption (returning visitor)',
};

export function mount(root, { options }) {
  const scenario = select(SCENARIOS, options.scenario || 'ok');
  root.append(el('div', { class: 'viz-form' }, field('Scenario', scenario)));
  const seq = sequenceView([{ id: 'c', label: 'Browser' }, { id: 's', label: 'api.example.com:443' }]);
  const keys = tableView('What each side knows', ['Item', 'Status']);
  const rtt = el('p', { class: 'viz-note' });
  root.append(el('div', { class: 'viz-stage net-two-col' }, seq.node, el('div', {}, keys.node, rtt)));
  const stepper = createStepper(root, { render, playDelay: 2100, nextLabel: 'Next message' });

  function render(frame) {
    seq.render(frame);
    keys.render(frame.keys, { highlight: frame.keysNew || [] });
    rtt.textContent = `Round trips used so far: ${frame.rtt}`;
  }
  function start() {
    const frames = build(scenario.value);
    stepper.load(frames[0], frames.slice(1));
  }
  scenario.addEventListener('change', start);
  start();
  return stepper;
}

function build(name) {
  const frames = [];
  let log = [];
  const k = { shared: 'not yet', identity: 'not verified', alpn: '—', cipher: '—' };
  const keyRows = () => [['Shared secret / session keys', k.shared], ['Server identity', k.identity], ['Application protocol (ALPN)', k.alpn], ['Cipher suite', k.cipher]];
  const push = (text, o = {}) => frames.push({ log, text, states: o.states || {}, active: o.active, keys: keyRows(), keysNew: o.keysNew, rtt: o.rtt ?? 0 });

  push('The browser wants https://api.example.com/orders. DNS gave it the IP; now it needs a TCP connection and then a TLS session before any HTTP byte is sent.',
    { states: { c: 'start', s: 'LISTEN :443' } });
  log = [...log, { from: 'c', to: 's', label: 'TCP SYN → SYN-ACK → ACK', note: 'TCP three-way handshake' }];
  push('TCP handshake first (1 round trip). TLS runs on top of the established TCP connection.', { states: { c: 'TCP established', s: 'TCP established' }, rtt: 1 });

  if (name === 'tls12') {
    log = [...log, { from: 'c', to: 's', label: 'ClientHello (versions, ciphers, random, SNI)' }];
    push('TLS 1.2: the ClientHello offers versions and cipher suites — but no key share yet.', { states: { c: 'waiting', s: 'choosing' }, rtt: 1 });
    log = [...log, { from: 's', to: 'c', label: 'ServerHello + Certificate + ServerKeyExchange + ServerHelloDone' }];
    k.identity = 'certificate received (in clear text)'; k.cipher = 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256';
    push('The server picks the cipher and sends its certificate (unencrypted in TLS 1.2) and its ECDHE parameters, signed.', { states: { c: 'verifying', s: 'waiting' }, keysNew: [1, 3], rtt: 2 });
    log = [...log, { from: 'c', to: 's', label: 'ClientKeyExchange + ChangeCipherSpec + Finished' }];
    k.shared = 'computed (ECDHE)'; k.identity = 'verified ✓';
    push('The client verifies the certificate, sends its ECDHE public value; both derive session keys; the client switches to encryption.', { states: { c: 'keys ready', s: 'deriving keys' }, keysNew: [0, 1], rtt: 2 });
    log = [...log, { from: 's', to: 'c', label: 'ChangeCipherSpec + Finished', encrypted: true }];
    push('Only after this SECOND TLS round trip can the request go out. TLS 1.2: 2 RTT for TLS + 1 for TCP = 3 RTT before the request — TLS 1.3 saves one.', { states: { c: 'ready', s: 'ready' }, rtt: 3 });
    log = [...log, { from: 'c', to: 's', label: 'GET /orders HTTP/1.1', encrypted: true }];
    push('Encrypted HTTP request.', { states: { c: 'sent request', s: 'processing' }, rtt: 3 });
    return frames;
  }

  if (name === 'resume') {
    log = [...log, { from: 'c', to: 's', label: 'ClientHello + key share + pre-shared key (ticket) + early data: GET /orders', note: '0-RTT early data' }];
    k.shared = 'resumed from ticket + new ECDHE'; k.alpn = 'h2'; k.identity = 'trusted from the earlier full handshake';
    push('On an earlier visit the server gave the browser a session ticket. Now the ClientHello carries that pre-shared key — and can even carry the HTTP request as 0-RTT early data. (Early data can be replayed by an attacker, so it is allowed only for safe, idempotent requests like GET.)',
      { states: { c: 'resuming', s: 'validating ticket' }, keysNew: [0, 1, 2], rtt: 1 });
    log = [...log, { from: 's', to: 'c', label: 'ServerHello + Finished + HTTP response', encrypted: true }];
    push('The server accepts the ticket and can answer the early request immediately. No certificate is re-sent. The response arrives after 2 round trips in total (TCP + this one); with HTTP/3 (QUIC) the separate TCP round trip disappears too.', { states: { c: 'ready', s: 'ready' }, rtt: 2 });
    return frames;
  }

  log = [...log, { from: 'c', to: 's', label: 'ClientHello', note: 'TLS 1.3, ciphers, random, key share (X25519), SNI=api.example.com, ALPN=[h2, http/1.1]' }];
  push('ClientHello: supported versions and ciphers, a random value, the client\'s ECDHE KEY SHARE (guessing the server will accept X25519), SNI = the host name (so a shared server picks the right certificate) and ALPN = the HTTP versions it speaks. SNI is visible to observers.',
    { states: { c: 'sent hello', s: 'choosing' }, active: ['c'], rtt: 1 });

  log = [...log, { from: 's', to: 'c', label: 'ServerHello', note: 'chosen cipher TLS_AES_256_GCM_SHA384 + server key share' }];
  k.shared = 'computed by both (ECDHE) — never sent'; k.cipher = 'TLS_AES_256_GCM_SHA384';
  push('ServerHello: the server picks the cipher and sends its own key share. Both sides now combine their private value with the other\'s public share and get the SAME shared secret — it never crossed the network. Ephemeral keys → forward secrecy.',
    { states: { c: 'derives keys', s: 'derives keys' }, active: ['s', 'c'], keysNew: [0, 3], rtt: 1 });
  log = [...log, { marker: true, label: 'Everything below is encrypted with the handshake keys' }];

  log = [...log, { from: 's', to: 'c', label: 'EncryptedExtensions (ALPN = h2)', encrypted: true }];
  k.alpn = 'h2 (HTTP/2)';
  push('EncryptedExtensions: already encrypted. The server confirms ALPN = h2, so HTTP/2 will be used on this connection.', { states: { c: 'waiting', s: 'sending' }, keysNew: [2], rtt: 1 });

  const certNote = name === 'expired' ? 'valid until 2026-09-30 — EXPIRED' : name === 'hostname' ? 'SAN: www.other-shop.com only' : 'CN/SAN api.example.com, issued by an intermediate CA';
  log = [...log, { from: 's', to: 'c', label: 'Certificate (leaf + intermediate)', note: certNote, encrypted: true }];
  push('Certificate: the server\'s certificate (domain ↔ public key) plus the intermediate CA certificate, so the browser can build the chain to a root it trusts.', { states: { c: 'checking chain', s: 'sending' }, rtt: 1 });

  log = [...log, { from: 's', to: 'c', label: 'CertificateVerify', note: 'signature over the handshake with the server\'s PRIVATE key', encrypted: true }];
  push('CertificateVerify: the server signs the whole handshake transcript with the private key that matches the certificate. A copied certificate is useless without that key — this is what defeats a man-in-the-middle.', { states: { c: 'checking signature', s: 'sending' }, rtt: 1 });

  if (name === 'expired' || name === 'hostname') {
    log = [...log, { from: 'c', to: 's', label: 'Alert: bad_certificate / certificate_expired — connection closed', encrypted: true }];
    k.identity = name === 'expired' ? '✗ expired (notAfter in the past)' : '✗ host name not in SAN';
    k.shared = 'discarded';
    push(name === 'expired'
      ? 'The chain and signature are fine, but today is after the certificate\'s notAfter date. The browser aborts and shows NET::ERR_CERT_DATE_INVALID; a Java client throws a CertificateExpiredException. (A wrong system clock causes the same error.) No HTTP data was sent.'
      : 'The certificate is genuine — but for www.other-shop.com, not api.example.com. Hostname verification fails: ERR_CERT_COMMON_NAME_INVALID. This is exactly what an attacker\'s valid certificate for its own domain would trigger. Clicking through or disabling verification would remove the protection.',
    { states: { c: 'aborted', s: 'closed' }, active: ['c'], keysNew: [0, 1], rtt: 1 });
    return frames;
  }

  log = [...log, { from: 's', to: 'c', label: 'Finished', note: 'MAC over the entire handshake', encrypted: true }];
  k.identity = 'verified ✓ (chain → trusted root, host name, dates, signature)';
  push('Server Finished: a MAC over the entire handshake, proving nothing was tampered with. The browser has verified the chain up to a root in its trust store, the host name, the dates and the signature.',
    { states: { c: 'verified', s: 'waiting' }, keysNew: [1], rtt: 1 });
  log = [...log, { from: 'c', to: 's', label: 'Finished', encrypted: true }];
  k.shared = 'traffic keys (AES-256-GCM) ready on both sides';
  push('Client Finished. Both sides switch to the application traffic keys. The TLS handshake took ONE round trip; total so far = 2 round trips (TCP + TLS).',
    { states: { c: 'ready', s: 'ready' }, keysNew: [0], rtt: 2 });
  log = [...log, { from: 'c', to: 's', label: 'HEADERS: GET /orders (HTTP/2)', encrypted: true }];
  push('The HTTP request is sent, encrypted with symmetric AES-GCM keys — fast for bulk data. Observers see only IPs, ports, the SNI host name and sizes; not the path, headers, cookies or body.',
    { states: { c: 'request sent', s: 'processing' }, rtt: 2 });
  log = [...log, { from: 's', to: 'c', label: 'HEADERS 200 + DATA (JSON)', encrypted: true }];
  push('The encrypted response arrives after the third round trip. The connection stays open (keep-alive / HTTP/2), so later requests skip both handshakes.', { states: { c: 'got response', s: 'idle' }, rtt: 3 });
  return frames;
}
