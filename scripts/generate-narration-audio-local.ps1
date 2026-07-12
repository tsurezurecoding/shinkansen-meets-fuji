# =========================================================
# AI window guide local audio generator (no external network / Windows PowerShell)
#
# Uses Windows System.Speech and app/live/narration.js speechText/text.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File app\scripts\generate-narration-audio-local.ps1
# =========================================================

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$outDir = Join-Path $repoRoot "app\live\audio"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$node = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if (-not (Test-Path $node)) {
  $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
  if ($nodeCmd) { $node = $nodeCmd.Source }
}
if (-not (Test-Path $node) -and -not (Get-Command $node -ErrorAction SilentlyContinue)) {
  throw "Node.js was not found."
}

$tmpDir = [System.IO.Path]::GetTempPath()
$extractor = Join-Path -Path $tmpDir -ChildPath "mado-extract-local-narration-jobs.cjs"
$jobsFile = Join-Path -Path $tmpDir -ChildPath "mado-local-narration-jobs.json"
Set-Content -LiteralPath $extractor -Encoding UTF8 -Value @'
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const repoRoot = process.argv[2];
const outPath = process.argv[3];
const narrationPath = path.join(repoRoot, "app", "live", "narration.js");
const source = fs.readFileSync(narrationPath, "utf8");
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(source + "\nwindow.__NARRATIONS = NARRATIONS;", ctx, { filename: narrationPath });

const jobs = [];
for (const [id, entry] of Object.entries(ctx.window.__NARRATIONS || {})) {
  for (const dir of ["down", "up"]) {
    const directional = entry[dir];
    if (!directional) continue;
    for (const lang of ["ja", "en"]) {
      const item = directional[lang];
      if (!item || !item.text) continue;
      const rel = item.audio && item.audio !== false
        ? item.audio
        : `audio/${id}_${dir}_${lang}.wav`;
      jobs.push({
        id,
        dir,
        lang,
        rel,
        text: item.speechText || item.text,
      });
    }
  }
}

fs.writeFileSync(outPath, JSON.stringify(jobs), "utf8");
'@

& $node $extractor $repoRoot $jobsFile
if ($LASTEXITCODE -ne 0) { throw "Failed to extract narration jobs." }

$jobsJson = Get-Content -LiteralPath $jobsFile -Raw -Encoding UTF8
$jobs = $jobsJson | ConvertFrom-Json
if (-not $jobs -or $jobs.Count -eq 0) { throw "No narration jobs found." }

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voices = @{
  ja = "Microsoft Haruka Desktop"
  en = "Microsoft Zira Desktop"
}
$format = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo 8000, ([System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen), ([System.Speech.AudioFormat.AudioChannel]::Mono)

Write-Host ("Jobs: {0} files (local WAV, no external network)" -f $jobs.Count)

foreach ($j in $jobs) {
  $rel = [string]$j.rel
  if (-not $rel.ToLowerInvariant().EndsWith(".wav")) {
    $rel = ("audio/{0}_{1}_{2}.wav" -f $j.id, $j.dir, $j.lang)
  }
  $out = Join-Path (Join-Path $repoRoot "app\live") ($rel -replace "/", "\")
  New-Item -ItemType Directory -Force -Path (Split-Path $out -Parent) | Out-Null

  $lang = ([string]$j.lang).Trim()
  $voice = $voices[$lang]
  if ($voice) {
    try {
      $synth.SelectVoice($voice)
    } catch {
      Write-Host ("Voice not selectable, using default: {0}" -f $voice)
    }
  }
  $synth.Rate = -1
  $synth.SetOutputToWaveFile($out, $format)
  Write-Host "Generating $out ..."
  $synth.Speak([string]$j.text)
  $synth.SetOutputToNull()

  if (-not (Test-Path $out) -or (Get-Item $out).Length -lt 1000) {
    throw "Generation failed or output too small: $out"
  }
}

$synth.Dispose()

Write-Host ""
Write-Host "Done. Check app/live/audio/ WAV files."
