[CmdletBinding()]
param(
  [switch]$NoLiveReload,
  [switch]$SkipBundleCheck
)

$ErrorActionPreference = "Stop"

& (Join-Path $PSScriptRoot "jekyll.ps1") serve @PSBoundParameters
