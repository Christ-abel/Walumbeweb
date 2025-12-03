# run-frontend.ps1 - Start a simple static server for the frontend
# Usage: .\run-frontend.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

# Find python
if (Get-Command python -ErrorAction SilentlyContinue) { $python = "python" }
elseif (Get-Command python3 -ErrorAction SilentlyContinue) { $python = "python3" }
else { Write-Error "Python not found. Install Python or run from a machine with Python installed."; exit 1 }

Write-Host "Starting static server from: $root on http://localhost:5500"
Set-Location $root
& $python -m http.server 5500 --bind 127.0.0.1
