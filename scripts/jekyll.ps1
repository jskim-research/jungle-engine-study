[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [ValidateSet("install", "build", "serve", "doctor", "clean")]
  [string]$Action = "serve",

  [switch]$NoLiveReload,
  [switch]$SkipBundleCheck
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$script:ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$script:RepoRoot = Split-Path -Parent $script:ScriptRoot

function Get-RubyBinFromPath {
  $rubyCommand = Get-Command ruby -ErrorAction SilentlyContinue
  if ($rubyCommand) {
    return Split-Path -Parent $rubyCommand.Source
  }

  return $null
}

function Get-RubyBinFromCommonLocations {
  $roots = @(
    "C:\",
    "C:\Program Files",
    "C:\Program Files (x86)",
    $env:LOCALAPPDATA
  ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }

  foreach ($root in $roots) {
    $candidates = @(Get-ChildItem -Path $root -Directory -Filter "Ruby*" -ErrorAction SilentlyContinue)
    foreach ($candidate in ($candidates | Sort-Object FullName -Descending)) {
      $binPath = Join-Path $candidate.FullName "bin"
      if (Test-Path -LiteralPath (Join-Path $binPath "ruby.exe")) {
        return $binPath
      }
    }
  }

  return $null
}

function Resolve-RubyBin {
  $rubyBin = Get-RubyBinFromPath
  if ($rubyBin) {
    return $rubyBin
  }

  $rubyBin = Get-RubyBinFromCommonLocations
  if ($rubyBin) {
    return $rubyBin
  }

  throw "Ruby was not found. Install RubyInstallerTeam.RubyWithDevKit.3.3 first."
}

function Ensure-RubyOnPath([string]$RubyBin) {
  $pathEntries = @($env:PATH -split ';' | Where-Object { $_ })
  if ($pathEntries -contains $RubyBin) {
    return
  }

  $env:PATH = "$RubyBin;$env:PATH"
}

function Resolve-BundleExecutable([string]$RubyBin) {
  $bundleCommand = Get-Command bundle -ErrorAction SilentlyContinue
  if ($bundleCommand) {
    return $bundleCommand.Source
  }

  $bundleBat = Join-Path $RubyBin "bundle.bat"
  if (Test-Path -LiteralPath $bundleBat) {
    return $bundleBat
  }

  throw "Bundler executable was not found. Run gem install bundler first."
}

function Resolve-GitHubRepoNwo {
  if ($env:PAGES_REPO_NWO) {
    return $env:PAGES_REPO_NWO
  }

  $remoteUrl = git remote get-url origin 2>$null
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($remoteUrl)) {
    return $null
  }

  if ($remoteUrl -match '^https://github\.com/(?<owner>[^/]+)/(?<repo>[^/]+?)(?:\.git)?$') {
    return "$($Matches.owner)/$($Matches.repo)"
  }

  if ($remoteUrl -match '^git@github\.com:(?<owner>[^/]+)/(?<repo>[^/]+?)(?:\.git)?$') {
    return "$($Matches.owner)/$($Matches.repo)"
  }

  if ($remoteUrl -match '^ssh://git@github\.com/(?<owner>[^/]+)/(?<repo>[^/]+?)(?:\.git)?$') {
    return "$($Matches.owner)/$($Matches.repo)"
  }

  return $null
}

function Invoke-Tool([string]$FilePath, [string[]]$Arguments) {
  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed: $FilePath $($Arguments -join ' ')"
  }
}

function Ensure-BundleDependencies([string]$BundleExecutable) {
  if ($SkipBundleCheck) {
    return
  }

  & $BundleExecutable check | Out-Null
  if ($LASTEXITCODE -eq 0) {
    return
  }

  Invoke-Tool -FilePath $BundleExecutable -Arguments @("install")
}

Push-Location $script:RepoRoot

try {
  $rubyBin = Resolve-RubyBin
  Ensure-RubyOnPath -RubyBin $rubyBin

  $repoNwo = Resolve-GitHubRepoNwo
  if ($repoNwo) {
    $env:PAGES_REPO_NWO = $repoNwo
  }

  $bundleExecutable = Resolve-BundleExecutable -RubyBin $rubyBin

  switch ($Action) {
    "install" {
      Invoke-Tool -FilePath $bundleExecutable -Arguments @("install")
      break
    }
    "clean" {
      Ensure-BundleDependencies -BundleExecutable $bundleExecutable
      Invoke-Tool -FilePath $bundleExecutable -Arguments @("exec", "jekyll", "clean")
      break
    }
    "doctor" {
      Ensure-BundleDependencies -BundleExecutable $bundleExecutable
      Invoke-Tool -FilePath $bundleExecutable -Arguments @("exec", "jekyll", "doctor")
      break
    }
    "build" {
      Ensure-BundleDependencies -BundleExecutable $bundleExecutable
      Invoke-Tool -FilePath $bundleExecutable -Arguments @("exec", "jekyll", "build")
      break
    }
    "serve" {
      Ensure-BundleDependencies -BundleExecutable $bundleExecutable
      $arguments = @("exec", "jekyll", "serve")
      if (-not $NoLiveReload) {
        $arguments += "--livereload"
      }
      Invoke-Tool -FilePath $bundleExecutable -Arguments $arguments
      break
    }
  }
}
finally {
  Pop-Location
}
