# =========================================================
# AI車窓実況 音声生成スクリプト（会長PC用 / Windows PowerShell）
# ※このファイルはUTF-8 BOM付きで保存すること（PowerShell 5.1の誤読防止）
#
# 前提: Python + pip が入っていること。初回のみ:
#   pip install edge-tts
#
# 実行（リポジトリのどこからでも可）:
#   powershell -ExecutionPolicy Bypass -File app\scripts\generate-narration-audio.ps1
#
# 出力: app/live/audio/<spot-id>_<down,up>_{ja,en}.mp3
# 台本の単一ソースは app/live/narration.js。このスクリプトは
# narration.js を読み取り、down/up × ja/en の全台本からmp3を生成する。
# =========================================================

$ErrorActionPreference = "Stop"

# Python検出（py ランチャー優先）と edge-tts の自動インストール
$py = $null
foreach ($cand in @("py", "python", "python3")) {
  if (Get-Command $cand -ErrorAction SilentlyContinue) { $py = $cand; break }
}
if (-not $py) { throw "Pythonが見つかりません。https://www.python.org/ からインストールしてください。" }

$ErrorActionPreference = "Continue"
& $py -m edge_tts --help *> $null
$ErrorActionPreference = "Stop"
if ($LASTEXITCODE -ne 0) {
  Write-Host "edge-tts をインストールします..."
  & $py -m pip install edge-tts
  if ($LASTEXITCODE -ne 0) { throw "edge-tts のインストールに失敗しました。" }
}

$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$outDir = Join-Path $repoRoot "app\live\audio"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$node = $null
$nodeCandidates = @(
  "node",
  (Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe")
)
foreach ($cand in $nodeCandidates) {
  if (Get-Command $cand -ErrorAction SilentlyContinue) { $node = $cand; break }
  if (Test-Path $cand) { $node = $cand; break }
}
if (-not $node) {
  throw "Node.jsが見つかりません。Codex同梱Node、または通常のNode.jsを使える状態にしてください。"
}

$extractor = Join-Path ([System.IO.Path]::GetTempPath()) "mado-extract-narration-jobs.cjs"
$jobsFile = Join-Path ([System.IO.Path]::GetTempPath()) "mado-narration-jobs.json"
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

const voices = {
  ja: "ja-JP-NanamiNeural",
  en: "en-US-JennyNeural",
};

const jobs = [];
for (const [id, entry] of Object.entries(ctx.window.__NARRATIONS || {})) {
  for (const dir of ["down", "up"]) {
    const directional = entry[dir];
    if (!directional) continue;
    for (const lang of ["ja", "en"]) {
      const item = directional[lang];
      if (!item || !item.text) continue;
      jobs.push({
        id,
        dir,
        lang,
        voice: voices[lang],
        text: item.speechText || item.text,
      });
    }
  }
}

fs.writeFileSync(outPath, JSON.stringify(jobs), "utf8");
'@

& $node $extractor $repoRoot $jobsFile
if ($LASTEXITCODE -ne 0) { throw "narration.js から生成ジョブを抽出できませんでした。" }
$jobsJson = Get-Content -LiteralPath $jobsFile -Raw -Encoding UTF8
$jobs = $jobsJson | ConvertFrom-Json
if (-not $jobs -or $jobs.Count -eq 0) { throw "生成対象のナレーションがありません。" }

Write-Host ("生成対象: {0} ファイル" -f $jobs.Count)

foreach ($j in $jobs) {
  $out = Join-Path $outDir ("{0}_{1}_{2}.mp3" -f $j.id, $j.dir, $j.lang)
  Write-Host "Generating $out ..."
  & $py -m edge_tts --voice $j.voice --rate="-5%" --text $j.text --write-media $out
  if (-not (Test-Path $out) -or (Get-Item $out).Length -lt 1000) {
    throw "生成失敗または出力が小さすぎます: $out"
  }
}

Write-Host ""
Write-Host "完了。app/live/audio/ を確認してください。"
Write-Host "ブラウザで app/live/index.html のデモ走行（東京→新大阪 / 新大阪→東京）を開始し、代表スポットの約90秒前に方向別実況が再生されれば成功です。"
