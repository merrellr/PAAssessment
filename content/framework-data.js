<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Training Framework — Product Advisory Learning</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --navy:#1A4584; --navy-deep:#12305e; --cyan:#35C2E8; --gray:#9AA3AD;
    --ink:#16213E; --ink-soft:#4B5768; --line:#E3E9F0; --bg:#F5F8FB;
  }
  *{ box-sizing:border-box; }
  body{ margin:0; background:var(--bg); font-family:'IBM Plex Sans', sans-serif; color:var(--ink); }
  .wrap{ max-width:900px; margin:0 auto; padding:0 16px 48px; }
  .brand-header{ display:flex; align-items:center; justify-content:space-between; gap:9px; padding:24px 0 14px; }
  .brand-header-left{ display:flex; align-items:center; gap:9px; text-decoration:none; }
  .brand-word{ font-family:'Space Grotesk', sans-serif; font-weight:700; font-size:15px; color:var(--navy-deep); }
  .brand-accent-bar{ height:3px; background:linear-gradient(90deg, var(--navy) 0%, var(--cyan) 100%); border-radius:2px; margin-bottom:28px; }
  .back-link{ font-size:13px; color:var(--gray); text-decoration:none; display:inline-block; margin-bottom:16px; }
  .card{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:24px 26px; margin-bottom:18px; }
  h1{ font-family:'Space Grotesk', sans-serif; font-size:24px; color:var(--navy-deep); margin:0 0 10px; }
  h2{ font-family:'Space Grotesk', sans-serif; font-size:17px; color:var(--navy-deep); margin:0; }
  p{ line-height:1.6; color:var(--ink-soft); font-size:14.5px; }
  .eyebrow{ font-family:'Space Grotesk', sans-serif; font-weight:600; font-size:12px; letter-spacing:0.06em; color:var(--cyan); text-transform:uppercase; }
  .domain-header{ display:flex; align-items:center; gap:12px; margin-bottom:10px; }
  .domain-badge{ width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .tier-tabs{ display:flex; gap:8px; margin-top:16px; flex-wrap:wrap; }
  .tier-tab{ flex:1; min-width:130px; background:var(--bg); border:1.5px solid var(--line); border-radius:10px; padding:10px 12px; cursor:pointer; text-align:left; font-family:inherit; }
  .tier-tab.active{ background:#fff; border-color:currentColor; }
  .tier-tab-label{ font-family:'Space Grotesk', sans-serif; font-weight:700; font-size:12px; margin-top:6px; color:var(--ink); }
  .tier-dots{ display:flex; gap:4px; }
  .tier-dot{ width:9px; height:9px; border-radius:50%; border:1.5px solid var(--line); }
  .tier-detail{ background:var(--bg); border-radius:10px; padding:16px 18px; margin-top:12px; border-top:3px solid var(--line); }
  .tier-detail p{ margin:0; font-size:13.5px; }
  .cta-row{ text-align:center; margin-top:28px; }
  .btn{ display:inline-block; background:linear-gradient(135deg, var(--navy) 0%, var(--navy-deep) 100%); color:#fff; padding:12px 26px; border-radius:24px; text-decoration:none; font-weight:600; font-size:14.5px; }
</style>
</head>
<body>
<div class="wrap">

  <div class="brand-header">
    <a href="lms-dashboard.html" class="brand-header-left" style="text-decoration:none;">
      <svg width="28" height="28" viewBox="0 0 40 40" aria-hidden="true">
        <polygon points="20,3 35,11.5 35,28.5 20,37 5,28.5 5,11.5" fill="#1A4584"/>
        <polygon points="20,10 29,15 29,25 20,30 11,25 11,15" fill="none" stroke="#35C2E8" stroke-width="1.5"/>
      </svg>
      <div>
        <div style="font-family:'IBM Plex Sans', sans-serif; font-weight:600; font-size:10.5px; letter-spacing:0.06em; color:var(--gray); line-height:1;">PRODUCT ADVISORY</div>
        <div class="brand-word" style="font-size:19px; line-height:1.3;">Learning</div>
      </div>
    </a>
  </div>
  <div class="brand-accent-bar"></div>
  <a class="back-link" href="lms-dashboard.html">← Back to dashboard</a>

  <div class="card">
    <span class="eyebrow">The Training Framework</span>
    <h1>Seven Domains, Four Levels Each</h1>
    <p>Everything in this program is organized around seven core skill areas that make up modern product management, three of them focused specifically on working with AI. Your assessment measures where you stand in each one today, and your course plan is built from that starting point, not a generic curriculum everyone gets.</p>
    <p>Within each domain, there are four levels: <strong>No Experience</strong>, <strong>Moderate Experience</strong>, <strong>Lots of Experience</strong>, and <strong>Advanced Experience</strong>. These aren't just labels, each one describes a genuinely different way of operating in that domain, not just "knows more facts." Browse the seven domains below to see exactly what's being measured and what growth actually looks like in each one.</p>
  </div>

  <div id="domainsContainer"></div>

  <div class="cta-row">
    <a href="index.html" class="btn">Take the Assessment →</a>
  </div>

  <div style="margin-top:40px; padding:20px 0; border-top:1px solid var(--line); text-align:center; font-size:12px; color:var(--gray);">
    © <span id="footerYear"></span> Product Advisory, LLC. All rights reserved. &nbsp;·&nbsp;
    <a href="https://www.productadvisory.co/privacy-policy" target="_blank" rel="noopener" style="color:var(--gray); text-decoration:underline;">Privacy Policy</a> &nbsp;·&nbsp;
    <a href="https://www.productadvisory.co/terms-of-use" target="_blank" rel="noopener" style="color:var(--gray); text-decoration:underline;">Terms of Use</a>
  </div>
</div>

<script src="content/framework-data.js"></script>
<script>
const DOMAIN_COLORS = {
  discovery: "#3B82F6", strategy: "#8B5CF6", prioritization: "#EC4899",
  execution: "#F97316", stakeholder: "#10B981", aiIndividual: "#06B6D4", aiOrg: "#6366F1"
};
const DOMAIN_ICON_PATHS = {
  discovery: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5L13 13l-3.5 1.5L11 11z"/>',
  strategy: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.8" fill="currentColor"/>',
  prioritization: '<line x1="6" y1="5" x2="6" y2="19"/><circle cx="6" cy="10" r="2"/><line x1="12" y1="5" x2="12" y2="19"/><circle cx="12" cy="15" r="2"/><line x1="18" y1="5" x2="18" y2="19"/><circle cx="18" cy="8" r="2"/>',
  execution: '<path d="M12 3c-1.2 3-3.8 4.2-3.8 7.8a3.8 3.8 0 0 0 7.6 0c0-1.6-.6-2.4-.6-2.4s.3 1.6-.8 2.4c0-2.6-1.6-3.6-2.4-7.8z"/>',
  stakeholder: '<path d="M4 5h16v10H8l-4 4z"/>',
  aiIndividual: '<rect x="6" y="6" width="12" height="12" rx="2"/><line x1="9" y1="3" x2="9" y2="6"/><line x1="15" y1="3" x2="15" y2="6"/><line x1="9" y1="18" x2="9" y2="21"/><line x1="15" y1="18" x2="15" y2="21"/><line x1="3" y1="9" x2="6" y2="9"/><line x1="18" y1="9" x2="21" y2="9"/>',
  aiOrg: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'
};
const TIER_LABELS = [
  ["novice", "No Experience"],
  ["moderate", "Moderate Experience"],
  ["experienced", "Lots of Experience"],
  ["advanced", "Advanced Experience"]
];

// Filled-dot count per tier: 0 for No Experience, 1/2/3 for the rest —
// this is the shared visual language for tier level across the site.
const TIER_FILLED_DOTS = { novice: 0, moderate: 1, experienced: 2, advanced: 3 };

function tierDotsHtml(tierKey, color){
  let dots = '';
  for (let i = 0; i < 3; i++){
    const filled = i < TIER_FILLED_DOTS[tierKey];
    dots += `<span class="tier-dot" style="${filled ? `background:${color}; border-color:${color};` : ''}"></span>`;
  }
  return `<div class="tier-dots">${dots}</div>`;
}

const container = document.getElementById('domainsContainer');
Object.keys(window.FRAMEWORK_DATA).forEach(domainKey => {
  const domain = window.FRAMEWORK_DATA[domainKey];
  const color = DOMAIN_COLORS[domainKey];
  const card = document.createElement('div');
  card.className = 'card';

  let tabs = '';
  TIER_LABELS.forEach(([tierKey, tierLabel], i) => {
    tabs += `
      <button type="button" class="tier-tab${i === 0 ? ' active' : ''}" id="tab-${domainKey}-${tierKey}"
        style="color:${color};" onclick="selectTier('${domainKey}', '${tierKey}', '${color}')">
        ${tierDotsHtml(tierKey, color)}
        <div class="tier-tab-label">${tierLabel}</div>
      </button>
    `;
  });

  card.innerHTML = `
    <div class="domain-header">
      <div class="domain-badge" style="background:${color}18;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${DOMAIN_ICON_PATHS[domainKey]}</svg>
      </div>
      <h2>${domain.label}</h2>
    </div>
    <p>${domain.description}</p>
    <div class="tier-tabs">${tabs}</div>
    <div class="tier-detail" id="detail-${domainKey}" style="border-top-color:${color};">
      <p>${domain.tiers.novice}</p>
    </div>
  `;
  container.appendChild(card);
  card.dataset.domainKey = domainKey;
});

document.getElementById('footerYear').textContent = new Date().getFullYear();

window.selectTier = function(domainKey, tierKey, color){
  document.getElementById('detail-' + domainKey).querySelector('p').textContent = window.FRAMEWORK_DATA[domainKey].tiers[tierKey];
  document.getElementById('detail-' + domainKey).style.borderTopColor = color;
  TIER_LABELS.forEach(([key]) => {
    document.getElementById('tab-' + domainKey + '-' + key).classList.remove('active');
  });
  document.getElementById('tab-' + domainKey + '-' + tierKey).classList.add('active');
};
</script>
</body>
</html>
