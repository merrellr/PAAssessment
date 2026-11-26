// coach-charts.js: practice questions about a chart ("Reading the evidence"), a first set of 11 across the seven skill
// areas. Every number is fictional. Practice adds them to the bank (CoachBank.questions) and draws each chart with
// CoachCharts.svg(); a "See the numbers" table under it carries the same data for screen readers.
// A question: the bank's fields (id, d, tier, c, l, t, q, o, a, x) plus chart: { type: 'bar' | 'line', title, unit,
// labels: [...], series: [{ name, values: [...] }] }.
(function (root) {
  var Q = [
    { id: 'chart:discovery:1', d: 'discovery', tier: 'novice', c: 'discovery-novice', l: 3, t: 'data',
      chart: { type: 'bar', title: 'Themes raised in 12 customer interviews', unit: 'interviews', labels: ['Confusing onboarding', 'Pricing', 'Missing integrations', 'Report export'], series: [{ name: 'Interviews', values: [9, 4, 3, 2] }] },
      q: 'Twelve interviews were coded by theme. What is the strongest next step?',
      o: ['Build report export first, because a large customer asked for it', 'Dig into the onboarding confusion: it came up in 9 of 12 interviews', 'Lower prices, since pricing came up', 'Wait for more interviews before doing anything'],
      a: 1, x: 'Nine of twelve is a strong, repeated signal. Frequency isn’t everything, but it tells you where to dig first; one loud customer (report export) is a single data point.' },
    { id: 'chart:discovery:2', d: 'discovery', tier: 'moderate', c: 'discovery-moderate', l: 4, t: 'data',
      chart: { type: 'line', title: 'Weekly sign-ups and activation rate', unit: '', labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'], series: [{ name: 'Sign-ups', values: [200, 230, 260, 300, 330, 360, 390, 420] }, { name: 'Activated (%)', values: [48, 47, 45, 42, 39, 36, 33, 31] }] },
      q: 'Sign-ups doubled over eight weeks while the share who activate fell. What is the best read?',
      o: ['Growth is healthy, so nothing needs attention', 'More people arrive but fewer reach value: find out who the new sign-ups are and where they drop off', 'Activation fell because the marketing is bad', 'The two lines are unrelated, so look at them separately'],
      a: 1, x: 'When volume rises and the rate falls, the new arrivals are probably different people with different needs. Talk to them and look at where they stop before you change anything.' },
    { id: 'chart:strategy:1', d: 'strategy', tier: 'novice', c: 'strategy-novice', l: 3, t: 'data',
      chart: { type: 'bar', title: 'Revenue and roadmap effort by segment', unit: '%', labels: ['Small business', 'Mid-market', 'Enterprise'], series: [{ name: 'Share of revenue', values: [22, 58, 20] }, { name: 'Share of roadmap effort', values: [50, 25, 25] }] },
      q: 'What does this chart suggest about the roadmap?',
      o: ['Effort matches revenue well', 'Half the effort goes to the segment that brings a fifth of the revenue: check whether that is a deliberate bet', 'Enterprise is over-served', 'Mid-market needs no more investment because it already pays the most'],
      a: 1, x: 'Spending more on a smaller segment can be a fine strategy (a growth bet), but it should be a choice you can explain, not an accident of who shouts loudest.' },
    { id: 'chart:strategy:2', d: 'strategy', tier: 'moderate', c: 'strategy-moderate', l: 2, t: 'data',
      chart: { type: 'line', title: 'Market share by quarter', unit: '%', labels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'], series: [{ name: 'Us', values: [18, 18, 19, 18, 18, 18] }, { name: 'Competitor A', values: [10, 13, 16, 19, 22, 24] }] },
      q: 'Our share is steady. What is the best read of this chart?',
      o: ['We are doing fine: our share is stable', 'A competitor is taking the market’s growth while we stand still: find out what they are winning on', 'Competitor A will stop growing soon', 'Market share does not matter for strategy'],
      a: 1, x: 'Flat share in a market where a rival more than doubles means the growth is going elsewhere. Understand why customers choose them before deciding how to respond.' },
    { id: 'chart:prioritization:1', d: 'prioritization', tier: 'novice', c: 'prioritization-novice', l: 2, t: 'data',
      chart: { type: 'bar', title: 'Value and effort for four features (1 to 10)', unit: 'score', labels: ['Feature A', 'Feature B', 'Feature C', 'Feature D'], series: [{ name: 'Value', values: [8, 9, 3, 6] }, { name: 'Effort', values: [2, 9, 2, 7] }] },
      q: 'Which feature is the quick win?',
      o: ['Feature A: high value for little effort', 'Feature B: the highest value', 'Feature C: the least effort', 'Feature D: in the middle on both'],
      a: 0, x: 'A quick win is high value for low effort. B is worth a lot but is a big bet; C is cheap but not worth much.' },
    { id: 'chart:prioritization:2', d: 'prioritization', tier: 'moderate', c: 'prioritization-moderate', l: 2, t: 'data',
      chart: { type: 'bar', title: 'Feature requests: votes and the yearly revenue of the customers asking', unit: '', labels: ['Dark mode', 'Single sign-on', 'Audit log'], series: [{ name: 'Votes', values: [140, 25, 18] }, { name: 'Revenue asking ($k)', values: [30, 900, 650] }] },
      q: 'Dark mode has by far the most votes. How should you weigh these requests?',
      o: ['Build dark mode first: it has the most votes', 'Votes and account value point different ways: weigh single sign-on and audit log by the revenue behind them, not just the vote count', 'Ignore votes entirely', 'Build all three at once'],
      a: 1, x: 'Vote counts measure how many people ask, not how much is at stake. A few large accounts asking for single sign-on may matter more than many small ones asking for dark mode.' },
    { id: 'chart:execution:1', d: 'execution', tier: 'novice', c: 'execution-novice', l: 1, t: 'data',
      chart: { type: 'line', title: 'Sprint burndown: work remaining (points)', unit: 'points', labels: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10'], series: [{ name: 'Planned', values: [40, 36, 32, 28, 24, 20, 16, 12, 8, 4] }, { name: 'Actual', values: [40, 37, 33, 31, 31, 31, 30, 24, 19, 14] }] },
      q: 'What does the burndown tell you, and when should you act?',
      o: ['Nothing yet: wait for the sprint review', 'Work stalled from day 4 to day 7: ask what is blocking it now, not at the review', 'The team is lazy', 'The plan was too easy'],
      a: 1, x: 'A flat stretch means work stopped moving. The point of a burndown is to spot that while there is still time to unblock it.' },
    { id: 'chart:execution:2', d: 'execution', tier: 'novice', c: 'execution-novice', l: 4, t: 'data',
      chart: { type: 'bar', title: 'Average days a change spends in each stage', unit: 'days', labels: ['In development', 'Waiting for review', 'Testing', 'Waiting to release'], series: [{ name: 'Days', values: [3, 6, 2, 5] }] },
      q: 'The team wants to ship faster. Where should you look first?',
      o: ['Make developers code faster', 'The waiting: review and release queues take 11 of the 16 days', 'Cut testing to save two days', 'Add more developers'],
      a: 1, x: 'Most of the time is spent waiting, not working. Shortening queues (smaller changes, faster reviews, more frequent releases) usually beats pushing people to work faster.' },
    { id: 'chart:stakeholder:1', d: 'stakeholder', tier: 'novice', c: 'stakeholder-novice', l: 4, t: 'data',
      chart: { type: 'bar', title: 'Survey: “The roadmap is clear to me” (% agree)', unit: '%', labels: ['Engineering', 'Sales', 'Support', 'Marketing'], series: [{ name: 'Agree', values: [82, 35, 40, 70] }] },
      q: 'What should you do with this survey result?',
      o: ['Nothing: most of the company agrees', 'Customer-facing teams (Sales and Support) find it least clear: give them an update in their terms', 'Ask Engineering to explain the roadmap to everyone', 'Stop sharing the roadmap'],
      a: 1, x: 'The people who talk to customers understand the roadmap least. A short update framed around what customers will notice usually closes that gap.' },
    { id: 'chart:aiIndividual:1', d: 'aiIndividual', tier: 'novice', c: 'aiIndividual-novice', l: 3, t: 'data',
      chart: { type: 'bar', title: 'Your weekly status report, before and after AI drafting', unit: '', labels: ['Minutes to write', 'Corrections from reviewers'], series: [{ name: 'Before', values: [90, 1] }, { name: 'With AI', values: [35, 4] }] },
      q: 'AI drafting saves almost an hour a week. What else does the chart show?',
      o: ['Nothing else: it is a clear win', 'Quality slipped: corrections went from 1 to 4, so check the draft properly before sending', 'AI should not be used for reports', 'Reviewers are being too picky'],
      a: 1, x: 'The time saved is real, but so is the rise in corrections. Keep the speed and add a careful review of facts and tone before you send it.' },
    { id: 'chart:aiOrg:1', d: 'aiOrg', tier: 'novice', c: 'aiOrg-novice', l: 3, t: 'data',
      chart: { type: 'bar', title: 'AI pilots by team: started and reaching everyday use', unit: 'pilots', labels: ['Support', 'Marketing', 'Product'], series: [{ name: 'Started', values: [4, 6, 5] }, { name: 'In everyday use', values: [3, 1, 0] }] },
      q: 'Leadership wants to start more AI pilots. What should come first?',
      o: ['Start more pilots in every team', 'Learn what Support did differently (3 of 4 stuck) before starting more elsewhere', 'Stop all pilots in Product', 'Give Marketing more budget'],
      a: 1, x: 'One team turns pilots into everyday use; the others mostly don’t. Find out why (a clear problem, an owner, good data) and spread that before adding more pilots.' }
  ];

  // ---------------------------------------------------------------- drawing
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function nice(max) { var p = Math.pow(10, Math.floor(Math.log10(max || 1))), m = max / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
  // A chart as SVG: grouped bars, or lines. Two series on very different scales (a line chart of counts and a %) get
  // their own scale each, so both are readable.
  function svg(ch) {
    var W = 560, H = 260, L = 44, R = ch.type === 'line' && ch.series.length > 1 ? 44 : 16, T = 16, B = 46, w = W - L - R, h = H - T - B;
    var n = ch.labels.length, out = [];
    var dual = ch.type === 'line' && ch.series.length === 2 && Math.max.apply(null, ch.series[0].values) > 3 * Math.max.apply(null, ch.series[1].values);
    var maxOf = function (vals) { return nice(Math.max.apply(null, vals) * 1.1); };
    var all = ch.series.reduce(function (a, s) { return a.concat(s.values); }, []);
    var M = [dual ? maxOf(ch.series[0].values) : maxOf(all), dual ? maxOf(ch.series[1].values) : maxOf(all)];
    var y = function (v, k) { return T + h - (v / M[k || 0]) * h; };
    for (var g = 0; g <= 4; g++) {
      var gy = T + h - g * h / 4;
      out.push('<line class="cg" x1="' + L + '" x2="' + (L + w) + '" y1="' + gy + '" y2="' + gy + '"/>');
      out.push('<text class="ct" x="' + (L - 6) + '" y="' + (gy + 4) + '" text-anchor="end">' + Math.round(M[0] * g / 4) + '</text>');
      if (dual) out.push('<text class="ct" x="' + (L + w + 6) + '" y="' + (gy + 4) + '">' + Math.round(M[1] * g / 4) + '</text>');
    }
    var step = w / n;
    ch.labels.forEach(function (lab, i) {
      out.push('<text class="ct cx" x="' + (L + step * i + step / 2) + '" y="' + (T + h + 18) + '" text-anchor="middle">' + esc(lab) + '</text>');
    });
    if (ch.type === 'bar') {
      var gw = step * 0.72, bw = gw / ch.series.length;
      ch.series.forEach(function (s, k) {
        s.values.forEach(function (v, i) {
          var x = L + step * i + (step - gw) / 2 + bw * k, top = y(v);
          out.push('<rect class="cs' + k + '" x="' + (x + 1) + '" y="' + top + '" width="' + (bw - 2) + '" height="' + (T + h - top) + '" rx="3"/>');
          out.push('<text class="cv" x="' + (x + bw / 2) + '" y="' + (top - 4) + '" text-anchor="middle">' + v + '</text>');
        });
      });
    } else {
      ch.series.forEach(function (s, k) {
        var kk = dual ? k : 0;
        var pts = s.values.map(function (v, i) { return (L + step * i + step / 2) + ',' + y(v, kk); }).join(' ');
        out.push('<polyline class="cl' + k + '" points="' + pts + '"/>');
        s.values.forEach(function (v, i) { out.push('<circle class="cs' + k + '" cx="' + (L + step * i + step / 2) + '" cy="' + y(v, kk) + '" r="3.5"/>'); });
      });
    }
    var legend = ch.series.length > 1 ? '<div class="ch-legend">' + ch.series.map(function (s, k) { return '<span><i class="cs' + k + '"></i>' + esc(s.name) + (dual ? (k ? ' (right scale)' : ' (left scale)') : '') + '</span>'; }).join('') + '</div>' : '';
    var table = '<details class="ch-data"><summary>See the numbers</summary><table><thead><tr><th scope="col"></th>' + ch.series.map(function (s) { return '<th scope="col">' + esc(s.name) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      ch.labels.map(function (lab, i) { return '<tr><th scope="row">' + esc(lab) + '</th>' + ch.series.map(function (s) { return '<td>' + s.values[i] + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></details>';
    return '<figure class="ch"><figcaption>' + esc(ch.title) + (ch.unit && ch.unit !== '%' && ch.unit !== 'score' ? '' : '') + '</figcaption>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(ch.title) + '. The numbers are in the table below.">' + out.join('') + '</svg>' + legend + table +
      '<p class="ch-note">Fictional data, for practice.</p></figure>';
  }

  root.CoachCharts = { questions: Q, svg: svg };
})(typeof window !== 'undefined' ? window : globalThis);
