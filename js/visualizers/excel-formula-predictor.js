// Excel formula predictor: one small worksheet, one formula, a guess, then the
// working Excel does to reach the result.
//
//   scenario → predict (pick an option) → steps: read the referenced cells →
//   substitute their values → apply precedence / the function → result in D1
//
// The sheet is the same for every scenario (it matches the "Predict the Result"
// table in the Excel quick revision), so learners compare formulas, not data.
// Every result below was checked in Excel.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';

// A1 = 10, B1 = 20, C1 = 0, and B2:B6 = 82, AB, 38, (empty), 91.
const SHEET = { A1: 10, B1: 20, C1: 0, B2: 82, B3: 'AB', B4: 38, B6: 91 };
const COLUMNS = ['A', 'B', 'C', 'D'];
const ROWS = [1, 2, 3, 4, 5, 6];
const RESULT_CELL = 'D1';

const SCENARIOS = {
  add: {
    label: 'Addition: =A1+B1',
    formula: '=A1+B1',
    options: ['30', '1020', '200', '#VALUE!'],
    answer: 0,
    steps: [
      { cells: ['A1', 'B1'], work: '=10+20', text: 'Excel reads the referenced cells: A1 is 10 and B1 is 20.' },
      { work: '30', result: '30', text: '10 + 20 = 30. D1 shows 30; the formula bar still shows =A1+B1, so D1 updates if A1 or B1 changes.' },
    ],
  },
  precedence: {
    label: 'Precedence: =A1+B1*2',
    formula: '=A1+B1*2',
    options: ['60', '50', '42', '2020'],
    answer: 1,
    steps: [
      { cells: ['A1', 'B1'], work: '=10+20*2', text: 'Substitute the values: A1 is 10, B1 is 20.' },
      { work: '=10+40', text: 'Multiplication comes before addition, so 20 × 2 = 40 is worked out first — Excel does not go left to right.' },
      { work: '50', result: '50', text: '10 + 40 = 50. To double the total you need parentheses: =(A1+B1)*2 gives 60.' },
    ],
  },
  parentheses: {
    label: 'Parentheses: =(A1+B1)*2',
    formula: '=(A1+B1)*2',
    options: ['50', '60', '40', '30'],
    answer: 1,
    steps: [
      { cells: ['A1', 'B1'], work: '=(10+20)*2', text: 'Substitute the values: A1 is 10, B1 is 20.' },
      { work: '=30*2', text: 'Parentheses are worked out first: 10 + 20 = 30.' },
      { work: '60', result: '60', text: '30 × 2 = 60. Compare =A1+B1*2, which gives 50.' },
    ],
  },
  sum: {
    label: 'SUM: =SUM(A1:C1)',
    formula: '=SUM(A1:C1)',
    options: ['30', '3', '10', '#DIV/0!'],
    answer: 0,
    steps: [
      { cells: ['A1', 'B1', 'C1'], work: '=SUM(10, 20, 0)', text: 'A1:C1 is the range A1, B1, C1. SUM collects every number in it: 10, 20 and 0.' },
      { work: '30', result: '30', text: '10 + 20 + 0 = 30.' },
    ],
  },
  average: {
    label: 'AVERAGE with a zero: =AVERAGE(A1:C1)',
    formula: '=AVERAGE(A1:C1)',
    options: ['15', '10', '30', '#DIV/0!'],
    answer: 1,
    steps: [
      { cells: ['A1', 'B1', 'C1'], work: '=AVERAGE(10, 20, 0)', text: 'The range holds three numbers: 10, 20 and 0. A typed 0 is a real value, so AVERAGE counts it.' },
      { work: '=30/3', text: 'AVERAGE = sum of the numbers ÷ how many numbers: 30 ÷ 3.' },
      { work: '10', result: '10', text: 'The result is 10, not 15. If C1 were empty instead of 0, AVERAGE would skip it and give 15.' },
    ],
  },
  count: {
    label: 'COUNT: =COUNT(B2:B6)',
    formula: '=COUNT(B2:B6)',
    options: ['5', '4', '3', '2'],
    answer: 2,
    steps: [
      { cells: ['B2', 'B3', 'B4', 'B5', 'B6'], work: '=COUNT(82, "AB", 38, empty, 91)', text: 'B2:B6 holds 82, the text AB, 38, an empty cell and 91.' },
      { cells: ['B2', 'B4', 'B6'], work: '=COUNT(82, 38, 91)', text: 'COUNT counts only cells that contain numbers. AB is text and B5 is empty, so both are ignored.' },
      { work: '3', result: '3', text: 'COUNT = 3. Use COUNTA to count every filled cell, including text.' },
    ],
  },
  counta: {
    label: 'COUNTA: =COUNTA(B2:B6)',
    formula: '=COUNTA(B2:B6)',
    options: ['5', '4', '3', '1'],
    answer: 1,
    steps: [
      { cells: ['B2', 'B3', 'B4', 'B5', 'B6'], work: '=COUNTA(82, "AB", 38, empty, 91)', text: 'B2:B6 holds 82, the text AB, 38, an empty cell and 91.' },
      { cells: ['B2', 'B3', 'B4', 'B6'], work: '=COUNTA(82, "AB", 38, 91)', text: 'COUNTA counts every cell that is not empty — numbers and text alike. Only B5 is skipped.' },
      { work: '4', result: '4', text: 'COUNTA = 4, while COUNT on the same range gives 3.' },
    ],
  },
  if: {
    label: 'IF: =IF(A1>=10,"Yes","No")',
    formula: '=IF(A1>=10,"Yes","No")',
    options: ['Yes', 'No', 'TRUE', '#NAME?'],
    answer: 0,
    steps: [
      { cells: ['A1'], work: '=IF(10>=10,"Yes","No")', text: 'Substitute A1 = 10 into the condition.' },
      { work: '=IF(TRUE,"Yes","No")', text: '10 >= 10 is TRUE — "greater than or equal to" includes the boundary.' },
      { work: 'Yes', result: 'Yes', text: 'The condition is TRUE, so IF returns its second argument: Yes. (A1>10 would have been FALSE and given No.)' },
    ],
  },
  and: {
    label: 'AND: =IF(AND(A1>5,B1>25),"Yes","No")',
    formula: '=IF(AND(A1>5,B1>25),"Yes","No")',
    options: ['Yes', 'No', 'TRUE', 'FALSE'],
    answer: 1,
    steps: [
      { cells: ['A1', 'B1'], work: '=IF(AND(10>5,20>25),"Yes","No")', text: 'Substitute A1 = 10 and B1 = 20.' },
      { work: '=IF(AND(TRUE,FALSE),"Yes","No")', text: '10 > 5 is TRUE, but 20 > 25 is FALSE.' },
      { work: '=IF(FALSE,"Yes","No")', text: 'AND is TRUE only when every condition is TRUE. One is FALSE, so AND gives FALSE.' },
      { work: 'No', result: 'No', text: 'IF returns its third argument: No.' },
    ],
  },
  or: {
    label: 'OR: =IF(OR(A1>5,B1>25),"Yes","No")',
    formula: '=IF(OR(A1>5,B1>25),"Yes","No")',
    options: ['Yes', 'No', 'TRUE', 'FALSE'],
    answer: 0,
    steps: [
      { cells: ['A1', 'B1'], work: '=IF(OR(10>5,20>25),"Yes","No")', text: 'Substitute A1 = 10 and B1 = 20.' },
      { work: '=IF(OR(TRUE,FALSE),"Yes","No")', text: '10 > 5 is TRUE; 20 > 25 is FALSE.' },
      { work: '=IF(TRUE,"Yes","No")', text: 'OR is TRUE when at least one condition is TRUE.' },
      { work: 'Yes', result: 'Yes', text: 'IF returns its second argument: Yes. The same conditions gave No with AND.' },
    ],
  },
  divide: {
    label: 'Divide by zero: =B1/C1',
    formula: '=B1/C1',
    options: ['0', '20', '#DIV/0!', '#VALUE!'],
    answer: 2,
    steps: [
      { cells: ['B1', 'C1'], work: '=20/0', text: 'Substitute B1 = 20 and C1 = 0.' },
      { work: '#DIV/0!', result: '#DIV/0!', error: true, text: 'Division by zero has no answer, so Excel shows #DIV/0!. An empty C1 gives the same error, because an empty cell counts as 0 in arithmetic.' },
    ],
  },
};

export function mount(root, { options }) {
  const ids = (options.scenarios || Object.keys(SCENARIOS)).filter((id) => SCENARIOS[id]);
  const scenario = el('select', { class: 'select' }, ids.map((id) => el('option', { value: id }, SCENARIOS[id].label)));
  scenario.value = ids.includes(options.scenario) ? options.scenario : ids[0];
  root.append(el('div', { class: 'viz-form' }, el('div', { class: 'field field-grow' }, field('Formula', scenario))));

  const nameBox = el('span', { class: 'xl-name-box' }, RESULT_CELL);
  const formulaText = el('code', { class: 'xl-formula' });
  const cells = {};
  const grid = el('table', { class: 'xl-grid' },
    el('thead', {}, el('tr', {}, el('th', { class: 'xl-corner' }, el('span', { class: 'sr-only' }, 'Row')), COLUMNS.map((c) => el('th', { scope: 'col' }, c)))),
    el('tbody', {}, ROWS.map((r) => el('tr', {},
      el('th', { scope: 'row' }, String(r)),
      COLUMNS.map((c) => { cells[`${c}${r}`] = el('td', {}); return cells[`${c}${r}`]; })))));
  const work = el('p', { class: 'xl-work' });
  const predict = el('div', { class: 'xl-predict' });
  root.append(el('div', { class: 'viz-stage' },
    el('div', { class: 'xl-formula-bar' }, nameBox, el('span', { class: 'xl-fx', 'aria-hidden': 'true' }, 'fx'), el('span', { class: 'sr-only' }, 'Formula bar: '), formulaText),
    el('div', { class: 'table-wrap', tabindex: 0, role: 'region', 'aria-label': 'Worksheet' }, grid),
    work),
  predict);
  const stepper = createStepper(root, { render, nextLabel: 'Next step' });

  function start() {
    const s = SCENARIOS[scenario.value];
    formulaText.textContent = s.formula;
    renderPrediction(s, null);
    const first = { cells: [], work: s.formula, result: null, text: `D1 contains ${s.formula}. Predict what D1 shows, then step through how Excel works it out.` };
    stepper.load(first, s.steps.map((step) => ({ cells: [], result: null, ...step })));
  }

  function renderPrediction(s, chosen) {
    const buttons = s.options.map((text, i) => {
      const state = chosen === null ? '' : i === s.answer ? ' is-correct' : i === chosen ? ' is-wrong' : '';
      const b = el('button', { type: 'button', class: `option${state}`, disabled: chosen !== null },
        el('span', { class: 'option-marker', 'aria-hidden': 'true' }, String.fromCharCode(65 + i)),
        el('span', { class: 'option-text' }, text));
      b.addEventListener('click', () => {
        renderPrediction(s, i);
        predict.querySelector('.feedback')?.focus();
      });
      return el('li', {}, b);
    });
    const feedback = chosen === null ? null : el('div', { class: `feedback ${chosen === s.answer ? 'feedback-correct' : 'feedback-wrong'}`, tabindex: -1, role: 'status' },
      el('p', { class: 'feedback-title' }, chosen === s.answer ? 'Correct.' : `Not quite — D1 shows ${s.options[s.answer]}.`),
      el('p', {}, 'Step through below to see each stage of the calculation.'));
    predict.replaceChildren(
      el('p', { class: 'xl-predict-title' }, 'Your prediction: what does D1 show?'),
      el('ul', { class: 'option-list xl-options', role: 'list' }, buttons),
      ...(feedback ? [feedback] : []));
  }

  function render(frame) {
    for (const [address, td] of Object.entries(cells)) {
      const value = address === RESULT_CELL ? frame.result : SHEET[address];
      td.textContent = value === undefined || value === null ? '' : String(value);
      const classes = [];
      if (typeof value === 'number') classes.push('is-number');
      if (frame.cells.includes(address)) classes.push('is-ref');
      if (address === RESULT_CELL) classes.push('is-active');
      if (address === RESULT_CELL && frame.error) classes.push('is-error');
      td.className = classes.join(' ');
    }
    work.replaceChildren(el('span', { class: 'muted' }, frame.result === null ? 'Working: ' : 'Result: '), el('code', {}, frame.work));
  }

  scenario.addEventListener('change', start);
  start();
  return stepper;
}
