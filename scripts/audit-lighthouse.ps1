param(
  [string]$ConfigPath = "./lighthouse-audit.json",
  [string]$ReportDirectory = "./lighthouse-reports",
  [string]$ChromePath = ""
)

$ErrorActionPreference = "Stop"
$config = Get-Content -Raw $ConfigPath | ConvertFrom-Json

if (-not $ChromePath) {
  $candidates = @(
    $env:CHROME_PATH,
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Google\Chrome\Application\chrome.exe"
  ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
  $ChromePath = $candidates | Select-Object -First 1
}
if (-not $ChromePath -or -not (Test-Path -LiteralPath $ChromePath)) {
  throw "Defina -ChromePath ou instale Chrome/Edge para executar Lighthouse."
}

New-Item -ItemType Directory -Force -Path $ReportDirectory | Out-Null
$env:CHROME_PATH = (Resolve-Path -LiteralPath $ChromePath).Path
$lighthouseVersion = (& npx --yes "lighthouse@$($config.cliVersion)" --version).Trim()
if ($lighthouseVersion -ne $config.cliVersion) {
  throw "Versão inesperada do Lighthouse: $lighthouseVersion"
}

$scores = @()
foreach ($page in $config.pages.PSObject.Properties) {
  foreach ($profile in $config.profiles) {
    for ($run = 1; $run -le $config.runs; $run++) {
      $name = "$($page.Name)-$profile-run-$run"
      $outputBase = Join-Path $ReportDirectory $name
      $cliArgs = @(
        "--chrome-flags=$($config.chromeFlags)",
        "--only-categories=$($config.categories -join ',')",
        "--output=html", "--output=json", "--output-path=$outputBase", "--quiet"
      )
      if ($profile -eq "desktop") { $cliArgs += "--preset=desktop" }
      $url = "$($config.baseUrl)$($page.Value)"
      Write-Host "Lighthouse $name ($url)"
      & npx --yes "lighthouse@$($config.cliVersion)" $url @cliArgs
      if ($LASTEXITCODE -ne 0) { throw "Lighthouse falhou em $name (exit $LASTEXITCODE)" }
      $jsonPath = "$outputBase.report.json"
      $report = Get-Content -Raw $jsonPath | ConvertFrom-Json
      $scoreRow = [ordered]@{ page = $page.Name; profile = $profile; run = $run }
      foreach ($category in $config.categories) {
        $scoreRow[$category] = [math]::Round($report.categories.$category.score * 100, 1)
      }
      foreach ($metric in $config.metrics) {
        $scoreRow[$metric] = $report.audits.$metric.numericValue
      }
      $scores += [pscustomobject]$scoreRow
    }
  }
}

function Get-Median([double[]]$Values) {
  $ordered = @($Values | Sort-Object)
  $middle = [math]::Floor($ordered.Count / 2)
  if ($ordered.Count % 2) { return $ordered[$middle] }
  return ($ordered[$middle - 1] + $ordered[$middle]) / 2
}

$groups = @()
foreach ($group in ($scores | Group-Object page, profile)) {
  $parts = $group.Name -split ', '
  $row = [ordered]@{ page = $parts[0]; profile = $parts[1]; runs = $group.Count }
  foreach ($category in $config.categories) {
    $row[$category] = [math]::Round((Get-Median ([double[]]($group.Group | ForEach-Object { $_.$category }))), 1)
  }
  foreach ($metric in $config.metrics) {
    $row[$metric] = [math]::Round((Get-Median ([double[]]($group.Group | ForEach-Object { $_.$metric }))), 1)
  }
  $groups += [pscustomobject]$row
}

$summary = [ordered]@{
  generatedAt = (Get-Date).ToString("o")
  lighthouse = $lighthouseVersion
  node = (node --version).Trim()
  npm = (npm --version).Trim()
  browser = (Get-Item -LiteralPath $ChromePath).VersionInfo.ProductVersion
  browserPath = $ChromePath
  os = (Get-CimInstance Win32_OperatingSystem).Caption
  processor = (Get-CimInstance Win32_Processor | Select-Object -First 1 -ExpandProperty Name)
  config = $config
  targetResults = $groups
  executions = $scores
}
$summary | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 (Join-Path $ReportDirectory "summary.json")

$markdown = @(
  "# Lighthouse - median results",
  "",
  "Generated: $($summary.generatedAt)",
  "Lighthouse $lighthouseVersion; Node $($summary.node); npm $($summary.npm); Edge $($summary.browser).",
  "Environment: $($summary.os), $($summary.processor). Production build served at $($config.baseUrl), default mock scenario, simulated Lighthouse throttling.",
  "",
  "| Page | Profile | Performance | Accessibility | Best Practices | SEO | LCP (ms) | CLS | TBT (ms) |",
  "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"
)
foreach ($row in $groups) {
  $markdown += "| $($row.page) | $($row.profile) | $($row.performance) | $($row.accessibility) | $($row.'best-practices') | $($row.seo) | $($row.'largest-contentful-paint') | $($row.'cumulative-layout-shift') | $($row.'total-blocking-time') |"
}
$markdown += "", "Individual runs and HTML/JSON artifacts are in this directory. Targets: Performance >= $($config.targets.performance), Accessibility >= $($config.targets.accessibility), Best Practices >= $($config.targets.'best-practices'), SEO >= $($config.targets.seo)."
$markdown += "", "## Findings", "", "- Home mobile CLS is expected to be zero after reserving the hero image aspect ratio; compare the reported median on each run.", "- Detail mobile LCP is constrained by the main artwork request: the image becomes discoverable only after the client fetches NFT data and renders the route. Lighthouse also reports that this LCP resource is not discoverable in the initial HTML. Avoid a global preload without measuring its cost on the home route.", "- Lighthouse reports unused JavaScript in shared and mock-runtime chunks. Route-level splitting or separating the browser mock worker is a follow-up if mobile performance regresses below target."
Set-Content -Encoding utf8 (Join-Path $ReportDirectory "README.md") $markdown
Write-Host "Resumo gravado em $(Join-Path $ReportDirectory 'README.md')"
