$ErrorActionPreference = 'Stop'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error 'Node.js is missing. Install Node 22.13+; see docs/DEVELOPER-SOP.md.'
    exit 1
}
& node (Join-Path $PSScriptRoot 'scripts/start.mjs') @args
exit $LASTEXITCODE
