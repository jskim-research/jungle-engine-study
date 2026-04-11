$ErrorActionPreference = "Stop"

$files = git ls-files -- "*.md"
$authorStats = @{}
$pageMeta = @{}

function Get-Level([int]$postCount) {
  if ($postCount -ge 20) { return "Legend Engineer" }
  if ($postCount -ge 10) { return "Veteran Engineer" }
  if ($postCount -ge 5) { return "Advanced Engineer" }
  if ($postCount -ge 2) { return "Rising Engineer" }
  return "Novice Engineer"
}

foreach ($file in $files) {
  if ($file -eq "index.md" -or $file -eq "README.md") {
    continue
  }

  $history = git log --follow --format="%an|%aI" -- "$file"
  if (-not $history) {
    continue
  }

  $lines = @($history | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  if ($lines.Count -eq 0) {
    continue
  }

  $latestParts = $lines[0].Split("|", 2)
  $firstParts = $lines[$lines.Count - 1].Split("|", 2)

  $latestAuthor = $latestParts[0]
  $latestDate = if ($latestParts.Count -gt 1) { $latestParts[1] } else { "" }
  $firstAuthor = $firstParts[0]
  $firstDate = if ($firstParts.Count -gt 1) { $firstParts[1] } else { "" }

  $pageMeta[$file] = [ordered]@{
    first_author = $firstAuthor
    first_date = $firstDate
    latest_author = $latestAuthor
    latest_date = $latestDate
    revision_count = $lines.Count
  }

  if (-not $authorStats.ContainsKey($firstAuthor)) {
    $authorStats[$firstAuthor] = [ordered]@{ post_count = 0 }
  }

  $authorStats[$firstAuthor].post_count++
}

foreach ($name in $authorStats.Keys) {
  $count = [int]$authorStats[$name].post_count
  $authorStats[$name].level = Get-Level $count
}

New-Item -ItemType Directory -Force -Path "assets\data" | Out-Null

$authorPayload = [ordered]@{
  generated_at = (Get-Date).ToString("o")
  authors = $authorStats
}

$sitePayload = [ordered]@{
  generated_at = (Get-Date).ToString("o")
  authors = $authorStats
  pages = $pageMeta
}

$authorPayload | ConvertTo-Json -Depth 8 | Set-Content -Path "assets\data\author-stats.json" -Encoding UTF8
$sitePayload | ConvertTo-Json -Depth 8 | Set-Content -Path "assets\data\site-meta.json" -Encoding UTF8
Write-Host "Updated assets/data/author-stats.json and assets/data/site-meta.json"
