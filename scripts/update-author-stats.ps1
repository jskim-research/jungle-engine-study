$ErrorActionPreference = "Stop"

$files = git ls-files -- "*.md"
$stats = @{}

foreach ($file in $files) {
  if ($file -eq "index.md" -or $file -eq "README.md") {
    continue
  }

  $author = git log --reverse --format="%an" -- "$file" | Select-Object -First 1
  if ([string]::IsNullOrWhiteSpace($author)) {
    continue
  }

  if (-not $stats.ContainsKey($author)) {
    $stats[$author] = [ordered]@{ post_count = 0 }
  }

  $stats[$author].post_count++
}

New-Item -ItemType Directory -Force -Path "assets\data" | Out-Null

$payload = [ordered]@{
  generated_at = (Get-Date).ToString("o")
  authors = $stats
}

$payload | ConvertTo-Json -Depth 5 | Set-Content -Path "assets\data\author-stats.json" -Encoding UTF8
Write-Host "Updated assets/data/author-stats.json"
