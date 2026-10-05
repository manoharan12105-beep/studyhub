// One object, seen through a reference: what the compiler allows (decided by
// the reference's declared type) versus what runs (decided by the object's
// class). Covers calls, overriding, upcasts, downcasts and instanceof.
//
// Hierarchy:  Object ← Animal ← Dog, Animal ← Cat   (Dog and Cat are unrelated)

import { el } from '../util.js';
import { highlight } from '../highlight.js';
import { createStepper, field } from '../engagement/stepper.js';

const PARENT = { Object: null, Animal: 'Object', Dog: 'Animal', Cat: 'Animal' };
const OWN_METHODS = {
  Object: ['toString()', 'equals(Object)', 'hashCode()'],
  Animal: ['speak()', 'eat()'],
  Dog: ['speak()', 'fetch()'],
  Cat: ['speak()'],
};
// What each class's speak() prints (Dog and Cat override Animal's).
const SPEAK = { Animal: '"Some animal sound"', Dog: '"Woof"', Cat: '"Meow"' };

const ACTIONS = {
  speak: 'ref.speak()',
  eat: 'ref.eat()',
  fetch: 'ref.fetch()',
  castDog: 'Dog d = (Dog) ref;',
  instDog: 'ref instanceof Dog',
};

const isSubtype = (sub, sup) => { for (let t = sub; t; t = PARENT[t]) if (t === sup) return true; return false; };
const related = (a, b) => isSubtype(a, b) || isSubtype(b, a);
function visibleMethods(type) {
  const list = [];
  for (let t = type; t; t = PARENT[t]) for (const m of OWN_METHODS[t]) if (!list.some((x) => x.m === m)) list.push({ m, from: t });
  return list;
}
function declaringClass(type, method) {
  for (let t = type; t; t = PARENT[t]) if (OWN_METHODS[t].includes(method)) return t;
  return null;
}

export function mount(root, { options }) {
  const refSelect = el('select', { class: 'select' }, ['Object', 'Animal', 'Dog', 'Cat'].map((t) => el('option', { value: t }, t)));
  const objSelect = el('select', { class: 'select' }, ['Animal', 'Dog', 'Cat'].map((t) => el('option', { value: t }, `new ${t}()`)));
  const actionSelect = el('select', { class: 'select' }, Object.entries(ACTIONS).map(([v, l]) => el('option', { value: v }, l)));
  refSelect.value = options.reference || 'Animal';
  objSelect.value = options.object || 'Dog';
  actionSelect.value = options.action || 'speak';
  root.append(el('div', { class: 'viz-form' },
    field('Reference (declared) type', refSelect), field('Object created', objSelect), field('Then', actionSelect)));

  const code = el('pre', { class: 'mini-code', tabindex: 0 });
  const compilerPanel = el('div', { class: 'dispatch-panel' });
  const runtimePanel = el('div', { class: 'dispatch-panel' });
  root.append(el('div', { class: 'code-block' }, code),
    el('div', { class: 'viz-stage dispatch-stage' }, compilerPanel, runtimePanel));
  const stepper = createStepper(root, { render });

  function start() {
    const ref = refSelect.value;
    const obj = objSelect.value;
    const action = actionSelect.value;
    code.innerHTML = highlight(`class Animal { void speak() { System.out.println("Some animal sound"); } void eat() { … } }
class Dog extends Animal { @Override void speak() { System.out.println("Woof"); } void fetch() { … } }
class Cat extends Animal { @Override void speak() { System.out.println("Meow"); } }

${ref} ref = new ${obj}();
${ACTIONS[action].endsWith(';') ? ACTIONS[action] : `${ACTIONS[action]};`}`, 'java');
    stepper.load(...buildFrames(ref, obj, action));
  }

  function render(frame) {
    const ref = refSelect.value;
    const obj = objSelect.value;
    compilerPanel.replaceChildren(
      el('p', { class: 'dispatch-title' }, 'Compile time — the compiler sees the reference'),
      el('p', {}, 'Declared type: ', el('strong', {}, ref)),
      el('p', { class: 'small muted' }, 'Methods it lets you call:'),
      el('ul', { class: 'method-list' }, visibleMethods(ref).map(({ m, from }) => el('li', { class: frame.highlightCompile === m ? 'is-current' : '' },
        el('code', { class: 'inline-code' }, m), el('span', { class: 'muted small' }, from === ref ? '' : ` (from ${from})`)))),
      frame.compile ? el('p', { class: `verdict verdict-${frame.compile.ok ? 'ok' : 'bad'}` }, frame.compile.ok ? '✓ Compiles' : '✗ Compile error', el('span', { class: 'small' }, ` — ${frame.compile.why}`)) : null);
    runtimePanel.replaceChildren(
      el('p', { class: 'dispatch-title' }, 'Run time — the JVM looks at the object'),
      frame.objectShown ? [
        el('p', {}, 'Object’s class: ', el('strong', {}, obj)),
        el('p', { class: 'small muted' }, 'Class chain searched for overrides:'),
        el('ol', { class: 'chain-list' }, chain(obj).map((t) => el('li', { class: frame.highlightRuntime === t ? 'is-current' : '' }, t))),
      ] : el('p', { class: 'muted small' }, 'Nothing runs until the code compiles.'),
      frame.runtime ? el('p', { class: `verdict verdict-${frame.runtime.ok ? 'ok' : 'bad'}` }, frame.runtime.ok ? '▶ ' : '✗ ', frame.runtime.what) : null);
  }

  for (const s of [refSelect, objSelect, actionSelect]) s.addEventListener('change', start);
  start();
  return stepper;
}

function chain(type) {
  const list = [];
  for (let t = type; t; t = PARENT[t]) list.push(t);
  return list;
}

function buildFrames(ref, obj, action) {
  const frames = [];
  const assignOk = isSubtype(obj, ref);
  const intro = {
    text: `${ref} ref = new ${obj}(); — the object is a ${obj}; the reference only promises "${ref}".`,
    objectShown: false,
  };
  if (!assignOk) {
    frames.push({
      text: `A ${obj} is not a ${ref}, so the assignment itself does not compile ("incompatible types"). An upcast (child into parent reference) is always allowed; the reverse needs an explicit cast.`,
      compile: { ok: false, why: `incompatible types: ${obj} cannot be converted to ${ref}` },
    });
    return [intro, frames];
  }
  frames.push({
    text: ref === obj ? `Reference and object types are the same: nothing is hidden.` : `This is an upcast: a ${obj} can be used wherever a ${ref} is expected. No cast needed, and the object is unchanged.`,
    compile: { ok: true, why: 'assignment is an upcast (or same type)' },
    objectShown: true,
  });

  if (action === 'speak' || action === 'eat' || action === 'fetch') {
    const method = `${action}()`;
    const where = declaringClass(ref, method);
    if (!where) {
      frames.push({
        text: `The compiler checks ${ref} (and its superclasses) for ${method}. It is not there — even though the object might have it, the compiler only trusts the declared type.`,
        compile: { ok: false, why: `cannot find symbol: method ${method} in ${ref}` },
        objectShown: true,
      });
      return [intro, frames];
    }
    frames.push({
      text: `Compile time: ${method} exists in ${where}${where === ref ? '' : ` (inherited by ${ref})`}, so the call compiles. The compiler fixes the signature, not which body runs.`,
      compile: { ok: true, why: `${method} found in ${where}` }, highlightCompile: method, objectShown: true,
    });
    const runner = declaringClass(obj, method);
    const output = action === 'speak' ? `prints ${SPEAK[runner]}` : `runs ${runner}.${method}`;
    frames.push({
      text: `Run time: dynamic dispatch starts at the object's class ${obj} and walks up until it finds ${method}: ${runner}'s version runs, so it ${output}.${runner !== where ? ` That is overriding — the ${ref} reference still runs ${runner}'s code.` : ''}`,
      compile: { ok: true, why: `${method} found in ${where}` }, highlightCompile: method, objectShown: true,
      highlightRuntime: runner, runtime: { ok: true, what: `${runner}.${method} ${action === 'speak' ? `→ ${SPEAK[runner]}` : ''}` },
    });
    return [intro, frames];
  }

  if (action === 'castDog') {
    if (!related(ref, 'Dog')) {
      frames.push({
        text: `A ${ref} reference can never point to a Dog (${ref} and Dog are unrelated classes), so the compiler rejects the cast.`,
        compile: { ok: false, why: `incompatible types: ${ref} cannot be converted to Dog` }, objectShown: true,
      });
      return [intro, frames];
    }
    frames.push({
      text: isSubtype(ref, 'Dog') ? `${ref} is already a Dog type, so the cast is redundant but legal.` : `Downcast: a ${ref} reference might point to a Dog, so the compiler allows the cast and inserts a runtime check.`,
      compile: { ok: true, why: 'Dog is related to the declared type' }, objectShown: true,
    });
    const ok = isSubtype(obj, 'Dog');
    frames.push({
      text: ok ? `Run time: the object really is a ${obj}, so the check passes and d points to the same object — casting never changes the object.` : `Run time: the object is a ${obj}, not a Dog, so the JVM throws ClassCastException. Guard with instanceof first.`,
      compile: { ok: true, why: 'Dog is related to the declared type' }, objectShown: true, highlightRuntime: obj,
      runtime: { ok, what: ok ? 'Cast succeeds: same object, now seen as Dog' : `ClassCastException: class ${obj} cannot be cast to class Dog` },
    });
    return [intro, frames];
  }

  // instanceof Dog
  if (!related(ref, 'Dog')) {
    frames.push({
      text: `instanceof follows the cast rule: since a ${ref} can never be a Dog, the compiler reports an error instead of letting you write a test that is always false.`,
      compile: { ok: false, why: `incompatible types: ${ref} cannot be converted to Dog` }, objectShown: true,
    });
    return [intro, frames];
  }
  frames.push({
    text: 'The test compiles: the declared type is related to Dog.',
    compile: { ok: true, why: 'Dog is related to the declared type' }, objectShown: true,
  });
  const result = isSubtype(obj, 'Dog');
  frames.push({
    text: `Run time: instanceof checks the object, not the reference: a ${obj} ${result ? 'is' : 'is not'} a Dog, so the result is ${result}.`,
    compile: { ok: true, why: 'Dog is related to the declared type' }, objectShown: true, highlightRuntime: obj,
    runtime: { ok: true, what: `ref instanceof Dog → ${result}` },
  });
  return [intro, frames];
}
