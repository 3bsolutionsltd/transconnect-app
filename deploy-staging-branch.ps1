$ErrorActionPreference = 'Stop'
$repo = 'C:\Users\DELL\transconnect-staging-verify'
$target = 'C:\opt\transconnect\app'
if (-not (Test-Path $target)) { New-Item -ItemType Directory -Path $target -Force | Out-Null }
if (Test-Path "$target/.git") {
  Push-Location $target
  git fetch origin --tags --force
  git checkout staging
  git reset --hard origin/staging
  Pop-Location
} else {
  git clone https://github.com/3bsolutionsltd/transconnect-app.git $target
  Push-Location $target
  git checkout staging
  git pull origin staging
  Pop-Location
}
Push-Location $repo
$commit = git rev-parse HEAD
Pop-Location
Push-Location $target
git fetch origin staging
git checkout $commit
git reset --hard $commit
Pop-Location
Write-Host "Deploying commit $commit"
