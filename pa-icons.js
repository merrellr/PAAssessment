/* The seven skill-area icons, in the line style of www.productadvisory.co: 48 x 48, navy strokes and one cyan
   accent (the "dot" and "tick" classes, coloured in pa-theme.css). Used by the framework page and the dashboard.
   paDomainIcon(key, size[, x, y]) returns the <svg>; x and y place it inside another SVG. */
(function () {
  "use strict";
  var P = {
    discovery: '<circle cx="28" cy="17" r="9"/><path d="m34.5 23.5 7 7"/><path d="M8 42V32M15 42V26M22 42V34"/><circle class="dot" cx="28" cy="17" r="3"/>',
    strategy: '<circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="10"/><circle class="dot" cx="24" cy="24" r="4"/><path d="M24 24 38 10M33 10h5v5"/>',
    prioritization: '<path d="M24 9v31M15 40h18M9 15h30"/><path d="M9 15 4 28h10zM39 15l-5 13h10z"/><circle class="dot" cx="24" cy="9" r="3.5"/>',
    execution: '<rect x="9" y="6" width="30" height="36" rx="4"/><path d="M22 16h11M22 25h11M22 34h7"/><path class="tick" d="m14 16 2.5 2.5L20 14"/><path d="m14 25 2.5 2.5L20 23"/><circle cx="16" cy="34" r="1.6"/>',
    stakeholder: '<path d="M8 10h22a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H17l-7 6v-6H8a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3z"/><path d="M33 18h7a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-1v5l-6-5h-8a3 3 0 0 1-3-3v-5"/><circle class="dot" cx="13" cy="19" r="1.8"/><circle class="dot" cx="19" cy="19" r="1.8"/><circle class="dot" cx="25" cy="19" r="1.8"/>',
    aiIndividual: '<circle cx="20" cy="17" r="7"/><path d="M6 41c1.5-8 7-12.5 14-12.5S32.5 33 34 41"/><path class="tick" d="M37 5v10M32 10h10M33.5 6.5l7 7M40.5 6.5l-7 7"/>',
    aiOrg: '<circle class="dot" cx="24" cy="24" r="5"/><path d="M24 19V9M24 29v10M19.7 21.5 11 16.5M28.3 26.5 37 31.5M19.7 26.5 11 31.5M28.3 21.5 37 16.5"/><circle cx="24" cy="7" r="3"/><circle cx="24" cy="41" r="3"/><circle cx="9" cy="15.5" r="3"/><circle cx="39" cy="32.5" r="3"/><circle cx="9" cy="32.5" r="3"/><circle cx="39" cy="15.5" r="3"/>'
  };
  window.PA_DOMAIN_ICON_PATHS = P;
  window.paDomainIcon = function (key, size, x, y) {
    var w = size < 30 ? 3.4 : 2.6;   // small icons get bolder lines so they stay crisp
    return '<svg class="pa-dom-ico"' + (x !== undefined ? ' x="' + x + '" y="' + y + '"' : '') + ' width="' + size + '" height="' + size +
      '" viewBox="0 0 48 48" fill="none" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[key] || '') + '</svg>';
  };
})();
