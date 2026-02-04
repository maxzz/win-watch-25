[CmdletBinding()]
param(
  [string]$Subject = 'CN=WinWatch Dev Code Signing',
  [string]$OutputDir = (Get-Location).Path,
  [int]$ValidYears = 3,
  [switch]$Force,
  [string]$PfxPasswordPlain
)

$ErrorActionPreference = 'Stop'

function Assert-Admin {
  $currentIdentity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($currentIdentity)
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'This script must be run as Administrator (needs LocalMachine certificate stores).'
  }
}

function Ensure-Directory([string]$Dir) {
  if (-not (Test-Path -LiteralPath $Dir)) {
    New-Item -ItemType Directory -Path $Dir | Out-Null
  }
}

function Get-ExistingCert([string]$Subj) {
  $storePath = 'Cert:\LocalMachine\My'
  Get-ChildItem -Path $storePath |
    Where-Object {
      $_.Subject -eq $Subj -and
      ($_.EnhancedKeyUsageList | Where-Object { $_.FriendlyName -eq 'Code Signing' })
    } |
    Sort-Object NotAfter -Descending |
    Select-Object -First 1
}

function Prompt-PfxPassword {
  if ($PfxPasswordPlain) {
    return (ConvertTo-SecureString -String $PfxPasswordPlain -AsPlainText -Force)
  }
  return (Read-Host -AsSecureString 'PFX password (will be used to export .pfx)')
}

Assert-Admin
Ensure-Directory -Dir $OutputDir

$pfxPath = Join-Path $OutputDir 'winwatch-dev-codesign.pfx'
$cerPath = Join-Path $OutputDir 'winwatch-dev-codesign.cer'

if (-not $Force) {
  if ((Test-Path -LiteralPath $pfxPath) -or (Test-Path -LiteralPath $cerPath)) {
    Write-Host "Output files already exist:" -ForegroundColor Yellow
    if (Test-Path -LiteralPath $pfxPath) { Write-Host "  $pfxPath" -ForegroundColor Yellow }
    if (Test-Path -LiteralPath $cerPath) { Write-Host "  $cerPath" -ForegroundColor Yellow }
    Write-Host 'Re-run with -Force to overwrite.' -ForegroundColor Yellow
    exit 1
  }
}

$cert = Get-ExistingCert -Subj $Subject
if (-not $cert) {
  Write-Host "Creating self-signed code signing cert: $Subject" -ForegroundColor Cyan
  $cert = New-SelfSignedCertificate `
    -Subject $Subject `
    -Type CodeSigningCert `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -HashAlgorithm SHA256 `
    -KeyExportPolicy Exportable `
    -CertStoreLocation 'Cert:\LocalMachine\My' `
    -NotAfter (Get-Date).AddYears($ValidYears)
} else {
  Write-Host "Using existing cert: $($cert.Thumbprint) ($($cert.NotAfter))" -ForegroundColor Cyan
}

if ($Force) {
  if (Test-Path -LiteralPath $pfxPath) { Remove-Item -LiteralPath $pfxPath -Force }
  if (Test-Path -LiteralPath $cerPath) { Remove-Item -LiteralPath $cerPath -Force }
}

$pfxPassword = Prompt-PfxPassword

Write-Host "Exporting PFX: $pfxPath" -ForegroundColor Cyan
Export-PfxCertificate -Cert ("Cert:\LocalMachine\My\" + $cert.Thumbprint) -FilePath $pfxPath -Password $pfxPassword | Out-Null

Write-Host "Exporting CER: $cerPath" -ForegroundColor Cyan
Export-Certificate -Cert ("Cert:\LocalMachine\My\" + $cert.Thumbprint) -FilePath $cerPath | Out-Null

Write-Host 'Trusting certificate (LocalMachine\Root and LocalMachine\TrustedPublisher)...' -ForegroundColor Cyan
Import-Certificate -FilePath $cerPath -CertStoreLocation 'Cert:\LocalMachine\Root' | Out-Null
Import-Certificate -FilePath $cerPath -CertStoreLocation 'Cert:\LocalMachine\TrustedPublisher' | Out-Null

Write-Host ''
Write-Host 'Done.' -ForegroundColor Green
Write-Host "Thumbprint: $($cert.Thumbprint)"
Write-Host "PFX: $pfxPath"
Write-Host "CER: $cerPath"
Write-Host ''
Write-Host 'Set these env vars before building (CMD.exe):' -ForegroundColor Cyan
Write-Host "  set WINWATCH_PFX=$pfxPath"
Write-Host '  set WINWATCH_PFX_PASSWORD=<YOUR_PFX_PASSWORD>'
Write-Host '  rem optional: set WINWATCH_TIMESTAMP_URL=https://timestamp.digicert.com'
Write-Host ''
Write-Host 'Set these env vars before building (PowerShell):' -ForegroundColor Cyan
Write-Host "  $env:WINWATCH_PFX=\"$pfxPath\""
Write-Host '  $env:WINWATCH_PFX_PASSWORD="<YOUR_PFX_PASSWORD>"'
Write-Host '  # optional: $env:WINWATCH_TIMESTAMP_URL="https://timestamp.digicert.com"'
Write-Host ''
Write-Host 'Then run:' -ForegroundColor Cyan
Write-Host '  pnpm run build:exe:win'
