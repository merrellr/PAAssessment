// Stands in for www's impact-core.js in the My saved tools tests: my-tools.html loads a tool's scoring file to draw a
// saved tool's results (mytools-seed.js points it here). Only decode and toCSV are used.
window.ImpactCore = {
  decode: (s) => (s === 'OLDDATA' || s === 'NEWDATA' ? { v: s } : null),
  toCSV: (st) => 'Organizational Impact Score,Roadmap\r\n\r\nAbout,This roadmap\r\n\r\nRank,Initiative,Impact score (0-100)\r\n1,SSO and audit logs,62\r\n2,"Onboarding, self-serve",\'-5\r\n\r\nNote,' + st.v + '\r\n'
};
