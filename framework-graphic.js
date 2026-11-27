// framework-graphic.js: "The Training Framework" at a glance, as HTML (framework.html's top card). The four levels as
// a strip with dot meters; the seven domains in two groups (Core product management, AI-focused product), each tile
// with its icon, name and "4 competencies"; and "Show all 28 competencies", which opens every tile to its list.
// The same design is built for productadvisory.co by its src/build.py (with a band linking the two sites, which
// Learning leaves out). Needs content/framework-data.js, competencies-core.js and pa-icons.js.
//   FrameworkGraphic.render(element, { colors, tiers: [[key, label]...] })
(function (root) {
  var GROUPS = [
    { key: 'core', label: 'Core product management', areas: ['discovery', 'strategy', 'prioritization', 'execution', 'stakeholder'] },
    { key: 'ai', label: 'AI-focused product', areas: ['aiIndividual', 'aiOrg'] }
  ];
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function dots(i) { var h = ''; for (var k = 0; k < 4; k++) h += '<i class="' + (k <= i ? 'on' : '') + '"></i>'; return '<span class="fg-dots" aria-hidden="true">' + h + '</span>'; }

  function render(el, opts) {
    var D = root.FRAMEWORK_DATA || {}, K = root.CompetencyCore, icon = root.paDomainIcon, colors = (opts && opts.colors) || {};
    var tiers = (opts && opts.tiers) || [['novice', 'Limited Experience'], ['moderate', 'Moderate Experience'], ['experienced', 'Lots of Experience'], ['advanced', 'Advanced Experience']];
    var levels = '<ol class="fg-levels" aria-label="The four levels">' + tiers.map(function (t, i) { return '<li><span>' + esc(t[1]) + '</span>' + dots(i) + '</li>'; }).join('') + '</ol>';
    var groups = GROUPS.map(function (g) {
      return '<section class="fg-group fg-' + g.key + '" aria-labelledby="fgG-' + g.key + '"><h3 class="fg-gh" id="fgG-' + g.key + '">' + esc(g.label) + ' <span>(' + g.areas.length + ')</span></h3><div class="fg-tiles">' +
        g.areas.map(function (a) {
          var comps = K ? K.inArea(a) : [];
          return '<div class="fg-tile" style="--fg-c:' + (colors[a] || 'var(--navy)') + ';"><a class="fg-tile-a" href="#' + a + '"><span class="fg-ico" aria-hidden="true">' + (icon ? icon(a, 22) : '') + '</span>' +
            '<span class="fg-name">' + esc((D[a] && D[a].label) || a) + '</span><span class="fg-n">' + comps.length + ' competencies</span></a>' +
            '<ul class="fg-comps">' + comps.map(function (c) { return '<li><a href="#comp-' + c.key.replace('.', '-') + '" data-fg-comp="' + c.key + '">' + esc(c.name) + '</a></li>'; }).join('') + '</ul></div>';
        }).join('') + '</div></section>';
    }).join('');
    var total = K ? K.LIST.length : 28;
    el.innerHTML = '<div class="fg">' + levels + '<div class="fg-head"><h2 class="fg-h">The seven skill domains</h2>' +
      '<button type="button" class="fg-toggle" aria-expanded="false" aria-controls="fgGroups">Show all ' + total + ' competencies</button></div>' +
      '<div class="fg-groups" id="fgGroups">' + groups + '</div></div>';
    var btn = el.querySelector('.fg-toggle'), box = el.querySelector('.fg');
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open)); box.classList.toggle('open', open);
      btn.textContent = open ? 'Show the counts only' : 'Show all ' + total + ' competencies';
    });
    // a competency opens its card further down the page
    el.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-fg-comp]');
      if (!a) return;
      var d = document.getElementById(a.getAttribute('href').slice(1));
      if (d && d.tagName === 'DETAILS') d.open = true;
    });
  }

  root.FrameworkGraphic = { render: render, GROUPS: GROUPS };
})(typeof window !== 'undefined' ? window : globalThis);
