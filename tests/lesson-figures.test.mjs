// Tests for lesson-figures.js (the article-style diagrams in lessons) and every figure in content/.   Run:  node tests/lesson-figures.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import '../lesson-figures.js';
const F = globalThis.PAFig;
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const t = (label, ok, extra) => { if (ok) { pass++; console.log('PASS  ' + label); } else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); } };

// The library
const cards = F.html({ type: 'cards', title: 'Three kinds', sub: 'Each answers a question.', items: [{ icon: 'chat', title: 'Say', text: 'Stated' }, { title: 'Do', tone: 'amber', quote: 'Show me' }] });
t('a figure is a <figure> with a serif title and subtitle', /^<figure class="pf pf--cards">/.test(cards) && cards.includes('<span class="pf-title">Three kinds</span>') && cards.includes('<span class="pf-sub">Each answers a question.</span>'));
t('tones and icons: a named tone is used, a missing one cycles, unknown icons draw nothing', cards.includes('pf-t-amber') && cards.includes('pf-t-teal') && cards.includes('<svg class="pf-ic"') && F.html({ type: 'cards', items: [{ icon: 'nope', title: 'x' }] }).indexOf('pf-ic') === -1);
t('quotes on cards', cards.includes('<q class="pf-quote">Show me</q>'));
const loop = F.html({ type: 'loop', center: 'Keep going', items: [{ title: 'A' }, { title: 'B', tag: 'Human led' }, { title: 'C' }] });
t('loop: a ring with one arrowhead per step, the centre text, and a plain list for phones', (loop.match(/<path d="M-3/g) || []).length === 3 && loop.includes('pf-center">Keep going') && loop.includes('pf-looplist') && loop.includes('<span class="pf-label">Human led</span>'));
const steps5 = F.html({ type: 'steps', items: [1, 2, 3, 4, 5].map(n => ({ title: 'S' + n })) });
const steps3 = F.html({ type: 'steps', items: [1, 2, 3].map(n => ({ title: 'S' + n })) });
t('steps: arrows between up to four, a numbered grid past that', (steps3.match(/pf-arrow /g) || []).length === 2 && steps5.includes('pf-stepgrid') && !steps5.includes('pf-arrow '));
const cmp = F.html({ type: 'compare', arrow: true, columns: [{ label: 'Before', mark: 'x', items: ['a'] }, { label: 'After', mark: 'check', items: ['b'] }] });
t('compare: before → after with crosses and ticks', cmp.includes('pf-has-arrow') && cmp.includes('pf-mark-x') && cmp.includes('pf-mark-check') && (cmp.match(/class="pf-m"/g) || []).length === 2);
const line = F.html({ type: 'line', title: 'L', x: 'Load', y: 'Time', series: [{ label: 'a', points: [[0, 1], [2, 3]] }, { label: 'b', dashed: true, points: [[0, 2], [2, 2]] }], marks: [{ x: 1, label: 'mid' }] });
t('line chart: an accessible SVG with both series, a key, and the marker', line.includes('role="img" aria-label="L"') && (line.match(/class="pf-series/g) || []).length === 2 && line.includes('pf-key') && line.includes('>mid<'));
t('timeline: long days turn vertical', F.html({ type: 'timeline', items: Array.from({ length: 7 }, (_, i) => ({ when: i, title: 'x' })) }).includes('pf-vertical') && !F.html({ type: 'timeline', items: [{ when: 1, title: 'x' }] }).includes('pf-vertical'));
t('an unknown type renders nothing', F.html({ type: 'nope' }) === '');
t('text: every word a reader sees, none of the settings', F.text({ type: 'cards', title: 'T', items: [{ icon: 'chat', tone: 'teal', title: 'Say', text: 'Stated <b>needs</b>' }] }) === 'T Say Stated needs');

// mount() replaces each slot, and leaves alone a slot with no figure
const made = [];
const doc = { createElement: () => { const box = {}; Object.defineProperty(box, 'innerHTML', { set(v) { box.firstChild = { html: v }; made.push(v); } }); return box; } };
const slot = (name) => { const sl = { name, ownerDocument: doc, getAttribute: () => name, parentNode: { replaceChild(fig, old) { old.replacedBy = fig; } } }; return sl; };
const slots = [slot('a'), slot('zz')];
F.mount({ querySelectorAll: () => slots }, { a: { type: 'equation', parts: [{ title: 'x' }, { title: 'y' }] } });
t('mount: a slot becomes its figure; an unknown name stays as it was', slots[0].replacedBy && slots[0].replacedBy.html.startsWith('<figure class="pf pf--equation"') && !slots[1].replacedBy && made.length === 1);

// The newer drawings
const chain = F.html({ type: 'chain', title: 'C', lanes: [{ label: 'Vision', tone: 'coral', nodes: [{ title: 'Intake' }, { title: 'Care' }, { title: 'Billing' }], detour: { at: 0, title: 'The product' }, result: 'Friction', mark: 'x' },
  { nodes: [{ title: 'Traffic' }, { stack: [{ title: 'A' }, { title: 'B', state: 'down' }] }], base: 'Shared' }] });
t('chain: steps joined by connectors, the product as a detour off the line, a fan of parallel steps, a shared band, the result', (chain.match(/class="pf-cn /g) || []).length === 6 && chain.includes('pf-cl pf-cl-detour') && chain.includes('pf-cstack pf-in-l') && chain.includes('pf-cn-down') && chain.includes('pf-base">Shared') && chain.includes('pf-result pf-marks pf-mark-x'));
const track = F.html({ type: 'track', title: 'T', kinds: { build: 'Building', test: 'Testing' }, rows: [{ label: 'Batch', segments: [{ len: 8, kind: 'build', label: 'Build' }, { len: 2, kind: 'test' }] }] });
t('track: segments sized by how long they take, with a key', track.includes('style="flex:8"') && track.includes('style="flex:2"') && track.includes('pf-key') && track.includes('Testing'));
const cad = F.html({ type: 'cadence', title: 'R', rows: [{ label: 'Daily', title: 'Standup', count: 65 }, { label: 'Quarterly', title: 'Review', count: 1 }] });
t('cadence: one mark per occurrence, dense rows drawn finer', (cad.match(/<i style="left:/g) || []).length === 66 && cad.includes('pf-dense') && cad.includes('65×'));
const pyr = F.html({ type: 'pyramid', title: 'P', levels: [{ title: 'Themes' }, { title: 'Epics' }, { title: 'Tasks' }] });
t('pyramid: narrow at the top, full width at the bottom', pyr.includes('width:46.0%') && pyr.includes('width:100.0%'));
const emp = F.html({ type: 'empathy', title: 'E', says: { title: 'fine' }, does: { title: 'workaround' }, hl: ['says', 'does'], gap: 'The gap' });
t('empathy map: four quadrants around the person, highlights and the gap', (emp.match(/class="pf-emq /g) || []).length === 4 && emp.includes('pf-emq-says pf-t-teal pf-emq-hl') && emp.includes('pf-emq-dim') && emp.includes('pf-gap'));
const rv = F.html({ type: 'compare', reveal: 'Guess first', columns: [{ label: 'Before', items: ['a'] }, { label: 'After', items: ['b'] }] });
t('predict, then reveal: the later side waits behind a question, hidden from screen readers until opened', rv.includes('pf-veiled') && rv.includes('<button type="button" class="pf-reveal-btn"><span>Guess first</span>') && rv.includes('class="pf-veil" aria-hidden="true"') && (rv.match(/pf-veiled/g) || []).length === 1);
t('the takeaway is signalled as the key idea', F.html({ type: 'cards', title: 'x', foot: 'The point', items: [{ title: 'a' }] }).includes('<p class="pf-foot"><span class="pf-foot-k">Key idea</span>The point</p>'));

// Every course: each slot has a figure, each figure is used, renders, and has a title; no inline SVG or PNG left.
const sandbox = { window: { CONTENT_OVERRIDES: {} } };
vm.createContext(sandbox);
for (const f of fs.readdirSync(path.join(root, 'content')).filter(f => f.endsWith('.js') && f !== 'framework-data.js'))
  vm.runInContext(fs.readFileSync(path.join(root, 'content', f), 'utf8'), sandbox, { filename: f });
let figs = 0; const problems = [];
for (const [cid, c] of Object.entries(sandbox.window.CONTENT_OVERRIDES)) for (const l of c.lessons || []) {
  const where = cid + ' L' + l.id;
  const used = [...String(l.body || '').matchAll(/data-fig="([^"]+)"/g)].map(m => m[1]);
  const defined = Object.keys(l.figures || {});
  used.forEach(k => { if (!l.figures || !l.figures[k]) problems.push(where + ': no figure "' + k + '"'); });
  defined.forEach(k => {
    figs++;
    const f = l.figures[k];
    if (used.indexOf(k) === -1) problems.push(where + ': figure "' + k + '" is never placed');
    if (F.types.indexOf(f.type) === -1) problems.push(where + ': "' + k + '" has unknown type ' + f.type);
    else if (!F.html(f) || !f.title) problems.push(where + ': "' + k + '" renders empty or has no title');
    JSON.stringify(f).replace(/"icon":"([^"]+)"/g, (m, ic) => { if (F.icons.indexOf(ic) === -1) problems.push(where + ': unknown icon ' + ic); });
  });
  if (/<svg/i.test(l.body || '')) problems.push(where + ': still has an inline <svg>');
  if (l.image) problems.push(where + ': still has an image');
}
t('every lesson figure is placed, known, titled and renders (' + figs + ' figures)', problems.length === 0 && figs >= 60, problems.slice(0, 6).join('; '));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
