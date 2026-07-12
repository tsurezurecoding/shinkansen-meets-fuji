@echo off
setlocal
cd /d "%~dp0\..\.."
if not exist ".codex-local\company\reports" mkdir ".codex-local\company\reports"
set LOG=.codex-local\company\reports\narration-mp3-generation.log
echo Writing log to %LOG%
powershell -ExecutionPolicy Bypass -File app\scripts\generate-narration-audio.ps1 > "%LOG%" 2>&1
type "%LOG%"
echo.
echo Done. If generation succeeded, run:
echo   C:\Users\kynr0\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe app\scripts\review-narration.cjs
pause
