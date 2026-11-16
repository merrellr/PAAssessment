(function(){
  window.__errs = [];
  addEventListener('error', function(e){ window.__errs.push((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno); });
  addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + (e.reason && e.reason.message || e.reason)); });
  var scn = new URLSearchParams(location.search).get('scn') || 'list';
  window.__scn = scn;
  window.__fakeUser = null;
  window.__seed = function(){};
  window.__episodesUrl = scn === 'fail' ? 'no-such-episodes.json' : 'listen-episodes.json';
})();
