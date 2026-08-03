param(
  [Parameter(Mandatory = $true)]
  [string]$AdminToken,

  [Parameter(Mandatory = $true)]
  [string]$TargetAgentId,

  [Parameter(Mandatory = $false)]
  [string]$ApiBaseUrl = "https://api.transconnect.app/api",

  [Parameter(Mandatory = $false)]
  [string]$ValidReferralCode,

  [switch]$ApplyValidAssignment,
  [switch]$ReplaceExisting
)

$ErrorActionPreference = "Stop"

function Write-Step($message) {
  Write-Host "\n==> $message" -ForegroundColor Cyan
}

function Invoke-Api {
  param(
    [Parameter(Mandatory = $true)][ValidateSet('GET','POST','PUT','DELETE')] [string]$Method,
    [Parameter(Mandatory = $true)] [string]$Path,
    [Parameter(Mandatory = $false)] $Body
  )

  $headers = @{
    Authorization = "Bearer $AdminToken"
    "Content-Type" = "application/json"
  }

  $uri = "$ApiBaseUrl$Path"

  try {
    if ($null -ne $Body) {
      $payload = ($Body | ConvertTo-Json -Depth 8)
      return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -Body $payload
    }

    return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
  }
  catch {
    $response = $_.Exception.Response
    if ($null -ne $response) {
      $status = [int]$response.StatusCode
      $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
      $errorBody = $reader.ReadToEnd()
      return @{ __error = $true; status = $status; body = $errorBody }
    }

    return @{ __error = $true; status = -1; body = $_.Exception.Message }
  }
}

Write-Host "Agent Referral Admin Smoke Test" -ForegroundColor Green
Write-Host "API: $ApiBaseUrl"
Write-Host "Target Agent ID: $TargetAgentId"
Write-Host "Mode: $([string]::Join(', ', @(
  'non-destructive checks',
  $(if ($ApplyValidAssignment) { 'valid assignment enabled' } else { 'valid assignment skipped' })
)))"

Write-Step "Check admin access and list endpoint"
$listResult = Invoke-Api -Method GET -Path "/agents/admin/all"
if ($listResult.__error) {
  Write-Host "FAIL: /agents/admin/all not accessible" -ForegroundColor Red
  Write-Host "Status: $($listResult.status)"
  Write-Host "Body: $($listResult.body)"
  exit 1
}
Write-Host "PASS: /agents/admin/all accessible"

Write-Step "Negative test: missing referralCode should return 400"
$missingCodeResult = Invoke-Api -Method PUT -Path "/agents/admin/$TargetAgentId/referral" -Body @{
  replaceExisting = $true
}
if (-not $missingCodeResult.__error -or $missingCodeResult.status -ne 400) {
  Write-Host "FAIL: expected 400 for missing referralCode" -ForegroundColor Red
  if ($missingCodeResult.__error) {
    Write-Host "Status: $($missingCodeResult.status)"
    Write-Host "Body: $($missingCodeResult.body)"
  } else {
    Write-Host "Received success response unexpectedly"
  }
  exit 1
}
Write-Host "PASS: missing referralCode validation works"

Write-Step "Negative test: invalid referralCode should return 400"
$invalidCodeResult = Invoke-Api -Method PUT -Path "/agents/admin/$TargetAgentId/referral" -Body @{
  referralCode = "INVALID-CODE-XYZ"
  replaceExisting = $true
}
if (-not $invalidCodeResult.__error -or $invalidCodeResult.status -ne 400) {
  Write-Host "FAIL: expected 400 for invalid referralCode" -ForegroundColor Red
  if ($invalidCodeResult.__error) {
    Write-Host "Status: $($invalidCodeResult.status)"
    Write-Host "Body: $($invalidCodeResult.body)"
  } else {
    Write-Host "Received success response unexpectedly"
  }
  exit 1
}
Write-Host "PASS: invalid referralCode validation works"

if ($ApplyValidAssignment) {
  if ([string]::IsNullOrWhiteSpace($ValidReferralCode)) {
    Write-Host "FAIL: -ApplyValidAssignment requires -ValidReferralCode" -ForegroundColor Red
    exit 1
  }

  Write-Step "Positive test: apply valid referrer assignment"
  $positiveResult = Invoke-Api -Method PUT -Path "/agents/admin/$TargetAgentId/referral" -Body @{
    referralCode = $ValidReferralCode.Trim().ToUpperInvariant()
    replaceExisting = [bool]$ReplaceExisting
  }

  if ($positiveResult.__error) {
    Write-Host "FAIL: valid assignment did not succeed" -ForegroundColor Red
    Write-Host "Status: $($positiveResult.status)"
    Write-Host "Body: $($positiveResult.body)"
    exit 1
  }

  Write-Host "PASS: valid assignment succeeded" -ForegroundColor Green
  if ($positiveResult.agent) {
    Write-Host "Updated Agent: $($positiveResult.agent.name)"
  }
}
else {
  Write-Step "Positive assignment skipped (non-destructive mode)"
  Write-Host "Tip: Add -ApplyValidAssignment -ValidReferralCode <CODE> to run end-to-end success test."
}

Write-Host "\nAll selected smoke checks completed successfully." -ForegroundColor Green
exit 0
