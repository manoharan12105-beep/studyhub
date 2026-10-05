// Turns a rendered practice.md / interview-questions.md / examples.md into
// structured question items, by reading the conventions of the content guide:
//
//   ## Beginner | ## Set 1: Table        → group (with optional shared material)
//   ### P3. Question title               → one item (P/Q/E + stable number)
//   **Difficulty:** Easy · **Type:** MCQ → meta chips
//   - A) …  - B) …                       → multiple-choice options
//   <details><summary>Hint|Answer|Solution|Approach</summary>
//   **Answer:** C) 72                    → correct option letter
//
// The Markdown is never modified; anything the parser does not recognise stays
// in the item body, so unusual items still display in full.

const ITEM_HEADING = /^([PQE])(\d+)\.\s*(.*)$/;
const OPTION = /^\s*\(?([A-F])\)\s+/;

/**
 * @param {HTMLElement} root  markdown-body produced by renderMarkdown (H1 removed or present)
 * @returns {{ preamble: Node[], items: object[] }}
 */
export function parseQuestions(root) {
  const preamble = [];
  const items = [];
  let group = null;
  let item = null;

  for (const node of [...root.childNodes]) {
    if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) continue;
    const tag = node.nodeName;
    if (tag === 'H1') continue;
    if (tag === 'H2') {
      group = { title: node.textContent.trim(), shared: [] };
      item = null;
      continue;
    }
    const match = tag === 'H3' ? node.textContent.trim().match(ITEM_HEADING) : null;
    if (match) {
      item = {
        prefix: match[1],
        num: `${match[1]}${match[2]}`,
        title: match[3],
        titleNode: node,
        group,
        body: [],
      };
      items.push(item);
      continue;
    }
    if (item) item.body.push(node);
    else if (group) group.shared.push(node);
    else preamble.push(node);
  }

  return { preamble, items: items.map(analyse) };
}

function analyse(item) {
  const meta = [];
  const details = [];
  let options = null;
  const body = [];

  for (const node of item.body) {
    if (!meta.length && node.nodeName === 'P' && /^(Difficulty|Style|Type):/.test(node.textContent.trim())) {
      meta.push(...parseMeta(node.textContent));
      continue;
    }
    if (!options && node.nodeName === 'UL' && isOptionList(node)) {
      options = [...node.children].map((li) => {
        const letter = li.textContent.match(OPTION)[1];
        const content = li.cloneNode(true);
        stripOptionLetter(content);
        return { letter, node: content };
      });
      continue;
    }
    if (node.nodeName === 'DETAILS') {
      const summary = node.querySelector(':scope > summary');
      const label = summary?.textContent.trim() || 'Answer';
      const content = document.createElement('div');
      for (const child of [...node.childNodes]) if (child !== summary) content.append(child.cloneNode(true));
      details.push({ label, kind: detailKind(label), content });
      continue;
    }
    body.push(node);
  }

  const answerPanel = details.find((d) => d.kind === 'answer');
  const correct = options && answerPanel ? findAnswerLetter(answerPanel.content, options) : null;

  return {
    prefix: item.prefix,
    num: item.num,
    title: item.title,
    group: item.group,
    meta,
    body,
    options,
    correct,
    hints: details.filter((d) => d.kind === 'hint'),
    answers: details.filter((d) => d.kind !== 'hint'),
  };
}

function parseMeta(text) {
  return text.split('·').map((part) => {
    const [key, ...rest] = part.split(':');
    return { key: key.trim(), value: rest.join(':').trim() };
  }).filter((m) => m.key && m.value);
}

function isOptionList(ul) {
  const items = [...ul.children];
  return items.length >= 2 && items.every((li) => OPTION.test(li.textContent));
}

function stripOptionLetter(li) {
  const walker = document.createTreeWalker(li, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.data.trim()) continue;
    node.data = node.data.replace(OPTION, '');
    break;
  }
}

function detailKind(label) {
  return /hint/i.test(label) ? 'hint' : 'answer';
}

/** Reads "**Answer:** C) 72" (or "**Answer:** C") inside the answer panel. */
function findAnswerLetter(content, options) {
  const letters = new Set(options.map((o) => o.letter));
  for (const strong of content.querySelectorAll('strong')) {
    if (!/^Answers?:?$/i.test(strong.textContent.trim())) continue;
    let text = '';
    for (let n = strong.nextSibling; n && text.length < 12; n = n.nextSibling) text += n.textContent;
    const match = text.match(/^\s*:?\s*\(?([A-F])(?:\)|\b)/);
    if (match && letters.has(match[1])) return match[1];
  }
  return null;
}
