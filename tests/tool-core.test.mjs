// Tests for tool-core.js (the tool roadmap's logic).
// Run:  node --experimental-default-type=module tests/tool-core.test.mjs
import '../tool-core.js';

const T = globalThis.ToolCore;
let pass = 0, fail = 0;
function t(label, ok, extra){
  if (ok){ pass++; console.log('PASS  ' + label); }
  else { fail++; console.log('FAIL  ' + label + (extra ? '   [' + extra + ']' : '')); }
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

console.log('--- the starting list ---');
{
  const ids = T.STARTER_TOOLS.map(x => x.id);
  t('ten tools, each with a different id', ids.length === 10 && new Set(ids).size === 10);
  t('the three already-planned tools come first and are marked planned', same(T.STARTER_TOOLS.slice(0, 3).map(x => x.status), ['planned', 'planned', 'planned']) && T.STARTER_TOOLS.slice(3).every(x => x.status === 'considering'));
  t('every tool passes the same checks the owner form uses', T.STARTER_TOOLS.every(x => T.validateTool({ title: x.title, description: x.description, category: x.category, status: x.status, order: 0 }).ok));
  t('titles fit the rules (80) and descriptions (240)', T.STARTER_TOOLS.every(x => x.title.length <= 80 && x.description.length <= 240 && x.category.length <= 40));
  t('ids are web-safe and match what the title would give', T.STARTER_TOOLS.every(x => /^[a-z0-9-]+$/.test(x.id)) && T.slugify('Customer Interview Guide') === 'customer-interview-guide');
  const cats = new Set(T.STARTER_TOOLS.map(x => x.category));
  t('the list touches every part of the framework', ['Prioritization', 'Strategy', 'AI Fluency', 'Discovery', 'Stakeholders', 'Execution'].every(c => cats.has(c)));
}

console.log('--- ordering ---');
{
  const tools = [
    { id: 'a', title: 'A', status: 'planned', voteCount: 2, order: 1 },
    { id: 'b', title: 'B', status: 'considering', voteCount: 9, order: 2 },
    { id: 'c', title: 'C', status: 'released', voteCount: 50, order: 3 },
    { id: 'd', title: 'D', status: 'planned', voteCount: 2, order: 0 },
    { id: 'e', title: 'E', status: 'in_progress', voteCount: 0, order: 4 }
  ];
  t('most votes first, ties by the owner\'s order, released tools last', same(T.sortTools(tools).map(x => x.id), ['b', 'd', 'a', 'e', 'c']), T.sortTools(tools).map(x => x.id).join());
  t('sorting does not change the original list', tools[0].id === 'a');
}

console.log('--- who can vote ---');
{
  const open = { id: 'x', status: 'planned' };
  t('up to three votes in total', T.MAX_VOTES === 3 && T.votesLeft([]) === 3 && T.votesLeft(['a']) === 2 && T.votesLeft(['a', 'b', 'c']) === 0 && T.votesLeft(['a', 'b', 'c', 'd']) === 0);
  t('an open tool can be voted for', T.voteBlocker(open, [], true) === null);
  t('an unverified email cannot vote yet', T.voteBlocker(open, [], false) === 'verify');
  t('one vote per tool', T.voteBlocker(open, ['x'], true) === 'voted');
  t('a released tool is closed', T.voteBlocker({ id: 'x', status: 'released' }, [], true) === 'closed');
  t('the fourth vote is blocked until one is withdrawn', T.voteBlocker(open, ['a', 'b', 'c'], true) === 'full');
  t('all three open statuses accept votes', ['considering', 'planned', 'in_progress'].every(s => T.voteBlocker({ id: 'x', status: s }, [], true) === null));
  const v = T.buildVote({ uid: 'u1', email: 'Pat@Example.com' }, 'tool-1', 1);
  t('a vote carries uid, tool, lower-cased email and the launch-email choice', same(v, { uid: 'u1', toolId: 'tool-1', email: 'pat@example.com', notify: true }));
  t('the vote id is the person and the tool', T.voteId('u1', 'tool-1') === 'u1_tool-1');
}

console.log('--- suggestions ---');
{
  t('too short is refused', !T.validateSuggestion('hi').ok);
  t('empty is refused', !T.validateSuggestion('   ').ok);
  t('too long is refused', !T.validateSuggestion('x'.repeat(301)).ok);
  t('a normal suggestion is accepted and trimmed', T.validateSuggestion('  A pricing worksheet  ').ok && T.validateSuggestion('  A pricing worksheet  ').text === 'A pricing worksheet');
}

console.log('--- the owner\'s tool form ---');
{
  t('a good form passes', T.validateTool({ title: 'Stakeholder Map', description: 'd', category: 'Stakeholders', status: 'planned', order: '2', launchUrl: '' }).ok);
  t('a name is required', T.validateTool({ title: ' ', status: 'planned', order: 0 }).errors.title !== undefined);
  t('a status is required', T.validateTool({ title: 'X', status: 'nope', order: 0 }).errors.status !== undefined);
  t('a released tool needs its link so voters can find it', T.validateTool({ title: 'X', status: 'released', order: 0, launchUrl: '' }).errors.launchUrl !== undefined);
  t('links must be https', T.validateTool({ title: 'X', status: 'released', order: 0, launchUrl: 'http://a.com' }).errors.launchUrl !== undefined && T.validateTool({ title: 'X', status: 'released', order: 0, launchUrl: 'https://a.com/x' }).ok);
  t('order must be a whole number', T.validateTool({ title: 'X', status: 'planned', order: '1.5' }).errors.order !== undefined && T.validateTool({ title: 'X', status: 'planned', order: '' }).ok);
  const fields = T.buildToolFields({ title: ' Hi ', description: ' d ', category: ' c ', status: 'planned', order: '', launchUrl: '' });
  t('building the fields trims, defaults order to 0 and leaves out an empty link', same(fields, { title: 'Hi', description: 'd', category: 'c', status: 'planned', order: 0 }));
}

console.log('--- the launch-email list ---');
{
  const tools = [{ id: 'a', title: 'Tool A', status: 'released' }, { id: 'b', title: 'Tool, B', status: 'planned' }];
  const votes = [
    { toolId: 'a', email: 'z@x.com', notify: true }, { toolId: 'a', email: 'a@x.com', notify: true }, { toolId: 'a', email: 'a@x.com', notify: true },
    { toolId: 'a', email: 'no@x.com', notify: false }, { toolId: 'b', email: 'b@x.com', notify: true }, { toolId: 'a', email: '', notify: true }
  ];
  t('only people who asked, each once, sorted', same(T.notifyList(votes, 'a'), ['a@x.com', 'z@x.com']));
  const csv = T.buildNotifyCsv(tools, votes);
  t('the CSV lists tool, status and email', csv.split('\r\n').length === 4 && csv.split('\r\n')[0] === 'Tool,Status,Email' && /Tool A,Released,a@x\.com/.test(csv) && /"Tool, B",Planned,b@x\.com/.test(csv), csv);
  t('a formula in a tool name cannot run when opened', T.buildNotifyCsv([{ id: 'a', title: '=HYPERLINK("x")', status: 'planned' }], [{ toolId: 'a', email: 'a@x.com', notify: true }]).indexOf("'=HYPERLINK") > -1);
  t('the real count behind each tool', same(T.countVotes(votes), { a: 5, b: 1 }));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
