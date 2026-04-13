[CmdletBinding()]
param(
  [switch]$SkipBuild,
  [switch]$KeepServer
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$script:ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$script:RepoRoot = Split-Path -Parent $script:ScriptRoot
$script:BaseUrl = "http://127.0.0.1:4000/jungle-engine-study/"
$serveProcess = $null

function Wait-ForSite([string]$Url, [int]$TimeoutSeconds = 120) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return
      }
    }
    catch {
      Start-Sleep -Seconds 2
      continue
    }

    Start-Sleep -Seconds 2
  }

  throw "Timed out while waiting for Jekyll site to be available at $Url"
}

Push-Location $script:RepoRoot

try {
  if (-not $SkipBuild) {
    & (Join-Path $script:ScriptRoot "build-site.ps1")
  }

  $serveProcess = Start-Process `
    -FilePath "node.exe" `
    -ArgumentList @(
      (Join-Path $script:ScriptRoot "preview-server.mjs"),
      "--site-dir", (Join-Path $script:RepoRoot "_site"),
      "--base-path", "/jungle-engine-study/",
      "--host", "127.0.0.1",
      "--port", "4000"
    ) `
    -WorkingDirectory $script:RepoRoot `
    -WindowStyle Hidden `
    -PassThru

  Wait-ForSite -Url $script:BaseUrl

  & npm.cmd run audit:visual -- --base-url $script:BaseUrl
  if ($LASTEXITCODE -ne 0) {
    throw "Visual audit command failed."
  }
}
finally {
  if ($serveProcess -and -not $KeepServer) {
    Stop-Process -Id $serveProcess.Id -Force -ErrorAction SilentlyContinue
  }

  Pop-Location
}
