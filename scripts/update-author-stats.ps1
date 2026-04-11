[CmdletBinding()]
param(
  [string]$AuthorStatsOutputPath = "assets\data\author-stats.json",
  [string]$SiteMetaOutputPath = "assets\data\site-meta.json"
)

$ErrorActionPreference = "Stop"

$files = git ls-files -- "*.md"
$authorStats = @{}
$pageMeta = @{}
$authorDocSets = @{}
$historyEntryLimit = 5

function Get-GitHubRepoInfo {
  $defaultBranch = "main"
  $baseUrl = ""

  $originHead = git symbolic-ref refs/remotes/origin/HEAD 2>$null
  if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($originHead)) {
    $defaultBranch = Split-Path -Leaf $originHead.Trim()
  }

  $remoteUrl = git remote get-url origin 2>$null
  if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($remoteUrl)) {
    $owner = ""
    $repo = ""

    if ($remoteUrl -match '^https://github\.com/(?<owner>[^/]+)/(?<repo>[^/]+?)(?:\.git)?$') {
      $owner = $Matches.owner
      $repo = $Matches.repo
    } elseif ($remoteUrl -match '^git@github\.com:(?<owner>[^/]+)/(?<repo>[^/]+?)(?:\.git)?$') {
      $owner = $Matches.owner
      $repo = $Matches.repo
    } elseif ($remoteUrl -match '^ssh://git@github\.com/(?<owner>[^/]+)/(?<repo>[^/]+?)(?:\.git)?$') {
      $owner = $Matches.owner
      $repo = $Matches.repo
    }

    if (-not [string]::IsNullOrWhiteSpace($owner) -and -not [string]::IsNullOrWhiteSpace($repo)) {
      $baseUrl = "https://github.com/$owner/$repo"
    }
  }

  return [ordered]@{
    base_url = $baseUrl
    default_branch = $defaultBranch
  }
}

function Convert-ToGitHubPath([string]$path) {
  $segments = $path -split '[\\/]'
  return (($segments | ForEach-Object { [System.Uri]::EscapeDataString($_) }) -join '/')
}

function Get-RankInfo([int]$score) {
  if ($score -ge 760) {
    return [ordered]@{ level = "Dragon Sovereign"; monster = "Dragon"; floor = 760; next = $null }
  }
  if ($score -ge 520) {
    return [ordered]@{ level = "Wyvern Marshal"; monster = "Wyvern"; floor = 520; next = 760 }
  }
  if ($score -ge 320) {
    return [ordered]@{ level = "Golem Strategist"; monster = "Golem"; floor = 320; next = 520 }
  }
  if ($score -ge 180) {
    return [ordered]@{ level = "Wolf Vanguard"; monster = "Wolf"; floor = 180; next = 320 }
  }
  return [ordered]@{ level = "Slime Apprentice"; monster = "Slime"; floor = 0; next = 180 }
}

function Ensure-Author([string]$name) {
  if ([string]::IsNullOrWhiteSpace($name)) {
    return
  }

  if (-not $authorStats.ContainsKey($name)) {
    $authorStats[$name] = [ordered]@{
      concept_doc_count = 0
      content_line_count = 0
      lead_doc_count = 0
      quality_score = 0
      collaboration_score = 0
      total_score = 0
      exp = 0
      exp_current = 0
      exp_next = 180
      level = "Slime Apprentice"
      monster = "Slime"
    }
  }

  if (-not $authorDocSets.ContainsKey($name)) {
    $authorDocSets[$name] = @{}
  }
}

function Add-WordsQuality([int]$wordCount) {
  if ($wordCount -ge 1200) { return 14 }
  if ($wordCount -ge 800) { return 10 }
  if ($wordCount -ge 400) { return 7 }
  if ($wordCount -ge 200) { return 4 }
  return 2
}

function Get-QualityScore([string]$content) {
  $textWithoutCode = [regex]::Replace($content, '```[\s\S]*?```', ' ')
  $words = ([regex]::Matches($textWithoutCode, '[\p{L}\p{N}_-]+')).Count
  $headings = ([regex]::Matches($content, '(?m)^\s*#{1,6}\s+')).Count
  $markdownImages = ([regex]::Matches($content, '!\[[^\]]*\]\([^)]+\)')).Count
  $htmlImages = ([regex]::Matches($content, '<img\b[^>]*\bsrc\s*=\s*["''][^>"'']+["''][^>]*>')).Count
  $images = $markdownImages + $htmlImages
  $codeBlocks = ([regex]::Matches($content, '```')).Count / 2
  $formula = ([regex]::Matches($content, '\\\(|\\\[|\$\$')).Count
  $refs = ([regex]::Matches($content, 'https?://')).Count

  $score = 0
  $score += Add-WordsQuality $words
  $score += [Math]::Min($headings * 2, 8)
  $score += [Math]::Min($images * 2, 6)
  $score += [Math]::Min($codeBlocks * 2, 6)
  $score += [Math]::Min($formula * 2, 6)
  $score += [Math]::Min($refs, 4)

  return [Math]::Min([int]$score, 40)
}

$repoInfo = Get-GitHubRepoInfo

foreach ($file in $files) {
  $baseName = [System.IO.Path]::GetFileName($file)
  if ($file -eq "index.md" -or $file -eq "README.md" -or $baseName -ieq "README.md") {
    continue
  }

  $content = Get-Content -LiteralPath $file -Raw
  if ($null -eq $content) {
    $content = ""
  }
  if ([string]::IsNullOrWhiteSpace($content)) {
    continue
  }
  $qualityScore = Get-QualityScore $content
  $history = git log --follow --format="%H%x1f%an%x1f%aI%x1f%s" -- "$file"
  if (-not $history) {
    continue
  }

  $lines = @($history | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  if ($lines.Count -eq 0) {
    continue
  }

  $latestParts = $lines[0].Split([char]0x1f, 4)
  $firstParts = $lines[$lines.Count - 1].Split([char]0x1f, 4)

  $latestAuthor = if ($latestParts.Count -gt 1) { $latestParts[1] } else { "" }
  $latestDate = if ($latestParts.Count -gt 2) { $latestParts[2] } else { "" }
  $firstAuthor = if ($firstParts.Count -gt 1) { $firstParts[1] } else { "" }
  $firstDate = if ($firstParts.Count -gt 2) { $firstParts[2] } else { "" }

  $blame = git blame --line-porcelain -- "$file"
  $lineOwners = @{}
  $owner = ""
  $totalContentLines = 0

  foreach ($blameLine in $blame) {
    if ($blameLine.StartsWith("author ")) {
      $owner = $blameLine.Substring(7)
      Ensure-Author $owner
      continue
    }

    if ($blameLine.StartsWith("`t")) {
      $txt = $blameLine.Substring(1)
      if (-not [string]::IsNullOrWhiteSpace($txt)) {
        if (-not $lineOwners.ContainsKey($owner)) {
          $lineOwners[$owner] = 0
        }
        $lineOwners[$owner]++
        $totalContentLines++
      }
    }
  }

  $leadLineCount = 0
  foreach ($name in $lineOwners.Keys) {
    $count = [int]$lineOwners[$name]
    if ($count -gt $leadLineCount) {
      $leadLineCount = $count
    }
  }

  $leadAuthors = @(
    $lineOwners.Keys |
      Where-Object { [int]$lineOwners[$_] -eq $leadLineCount -and $leadLineCount -gt 0 } |
      Sort-Object
  )

  $historyEntries = New-Object System.Collections.Generic.List[object]
  $historyCount = [Math]::Min($historyEntryLimit, $lines.Count)
  for ($i = 0; $i -lt $historyCount; $i++) {
    $parts = $lines[$i].Split([char]0x1f, 4)
    $sha = if ($parts.Count -gt 0) { $parts[0] } else { "" }
    $author = if ($parts.Count -gt 1) { $parts[1] } else { "" }
    $date = if ($parts.Count -gt 2) { $parts[2] } else { "" }
    $message = if ($parts.Count -gt 3) { $parts[3] } else { "" }
    $commitUrl = ""

    if (-not [string]::IsNullOrWhiteSpace($repoInfo.base_url) -and -not [string]::IsNullOrWhiteSpace($sha)) {
      $commitUrl = "$($repoInfo.base_url)/commit/$sha"
    }

    $historyEntries.Add([ordered]@{
      sha = $sha
      message = $message
      author = $author
      date = $date
      commit_url = $commitUrl
    })
  }

  $historyUrl = ""
  if (-not [string]::IsNullOrWhiteSpace($repoInfo.base_url)) {
    $historyUrl = "{0}/commits/{1}/{2}" -f $repoInfo.base_url, $repoInfo.default_branch, (Convert-ToGitHubPath $file)
  }

  foreach ($name in $lineOwners.Keys) {
    Ensure-Author $name
    $count = [int]$lineOwners[$name]
    $authorStats[$name].content_line_count += $count
    $authorDocSets[$name][$file] = $true

    if ($totalContentLines -gt 0) {
      $allocated = [int][Math]::Round($qualityScore * ($count / $totalContentLines), 0)
      $authorStats[$name].quality_score += $allocated
    }

    if ($count -eq $leadLineCount -and $count -gt 0) {
      $authorStats[$name].lead_doc_count++
    }
  }

  $pageMeta[$file] = [ordered]@{
    first_author = $firstAuthor
    first_date = $firstDate
    lead_authors = $leadAuthors
    lead_line_count = $leadLineCount
    history_entries = $historyEntries
    history_url = $historyUrl
    latest_author = $latestAuthor
    latest_date = $latestDate
    revision_count = $lines.Count
    quality_score = $qualityScore
    word_count = ([regex]::Matches([regex]::Replace($content, '```[\s\S]*?```', ' '), '[\p{L}\p{N}_-]+')).Count
  }
}

foreach ($name in $authorStats.Keys) {
  $docCount = $authorDocSets[$name].Count
  $authorStats[$name].concept_doc_count = $docCount

  $lineCount = [int]$authorStats[$name].content_line_count
  $quality = [int]$authorStats[$name].quality_score
  $leadDocs = [int]$authorStats[$name].lead_doc_count

  $contentScore = [int][Math]::Round([Math]::Sqrt([double]$lineCount) * 12, 0)
  $leadBonus = $leadDocs * 10
  $crossDocs = [Math]::Max($docCount - $leadDocs, 0)

  $collab = 0
  if ($crossDocs -ge 8) {
    $collab = 25
  } elseif ($crossDocs -ge 4) {
    $collab = 12
  } elseif ($crossDocs -ge 1) {
    $collab = 5
  }

  $total = $contentScore + $quality + $leadBonus + $collab
  $rank = Get-RankInfo $total
  $exp = $total * 25

  if ($null -eq $rank.next) {
    $expCurrent = $exp - ($rank.floor * 25)
    $expNext = $null
  } else {
    $expCurrent = $exp - ($rank.floor * 25)
    $expNext = ($rank.next - $rank.floor) * 25
  }

  $authorStats[$name].collaboration_score = $collab
  $authorStats[$name].total_score = $total
  $authorStats[$name].exp = $exp
  $authorStats[$name].exp_current = $expCurrent
  $authorStats[$name].exp_next = $expNext
  $authorStats[$name].level = $rank.level
  $authorStats[$name].monster = $rank.monster
}

$authorOutputDir = Split-Path -Path $AuthorStatsOutputPath -Parent
$siteOutputDir = Split-Path -Path $SiteMetaOutputPath -Parent

if (-not [string]::IsNullOrWhiteSpace($authorOutputDir)) {
  New-Item -ItemType Directory -Force -Path $authorOutputDir | Out-Null
}

if (-not [string]::IsNullOrWhiteSpace($siteOutputDir)) {
  New-Item -ItemType Directory -Force -Path $siteOutputDir | Out-Null
}

$authorPayload = [ordered]@{
  generated_at = (Get-Date).ToString("o")
  scoring_version = "v3"
  authors = $authorStats
}

$sitePayload = [ordered]@{
  generated_at = (Get-Date).ToString("o")
  scoring_version = "v3"
  authors = $authorStats
  pages = $pageMeta
}

$authorPayload | ConvertTo-Json -Depth 8 | Set-Content -Path $AuthorStatsOutputPath -Encoding UTF8
$sitePayload | ConvertTo-Json -Depth 8 | Set-Content -Path $SiteMetaOutputPath -Encoding UTF8
Write-Host "Updated $AuthorStatsOutputPath and $SiteMetaOutputPath"
