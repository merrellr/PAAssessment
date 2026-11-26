// Tests for library-core.js (the Library on My Learning).   Run:  node tests/library-core.test.mjs
import fs from 'fs';
import '../coach-core.js';
globalThis.window = globalThis;
eval(fs.readFileSync(new URL('../coach-bank.js', import.meta.url), 'utf8'));
eval(fs.readFileSync(new URL('../company-core.js', import.meta.url), 'utf8'));
eval(fs.readFileSync(new URL('../saved-tools-core.js', import.meta.url), 'utf8'));
eval(fs.readFileSync(new URL('../library-core.js', import.meta.url), 'utf8'));
const L = globalThis.LibraryCore, BANK = globalThis.CoachBank, TOOLS = globalThis.SavedToolsCore.TOOLS;
const AUDIO = JSON.parse(fs.readFileSync(new URL('../audio/lessons/index.json', import.meta.url), 'utf8'));
let pass = 0, fail = 0;
const t = (label, ok, extra) => { if (ok) { pass++; console.log('PASS  ' + label); } else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); } };

const AREAS = { discovery: 'Discovery', strategy: 'Strategy', prioritization: 'Prioritization', execution: 'Execution', stakeholder: 'Stakeholders', aiIndividual: 'AI (you)', aiOrg: 'AI (org)' };
const pct = { discovery: 70, strategy: 40, prioritization: 60, execution: 80, stakeholder: 65, aiIndividual: 55, aiOrg: 62 };
const ctx = { areas: AREAS, pct, log: [], progress: { courses: { 'strategy-moderate': { completed: [1] } } }, bank: BANK };
const all = L.items(ctx, AUDIO, TOOLS);
const n = k => all.filter(x => x.kind === k).length;
t('every lesson, every lesson with audio to listen to, practice in each area and every toolkit', n('lesson') > 130 && n('listen') === Object.keys(AUDIO).length && n('practice') === 7 && n('tool') === Object.keys(TOOLS).length, [n('lesson'), n('listen'), n('practice'), n('tool')].join());
t('each course\'s companion article, opening in a new tab', n('article') === Object.keys(globalThis.CompanyCore.COURSE_ARTICLES).length && all.filter(x => x.kind === 'article').every(x => x.ext && /^https:/.test(x.href) && /^Companion article: /.test(x.title)));
t('a Listen item opens the lesson with the player (&listen=1)', all.find(x => x.kind === 'listen').href.endsWith('&listen=1'));
t('lessons done are marked', all.find(x => x.kind === 'lesson' && x.course === 'strategy-moderate' && x.lesson === 1).done);
t('toolkits open in My Toolkits (never the marketing site)', all.filter(x => x.kind === 'tool').every(x => x.href === '/my-tools') && all.every(x => !/productadvisory\.co/.test(x.href)));

const p = L.picks(ctx, all, null);
t('three picks: read, listen and a toolkit', p.length === 3 && p.map(x => x.kind).join() === 'lesson,listen,tool', p.map(x => x.kind).join());
t('the read pick is the next lesson in the area that needs it most (Strategy), with why', p[0].d === 'strategy' && p[0].course === 'strategy-moderate' && p[0].lesson === 2 && /^Strategy needs attention, and this is the next lesson there\.$/.test(p[0].why), p[0].why);
t('the listen pick is in a developing area and says how long', p[1].d !== 'strategy' && /Listen on the go: \d+ min/.test(p[1].why), p[1].why);
t('the toolkit pick fits the focus area (Strategy: build, buy or partner)', p[2].tool === 'bbp' && /Put Strategy to work/.test(p[2].why));
const plan = { over: false, week: { d: 'prioritization' }, next: { k: 'lesson', course: 'prioritization-moderate', lesson: 3 } };
const pp = L.picks(ctx, all, plan);
t('with a study plan, the first pick is its next lesson and the toolkit follows the plan\'s area', pp[0].course === 'prioritization-moderate' && pp[0].lesson === 3 && /study plan/.test(pp[0].why) && pp[2].tool === 'scorecard', JSON.stringify(pp.map(x => [x.kind, x.course, x.tool])));

t('browse: by kind', L.filter(all, { kind: 'tool' }).length === n('tool'));
t('browse: by area includes that area\'s toolkit', (r => r.every(x => x.d === 'prioritization' || x.tool === 'scorecard') && r.some(x => x.kind === 'tool'))(L.filter(all, { d: 'prioritization' })));
{ const r = L.filter(all, { q: 'strategy advanced', kind: 'lesson' }), hay = x => (x.title + ' ' + x.area + ' ' + x.level).toLowerCase();
  t('browse: words match the title, area or level, all of them', r.every(x => /strategy/.test(hay(x)) && /advanced/.test(hay(x))) && all.filter(x => x.kind === 'lesson' && x.course === 'strategy-advanced').every(x => r.includes(x))); }
t('browse: nothing matches nonsense', L.filter(all, { q: 'zzqx' }).length === 0);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
