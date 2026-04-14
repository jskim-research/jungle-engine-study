[CmdletBinding()]
param(
  [string]$AuthorStatsOutputPath = "assets\data\author-stats.json",
  [string]$SiteMetaOutputPath = "assets\data\site-meta.json"
)

$ErrorActionPreference = "Stop"

function Get-MarkdownFiles {
  $tracked = @(git ls-files -- "*.md")
  $untracked = @(git ls-files --others --exclude-standard -- "*.md")

  $all = @($tracked + $untracked |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
    Where-Object { $_ -notmatch '^_site/' } |
    Sort-Object -Unique)

  return $all
}

$files = Get-MarkdownFiles
$authorStats = @{}
$pageMeta = @{}
$authorDocSets = @{}
$historyEntryLimit = 5
$maxLevel = 50
$levelsPerMonster = 10
$pointsPerLevel = 76

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

function Get-RankInfo([int]$score, [int]$maxLevelParam, [int]$levelsPerMonsterParam, [int]$pointsPerLevelParam) {
  $clamped = [Math]::Max($score, 0)
  $levelNo = [Math]::Min($maxLevelParam, [int][Math]::Floor($clamped / $pointsPerLevelParam) + 1)
  $floor = ($levelNo - 1) * $pointsPerLevelParam
  $next = if ($levelNo -ge $maxLevelParam) { $null } else { $levelNo * $pointsPerLevelParam }

  $tier = [int][Math]::Floor(($levelNo - 1) / $levelsPerMonsterParam)
  $monster = "Slime"
  $level = "Slime Apprentice"

  switch ($tier) {
    0 { $monster = "Slime"; $level = "Slime Apprentice" }
    1 { $monster = "Wolf"; $level = "Wolf Vanguard" }
    2 { $monster = "Golem"; $level = "Golem Strategist" }
    3 { $monster = "Wyvern"; $level = "Wyvern Marshal" }
    default { $monster = "Dragon"; $level = "Dragon Sovereign" }
  }

  return [ordered]@{
    level = $level
    level_no = $levelNo
    monster = $monster
    floor = $floor
    next = $next
  }
}

function Get-FallbackAuthor {
  $name = (git config user.name 2>$null)
  if (-not [string]::IsNullOrWhiteSpace($name)) {
    return $name.Trim()
  }

  return "Unknown Author"
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
      exp_next = $pointsPerLevel * 25
      level = "Slime Apprentice"
      level_no = 1
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
$fallbackAuthor = Get-FallbackAuthor

foreach ($file in $files) {
  if (-not (Test-Path -LiteralPath $file)) {
    continue
  }

  $baseName = [System.IO.Path]::GetFileName($file)
  if ($file -eq "index.md" -or $file -eq "README.md" -or $baseName -ieq "README.md" -or $baseName -ieq "write.md") {
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
  $lines = @($history | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  $lineOwners = @{}
  $owner = ""
  $totalContentLines = 0
  $latestAuthor = ""
  $latestDate = ""
  $firstAuthor = ""
  $firstDate = ""
  $historyEntries = New-Object System.Collections.Generic.List[object]
  $historyUrl = ""

  if ($lines.Count -gt 0) {
    $latestParts = $lines[0].Split([char]0x1f, 4)
    $firstParts = $lines[$lines.Count - 1].Split([char]0x1f, 4)

    $latestAuthor = if ($latestParts.Count -gt 1) { $latestParts[1] } else { "" }
    $latestDate = if ($latestParts.Count -gt 2) { $latestParts[2] } else { "" }
    $firstAuthor = if ($firstParts.Count -gt 1) { $firstParts[1] } else { "" }
    $firstDate = if ($firstParts.Count -gt 2) { $firstParts[2] } else { "" }

    $blame = git blame --line-porcelain -- "$file"
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

    if (-not [string]::IsNullOrWhiteSpace($repoInfo.base_url)) {
      $historyUrl = "{0}/commits/{1}/{2}" -f $repoInfo.base_url, $repoInfo.default_branch, (Convert-ToGitHubPath $file)
    }
  } else {
    # Uncommitted markdown file fallback: show provisional author metadata locally.
    $provisionalAuthor = $fallbackAuthor
    $fileInfo = Get-Item -LiteralPath $file
    $provisionalDate = $fileInfo.LastWriteTime.ToString("o")
    $contentLines = @($content -split "`r?`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }).Count
    if ($contentLines -gt 0) {
      $lineOwners[$provisionalAuthor] = $contentLines
      $totalContentLines = $contentLines
    }

    $latestAuthor = $provisionalAuthor
    $latestDate = $provisionalDate
    $firstAuthor = $provisionalAuthor
    $firstDate = $provisionalDate
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
  $rank = Get-RankInfo -score $total -maxLevelParam $maxLevel -levelsPerMonsterParam $levelsPerMonster -pointsPerLevelParam $pointsPerLevel
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
  $authorStats[$name].level_no = $rank.level_no
  $authorStats[$name].monster = $rank.monster
}

$sortedAuthorStats = [ordered]@{}
foreach ($name in ($authorStats.Keys | Sort-Object)) {
  $sortedAuthorStats[$name] = $authorStats[$name]
}

$sortedPageMeta = [ordered]@{}
foreach ($path in ($pageMeta.Keys | Sort-Object)) {
  $sortedPageMeta[$path] = $pageMeta[$path]
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
  authors = $sortedAuthorStats
}

$sitePayload = [ordered]@{
  generated_at = (Get-Date).ToString("o")
  scoring_version = "v3"
  authors = $sortedAuthorStats
  pages = $sortedPageMeta
}

$authorPayload | ConvertTo-Json -Depth 8 | Set-Content -Path $AuthorStatsOutputPath -Encoding UTF8
$sitePayload | ConvertTo-Json -Depth 8 | Set-Content -Path $SiteMetaOutputPath -Encoding UTF8
Write-Host "Updated $AuthorStatsOutputPath and $SiteMetaOutputPath"
