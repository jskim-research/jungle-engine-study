[CmdletBinding()]
param(
  [switch]$SkipBundleCheck
)

$ErrorActionPreference = "Stop"

& (Join-Path $PSScriptRoot "jekyll.ps1") build @PSBoundParameters
