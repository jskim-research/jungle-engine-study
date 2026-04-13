[CmdletBinding()]
param(
  [string]$IndexPath = "index.md",
  [string]$AuthorStatsPath = "assets\data\author-stats.json",
  [string]$SiteMetaPath = "assets\data\site-meta.json"
)

$ErrorActionPreference = "Stop"

function Get-ConceptDocs {
  $docs = New-Object System.Collections.Generic.List[string]
  $tracked = @(git ls-files -- "*.md")
  $untracked = @(git ls-files --others --exclude-standard -- "*.md")
  $allDocs = @($tracked + $untracked |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
    Where-Object { $_ -notmatch '^_site/' } |
    Sort-Object -Unique)

  foreach ($path in $allDocs) {
    $baseName = [System.IO.Path]::GetFileName($path)
    if ($path -eq "index.md" -or $path -eq "README.md" -or $baseName -ieq "README.md") {
      continue
    }

    $content = Get-Content -LiteralPath $path -Raw -Encoding UTF8
    if ([string]::IsNullOrWhiteSpace($content)) {
      continue
    }

    $docs.Add($path)
  }

  return @($docs | Sort-Object)
}

function Get-IndexLinkedDocs([string]$content) {
  $matches = [regex]::Matches($content, '<a[^>]+href="\./([^"]+)"')
  $docs = New-Object System.Collections.Generic.List[string]

  foreach ($match in $matches) {
    $hrefPath = [System.Uri]::UnescapeDataString($match.Groups[1].Value)
    $normalized = $hrefPath.Replace('\', '/').TrimStart('.','/')
    if (-not $normalized.EndsWith(".md")) {
      $normalized = "$normalized.md"
    }
    $docs.Add($normalized)
  }

  return $docs
}

function Get-DynamicIndexDirs([string]$content) {
  $matches = [regex]::Matches($content, "p\.dir\s*==\s*'/(?<dir>0[1-5]_[^/]+)/'")
  $whereMatches = [regex]::Matches($content, "where:\s*""dir""\s*,\s*""/(?<dir>0[1-5]_[^/]+)/""")
  $containsMatches = [regex]::Matches($content, "doc\.path\s+contains\s+'/?(?<dir>0[1-5]_[^/]+)/'")
  $dirs = New-Object System.Collections.Generic.HashSet[string]

  foreach ($match in $matches) {
    $null = $dirs.Add($match.Groups["dir"].Value)
  }

  foreach ($match in $whereMatches) {
    $null = $dirs.Add($match.Groups["dir"].Value)
  }

  foreach ($match in $containsMatches) {
    $null = $dirs.Add($match.Groups["dir"].Value)
  }

  return @($dirs)
}

function Is-CoveredByDynamicDir([string]$docPath, [string[]]$dynamicDirs) {
  foreach ($dir in $dynamicDirs) {
    if ($docPath.StartsWith("$dir/", [System.StringComparison]::OrdinalIgnoreCase)) {
      return $true
    }
  }

  return $false
}

function Get-NormalizedJson([string]$path) {
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Missing JSON file: $path"
  }

  $obj = Get-Content -LiteralPath $path -Raw -Encoding UTF8 | ConvertFrom-Json
  $normalized = [ordered]@{}

  foreach ($prop in $obj.PSObject.Properties) {
    if ($prop.Name -ne "generated_at") {
      $normalized[$prop.Name] = $prop.Value
    }
  }

  return ($normalized | ConvertTo-Json -Depth 100)
}

$conceptDocs = Get-ConceptDocs
$indexContent = Get-Content -LiteralPath $IndexPath -Raw -Encoding UTF8
$linkedDocs = @(Get-IndexLinkedDocs $indexContent)
$dynamicDirs = @(Get-DynamicIndexDirs $indexContent)
$issues = New-Object System.Collections.Generic.List[string]

$linkCounts = @{}
foreach ($doc in $linkedDocs) {
  if (-not $linkCounts.ContainsKey($doc)) {
    $linkCounts[$doc] = 0
  }
  $linkCounts[$doc]++
}

foreach ($doc in $conceptDocs) {
  if (Is-CoveredByDynamicDir -docPath $doc -dynamicDirs $dynamicDirs) {
    continue
  }

  $count = 0
  if ($linkCounts.ContainsKey($doc)) {
    $count = [int]$linkCounts[$doc]
  }

  if ($count -eq 0) {
    $issues.Add("Missing index link for concept document: $doc")
  } elseif ($count -gt 1) {
    $issues.Add("Duplicate index links for concept document: $doc ($count)")
  }
}

foreach ($doc in $linkedDocs) {
  if ($doc -notin $conceptDocs) {
    $issues.Add("Index link does not resolve to a concept document: $doc")
  }
}

$tempRoot = Join-Path -Path ([System.IO.Path]::GetTempPath()) -ChildPath ("jungle-site-validate-" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null

try {
  $tempAuthorStatsPath = Join-Path -Path $tempRoot -ChildPath "author-stats.json"
  $tempSiteMetaPath = Join-Path -Path $tempRoot -ChildPath "site-meta.json"

  & ".\scripts\update-author-stats.ps1" -AuthorStatsOutputPath $tempAuthorStatsPath -SiteMetaOutputPath $tempSiteMetaPath | Out-Null

  $trackedAuthorStats = Get-NormalizedJson $AuthorStatsPath
  $generatedAuthorStats = Get-NormalizedJson $tempAuthorStatsPath
  if ($trackedAuthorStats -ne $generatedAuthorStats) {
    $issues.Add("author-stats.json is stale. Regenerate metadata before merging.")
  }

  $trackedSiteMeta = Get-NormalizedJson $SiteMetaPath
  $generatedSiteMeta = Get-NormalizedJson $tempSiteMetaPath
  if ($trackedSiteMeta -ne $generatedSiteMeta) {
    $issues.Add("site-meta.json is stale. Regenerate metadata before merging.")
  }
}
finally {
  if (Test-Path -LiteralPath $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force
  }
}

if ($issues.Count -gt 0) {
  $issues | ForEach-Object { Write-Error $_ }
  exit 1
}

Write-Host "Site validation passed."
