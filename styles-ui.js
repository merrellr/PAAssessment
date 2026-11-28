// styles-ui.js: the pictures for DISC Work Styles (work-styles.html and the card on My Learning). Needs styles-core.js.
//   StylesUI.map(result, { size, people })  the pace-and-focus field: four soft quadrants, your position as a dot
//                                            (people: [{ name, scores }] adds more dots, for the team map later)
//   StylesUI.bars(scores)                   four energy bars, one per style, 0-100
(function (root) {
  var K = root.StylesCore;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // Quadrants: Dominance fast + tasks (top left), Influence fast + people (top right),
  // Steadiness measured + people (bottom right), Conscientiousness measured + tasks (bottom left)
  var QUAD = { d: [0, 0], i: [1, 0], s: [1, 1], c: [0, 1] };
  function map(result, opts) {
    opts = opts || {};
    var S = opts.size || 320, pad = opts.small ? 14 : 26, inner = S - pad * 2, half = inner / 2, cx = pad + half, cy = pad + half;
    var at = function (p) { return { x: cx + p.x * (half - 14), y: cy - p.y * (half - 14) }; };
    var parts = [];
    parts.push('<defs><radialGradient id="wsHalo"><stop offset="0" stop-color="currentColor" stop-opacity=".35"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs>');
    K.KEYS.forEach(function (k) {
      var q = QUAD[k], st = K.STYLES[k], x = pad + q[0] * half, y = pad + q[1] * half, mine = result && result.primary === k;
      parts.push('<rect class="ws-q' + (mine ? ' mine' : '') + '" x="' + x + '" y="' + y + '" width="' + half + '" height="' + half + '" rx="' + (opts.small ? 8 : 14) + '" style="--qc:' + st.color + '"/>');
      if (!opts.small) {
        // a faint watermark in the middle of each square: the dots draw on top of it and nothing important is hidden
        var lx = x + half / 2, ly = y + half / 2;
        parts.push('<g class="ws-wm" style="fill:' + st.color + '"><text class="ws-wm-l" x="' + lx + '" y="' + (ly + 6) + '" text-anchor="middle">' + st.letter + '</text>' +
          '<text class="ws-wm-n" x="' + lx + '" y="' + (ly + 26) + '" text-anchor="middle">' + esc(st.name) + '</text></g>');
      } else {
        var sx = q[0] ? x + half - 8 : x + 8, sy = q[1] ? y + half - 8 : y + 16;
        parts.push('<text class="ws-ql small" x="' + sx + '" y="' + sy + '" text-anchor="' + (q[0] ? 'end' : 'start') + '" style="fill:' + st.color + '">' + st.letter + '</text>');
      }
    });
    parts.push('<line class="ws-axis" x1="' + pad + '" y1="' + cy + '" x2="' + (S - pad) + '" y2="' + cy + '"/><line class="ws-axis" x1="' + cx + '" y1="' + pad + '" x2="' + cx + '" y2="' + (S - pad) + '"/>');
    if (!opts.small) {
      parts.push('<text class="ws-ax" x="' + cx + '" y="' + (pad - 9) + '" text-anchor="middle">Faster pace</text>');
      parts.push('<text class="ws-ax" x="' + cx + '" y="' + (S - pad + 17) + '" text-anchor="middle">Measured pace</text>');
      parts.push('<text class="ws-ax" x="' + (pad - 9) + '" y="' + cy + '" text-anchor="middle" transform="rotate(-90 ' + (pad - 9) + ' ' + cy + ')">Task focus</text>');
      parts.push('<text class="ws-ax" x="' + (S - pad + 9) + '" y="' + cy + '" text-anchor="middle" transform="rotate(90 ' + (S - pad + 9) + ' ' + cy + ')">People focus</text>');
    }
    (opts.people || []).forEach(function (p) {
      var q = at(K.position(p.scores));
      parts.push('<circle class="ws-other" cx="' + q.x.toFixed(1) + '" cy="' + q.y.toFixed(1) + '" r="' + (opts.small ? 3 : 5) + '"><title>' + esc(p.name) + '</title></circle>');
    });
    if (result && result.primary) {
      var me = at(K.position(result.scores)), col = K.STYLES[result.primary].color;
      parts.push('<g class="ws-me" style="color:' + col + '"><circle cx="' + me.x.toFixed(1) + '" cy="' + me.y.toFixed(1) + '" r="' + (opts.small ? 18 : 34) + '" fill="url(#wsHalo)"/>' +
        '<circle cx="' + me.x.toFixed(1) + '" cy="' + me.y.toFixed(1) + '" r="' + (opts.small ? 6 : 9) + '" class="ws-dot"/></g>');
    }
    var desc = result && result.primary ? 'Your work style: ' + K.label(result) + '. ' + K.STYLES[result.primary].pace + ' pace, ' + K.STYLES[result.primary].focus + ' focus.' : 'The four work styles on two lines: pace and focus.';
    return '<svg class="ws-map' + (opts.small ? ' small' : '') + '" viewBox="0 0 ' + S + ' ' + S + '" width="' + S + '" height="' + S + '" role="img" aria-label="' + esc(desc) + '">' + parts.join('') + '</svg>';
  }

  function bars(scores) {
    var order = K.KEYS.slice().sort(function (a, b) { return (scores[b] || 0) - (scores[a] || 0); });
    return '<ul class="ws-bars">' + order.map(function (k) {
      var st = K.STYLES[k], v = Math.max(0, Math.min(100, scores[k] || 0));
      return '<li style="--bc:' + st.color + '"><span class="ws-bl"><b>' + st.letter + '</b> ' + esc(st.name) + '</span>' +
        '<span class="ws-bt" role="img" aria-label="' + esc(st.name) + ': ' + v + ' out of 100"><i style="width:' + v + '%"></i></span><span class="ws-bv">' + v + '</span></li>';
    }).join('') + '</ul>';
  }

  root.StylesUI = { map: map, bars: bars };
})(typeof window !== 'undefined' ? window : globalThis);
