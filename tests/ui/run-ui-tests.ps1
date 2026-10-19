# Runs every browser-based test for the company-accounts pages in one go.
#
#   powershell -ExecutionPolicy Bypass -File tests\ui\run-ui-tests.ps1
#
# Needs Microsoft Edge (for headless runs). No network and no Firebase account
# are used: each page's real code is loaded against tests\ui\fake-firebase.js,
# a small in-memory stand-in. Test copies of the pages are built in a temporary
# folder by swapping the Firebase web addresses for the fake and appending the
# test scripts; the real pages are never modified.
param(
  [string]$Edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
  [int]$Port = 8777,
  [string]$Only = ''   # optional: run only pages whose label matches this text, e.g. -Only reports
)

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$ui = Join-Path $repo 'tests\ui'
$site = Join-Path $env:TEMP 'pa-ui-tests'
if (Test-Path $site) { Remove-Item $site -Recurse -Force }
New-Item -ItemType Directory -Path $site | Out-Null

Copy-Item "$ui\*.js" $site
Copy-Item "$repo\org-share-core.js" $site
Copy-Item "$repo\company-core.js" $site
Copy-Item "$repo\focus-board.js" $site
Copy-Item "$repo\focus-board.css" $site
Copy-Item "$repo\tool-core.js" $site
Copy-Item "$repo\lead-core.js" $site
Copy-Item "$repo\charts.js" $site
Copy-Item "$repo\charts.css" $site
Copy-Item "$repo\company-report.js" $site
Copy-Item "$repo\pilot-core.js" $site
Copy-Item "$repo\analytics.js" $site
Copy-Item "$repo\pa-prefs.js" $site
Copy-Item "$repo\pa-shell.js" $site
Copy-Item "$repo\pa-theme.css" $site
Copy-Item "$repo\search-index.js" $site
Copy-Item "$repo\vendor" "$site\vendor" -Recurse
Copy-Item "$repo\content" "$site\content" -Recurse

$fb = 'https://www\.gstatic\.com/firebasejs/10\.13\.0/firebase-(app|auth|firestore)\.js'
$errHook = '<script>window.__errs=[];addEventListener("error",function(e){__errs.push((e.message||"error")+" @"+(e.filename||"").split("/").pop()+":"+e.lineno);});addEventListener("unhandledrejection",function(e){__errs.push("rejection: "+(e.reason&&e.reason.message||e.reason));});</script>'

$share = [System.IO.File]::ReadAllText("$repo\org-share.js") -replace $fb, './fake-firebase.js'
[System.IO.File]::WriteAllText("$site\org-share.js", $share)
$menu = [System.IO.File]::ReadAllText("$repo\account-menu.js") -replace $fb, './fake-firebase.js'
[System.IO.File]::WriteAllText("$site\account-menu.js", $menu)

function Build-Page($page, $out, $seedScript, $testScript) {
  $html = [System.IO.File]::ReadAllText("$repo\$page") -replace $fb, './fake-firebase.js'
  $head = if ($seedScript) { "<script src=`"$seedScript`"></script>" } else { $errHook }
  $i = $html.IndexOf('<head>')
  $html = $html.Substring(0, $i + 6) + $head + $html.Substring($i + 6)
  $j = $html.LastIndexOf('</body>')
  $html = $html.Substring(0, $j) + "<script type=`"module`" src=`"$testScript`"></script>" + $html.Substring($j)
  [System.IO.File]::WriteAllText("$site\$out", $html)
}
Build-Page 'owner.html' 'owner-test.html' $null 'owner-test.js'
Build-Page 'join.html' 'join-test.html' 'join-seed.js' 'join-test.js'
Build-Page 'lms-dashboard.html' 'dash-test.html' 'dash-seed.js' 'dash-test.js'
Build-Page 'profile.html' 'del-test.html' 'del-seed.js' 'del-test.js'
Build-Page 'lesson.html' 'les-test.html' 'les-seed.js' 'les-test.js'
Build-Page 'company.html' 'company-test.html' 'company-seed.js' 'company-test.js'
Build-Page 'tool-requests.html' 'tool-requests-test.html' 'tool-seed.js' 'tool-test.js'
Build-Page 'owner-tools.html' 'owner-tools-test.html' 'owner-tools-seed.js' 'owner-tools-test.js'
Build-Page 'request-info.html' 'request-info-test.html' 'lead-seed.js' 'lead-test.js'
Build-Page 'reports.html' 'reports-test.html' 'reports-seed.js' 'reports-test.js'
Build-Page 'owner-pilot.html' 'pilot-test.html' 'pilot-seed.js' 'pilot-test.js'
Build-Page 'index.html' 'index-test.html' 'index-seed.js' 'index-test.js'
$menuPage = "<!doctype html><html><head><script src=`"menu-seed.js`"></script></head><body><div class=`"wrap`"><p>A page</p></div><script type=`"module`" src=`"account-menu.js`"></script><script type=`"module`" src=`"menu-test.js`"></script></body></html>"
[System.IO.File]::WriteAllText("$site\menu-test.html", $menuPage)
[System.IO.File]::WriteAllText("$site\consent-test.html", "<!doctype html><html><head><script src=`"consent-seed.js`"></script><script src=`"analytics.js`"></script></head><body><div class=`"wrap`"><p>A page</p></div><script type=`"module`" src=`"account-menu.js`"></script><script type=`"module`" src=`"consent-test.js`"></script></body></html>")
[System.IO.File]::WriteAllText("$site\menu-off-test.html", $menuPage.Replace('src="account-menu.js"', 'src="account-menu.js?menu=off"'))
[System.IO.File]::WriteAllText("$site\profile.html", $menuPage)   # same page under the name profile.html, to check the "you are here" marking
[System.IO.File]::WriteAllText("$site\share-test.html", "<!doctype html><html><head>$errHook</head><body><script type=`"module`" src=`"share-test.js`"></script></body></html>")

# a tiny web server, because browsers will not load ES modules from files
$server = Start-Job -ArgumentList $site, $Port -ScriptBlock {
  param($site, $port)
  $l = New-Object System.Net.HttpListener
  $l.Prefixes.Add("http://127.0.0.1:$port/")
  $l.Start()
  $types = @{ '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css' }
  while ($true) {
    $c = $l.GetContext()
    try {
      $rel = [Uri]::UnescapeDataString($c.Request.Url.AbsolutePath.TrimStart('/'))
      $p = Join-Path $site ($rel -replace '/', '\')
      if ((Test-Path $p -PathType Leaf) -and $p.StartsWith($site)) {
        $b = [System.IO.File]::ReadAllBytes($p)
        $ext = [System.IO.Path]::GetExtension($p).ToLower()
        $c.Response.ContentType = $(if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' })
        $c.Response.Headers.Add('Cache-Control', 'no-store')
        $c.Response.OutputStream.Write($b, 0, $b.Length)
      } else { $c.Response.StatusCode = 404 }
    } catch { $c.Response.StatusCode = 500 }
    $c.Response.Close()
  }
}
Start-Sleep -Seconds 2

function Run-Page($label, $url, $budget) {
  if ($Only -and ($label -notlike "*$Only*")) { return }
  # Edge prints harmless warnings on stderr; do not let them stop the run.
  $ErrorActionPreference = 'Continue'
  $dom = & $Edge --headless --disable-gpu --virtual-time-budget=$budget --dump-dom $url 2>$null | Out-String
  $m = [regex]::Match($dom, 'data-results="(.*?)"', 'Singleline')
  $text = if ($m.Success) { $m.Groups[1].Value } else { [regex]::Match($dom, '<title>(.*?)</title>', 'Singleline').Groups[1].Value }
  $text = $text -replace '&amp;', '&' -replace '&gt;', '>' -replace '&lt;', '<' -replace '&quot;', '"' -replace '&#39;', "'"
  $lines = @($text -split ' \|\| ')
  $passed = @($lines | Where-Object { $_ -like 'PASS*' }).Count
  $bad = @($lines | Where-Object { $_ -like 'FAIL*' -or $_ -like 'PAGE-ERROR*' })
  if ($passed -eq 0 -and $bad.Count -eq 0) { $bad = @("FAIL $label produced no results") }
  [pscustomobject]@{ Label = $label; Pass = $passed; Fail = $bad.Count; Details = $bad }
}

$tok = '0123456789abcdef0123456789abcdef'
$base = "http://127.0.0.1:$Port"
$results = @()
try {
  $results += Run-Page 'owner console' "$base/owner-test.html" 300000
  foreach ($s in 'ready', 'admin', 'nophone', 'rejoin', 'denied', 'flaky', 'sharefail', 'signedout', 'notfound', 'expired', 'revoked', 'used', 'elsewhere', 'herealready', 'joinedbefore') {
    $results += Run-Page "join page: $s" "$base/join-test.html?scn=$s&token=$tok" 20000
  }
  $results += Run-Page 'join page: badtoken' "$base/join-test.html?scn=badtoken&token=abc" 20000
  foreach ($s in 'member', 'focus', 'focusdefault', 'admin', 'plain', 'removed', 'owner', 'threelessons', 'allfive', 'recentdone', 'removedold') { $results += Run-Page "dashboard: $s" "$base/dash-test.html?scn=$s" 25000 }
  foreach ($s in 'member', 'nonmember', 'blocked', 'votefail') { $results += Run-Page "delete account: $s" "$base/del-test.html?scn=$s" 25000 }
  foreach ($s in 'member', 'plain') { $results += Run-Page "last lesson: $s" "$base/les-test.html?scn=$s&course=discovery-novice&lesson=5" 30000 }
  foreach ($s in 'admin', 'empty', 'archived', 'nocopy', 'auditdenied', 'owner', 'ownernoorg', 'plain', 'member', 'removedadmin', 'denied', 'sharesdenied', 'signedout', 'history', 'snapshotsdenied', 'snapfail', 'noplatform', 'smallplatform') {
    $org = if ($s -eq 'owner') { '&org=orgA' } else { '' }
    $results += Run-Page "company dashboard: $s" "$base/company-test.html?scn=$s$org" 40000
  }
  foreach ($s in 'anon', 'fresh', 'unverified', 'voter', 'suggested', 'approved', 'empty', 'loaderror') {
    $results += Run-Page "tool roadmap: $s" "$base/tool-requests-test.html?scn=$s" 40000
  }
  $results += Run-Page 'tool roadmap: deeplink' "$base/tool-requests-test.html?scn=deeplink&tool=t4" 40000
  foreach ($s in 'main', 'empty', 'notowner', 'signedout', 'launch') {
    $results += Run-Page "tool roadmap admin: $s" "$base/owner-tools-test.html?scn=$s" 40000
  }
  foreach ($s in 'org', 'individual', 'back', 'signedin', 'nobackend', 'fail', 'unconfirmed', 'ratelimit', 'rejected') {
    $results += Run-Page "request info form: $s" "$base/request-info-test.html?scn=$s" 90000
  }
  $results += Run-Page 'request info form: call' "$base/request-info-test.html?scn=call&call=1" 90000
  $results += Run-Page 'request info form: preset' "$base/request-info-test.html?scn=preset&who=org&src=toolkits" 90000
  foreach ($s in 'main', 'notowner', 'signedout', 'oldscript', 'unreachable', 'serverrefuses') {
    $results += Run-Page "reports: $s" "$base/reports-test.html?scn=$s" 60000
  }
  foreach ($s in 'high', 'low') {
    $results += Run-Page "assessment: $s" "$base/index-test.html?scn=$s" 60000
  }
  foreach ($s in 'main', 'fresh', 'customer', 'saverefused', 'snapfail', 'deniedpilot', 'notowner', 'signedout') {
    $results += Run-Page "pilot tracker: $s" "$base/pilot-test.html?scn=$s&org=orgA" 60000
  }
  $results += Run-Page 'pilot tracker: noorg' "$base/pilot-test.html?scn=noorg" 40000
  $results += Run-Page 'pilot tracker: notfound' "$base/pilot-test.html?scn=notfound&org=zzz" 40000
  foreach ($s in 'plain', 'noname', 'owner', 'admin', 'removedadmin', 'memberrole', 'signedout') {
    $results += Run-Page "profile menu: $s" "$base/menu-test.html?scn=$s" 30000
  }
  foreach ($s in 'newaccount', 'oldaccount', 'welcomedone', 'welcomefail', 'welcomedown') {
    $results += Run-Page "profile menu: $s" "$base/menu-test.html?scn=$s" 30000
  }
  foreach ($s in 'adminjoinnew', 'adminjoinold', 'adminjoinremoved', 'membernew', 'adminjoindone', 'adminjoinfail', 'adminjoindown', 'adminjoinlate') {
    $results += Run-Page "profile menu: $s" "$base/menu-test.html?scn=$s" 30000
  }
  foreach ($s in 'new', 'us_new', 'stored_accepted', 'stored_declined', 'signedin', 'signedin_declined', 'dnt', 'gpc') {
    $results += Run-Page "cookie notice: $s" "$base/consent-test.html?scn=$s" 30000
  }
  $results += Run-Page 'profile menu: menu off, new account' "$base/menu-off-test.html?scn=newaccount" 30000
  $results += Run-Page 'profile menu: current page' "$base/profile.html?scn=plain" 30000
  $results += Run-Page 'shared-record sync' "$base/share-test.html" 40000
} finally {
  Stop-Job $server -ErrorAction SilentlyContinue
  Remove-Job $server -Force -ErrorAction SilentlyContinue
}

$results | ForEach-Object { '{0,-34} pass {1,3}   fail {2}' -f $_.Label, $_.Pass, $_.Fail }
$failed = @($results | Where-Object { $_.Fail -gt 0 })
$failed | ForEach-Object { $_.Details }
'---'
'TOTAL pass {0}   fail {1}' -f (($results | Measure-Object Pass -Sum).Sum), (($results | Measure-Object Fail -Sum).Sum)
'Not covered here: finishing a lesson that is NOT the last one changes the page, so it is checked by hand'
'(see tests\README.md).'
if ($failed.Count) { exit 1 }
