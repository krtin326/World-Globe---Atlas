<#
  serve-public.ps1 — put World Globe on the public internet with one command.

  Starts the Flask server (serve.py) and a Cloudflare quick tunnel, then prints
  a public https://<random>.trycloudflare.com address that ANYONE, on ANY
  network, can open. No account, no router setup.

  Run (from this folder):
      powershell -ExecutionPolicy Bypass -File serve-public.ps1

  Stop it with Ctrl+C — that ends the tunnel AND the server. The public link
  only works while this window stays open.

  Notes:
    * The URL is a NEW random one each run (free quick tunnels aren't stable).
      For a fixed custom domain, see PUBLIC_ACCESS.md.
    * Everything served is PUBLIC. The main globe has no login; the /atlas/
      login is client-side only and does not protect the server.
#>

$ErrorActionPreference = "Stop"
$port = if ($env:PORT) { $env:PORT } else { "8080" }
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

# Find cloudflared (winget installs it here; fall back to PATH).
$cf = "${env:ProgramFiles(x86)}\cloudflared\cloudflared.exe"
if (-not (Test-Path $cf)) { $cf = "$env:ProgramFiles\cloudflared\cloudflared.exe" }
if (-not (Test-Path $cf)) {
  $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
  if ($cmd) { $cf = $cmd.Source }
}
if (-not (Test-Path $cf)) {
  Write-Host "cloudflared is not installed. Install it with:" -ForegroundColor Yellow
  Write-Host "    winget install Cloudflare.cloudflared" -ForegroundColor Yellow
  exit 1
}

# Pick python launcher.
$py = if (Get-Command py -ErrorAction SilentlyContinue) { "py" } else { "python" }

Write-Host "Starting the World Globe server on port $port ..." -ForegroundColor Cyan
$env:PORT = $port
$server = Start-Process -FilePath $py -ArgumentList "serve.py" -PassThru -WindowStyle Hidden

try {
  Start-Sleep -Seconds 2
  Write-Host "Opening a public Cloudflare tunnel (Ctrl+C to stop everything)..." -ForegroundColor Cyan
  Write-Host "Watch for the https://<...>.trycloudflare.com line below.`n" -ForegroundColor Cyan
  # Runs in the foreground so you see the URL and it stays alive with the window.
  & $cf tunnel --url "http://localhost:$port" --no-autoupdate
}
finally {
  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
    Write-Host "`nServer stopped." -ForegroundColor Cyan
  }
}
