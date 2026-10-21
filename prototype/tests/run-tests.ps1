# Runs every test suite for the Phase 2 prototype.
#
#   powershell -ExecutionPolicy Bypass -File prototype\tests\run-tests.ps1
#
# 1. engine.test.js  - data and engine checks in plain Node
# 2. ui.test.html    - the real commuter app driven in headless Chrome
# 3. sync.test.html  - union portal -> commuter app sync in headless Chrome
#
# The browser suites need a local server (localStorage is per-origin), so the
# script starts one, runs the tests, and stops it again.

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$proto = Join-Path $root 'prototype'
$port = 8137
$failed = $false

function Write-Head($text) { Write-Host ''; Write-Host "=== $text ===" -ForegroundColor Cyan }

# ---------------------------------------------------------------- engine ----
Write-Head 'engine.test.js (node)'
node (Join-Path $PSScriptRoot 'engine.test.js')
if ($LASTEXITCODE -ne 0) { $failed = $true }

# --------------------------------------------------------------- browser ----
$chrome = @(
  'C:\Program Files\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
  'C:\Program Files\Microsoft\Edge\Application\msedge.exe'
) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

if (-not $chrome) {
  Write-Host 'No Chrome or Edge found - skipping the browser suites.' -ForegroundColor Yellow
  Write-Host 'You can still open them by hand: prototype\tests\ui.test.html and sync.test.html' -ForegroundColor Yellow
} else {
  Write-Host "using $chrome"
  $srv = Start-Process -FilePath 'python' -ArgumentList '-m', 'http.server', $port, '--bind', '127.0.0.1' `
    -WorkingDirectory $proto -WindowStyle Hidden -PassThru
  Start-Sleep -Seconds 2

  try {
    foreach ($t in @('ui.test.html', 'sync.test.html')) {
      Write-Head $t
      $dom = & $chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=25000 `
        --dump-dom "http://127.0.0.1:$port/tests/$t" 2>$null | Out-String
      if ($dom -match '(?s)<pre id="results">(.*?)</pre>') {
        $body = $matches[1]
        Write-Host $body
        if ($body -notmatch 'ALL PASS') { $failed = $true }
      } else {
        Write-Host 'NO RESULTS - the test page did not finish' -ForegroundColor Red
        $failed = $true
      }
    }
  } finally {
    Stop-Process -Id $srv.Id -Force -ErrorAction SilentlyContinue
  }
}

Write-Host ''
if ($failed) { Write-Host 'SUITE FINISHED WITH FAILURES' -ForegroundColor Red; exit 1 }
Write-Host 'ALL SUITES PASSED' -ForegroundColor Green
exit 0
