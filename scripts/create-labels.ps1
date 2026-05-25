<#
.SYNOPSIS
    Create the GitHub labels referenced by .github/labeler.yml and
    .github/workflows/pr-labeler.yml on the rabbitglauser/gibz-raumvermietung repo.

.DESCRIPTION
    Idempotent — labels that already exist are skipped (GitHub returns 422
    "already_exists" which we swallow).

.PARAMETER Repo
    GitHub owner/repo. Defaults to rabbitglauser/gibz-raumvermietung.

.EXAMPLE
    $env:GH_TOKEN = 'ghp_yourPATwithRepoScope'
    pwsh ./scripts/create-labels.ps1

.NOTES
    Token needs `repo` scope (or fine-grained: Issues = Read and write).
#>
param(
    [string]$Repo = 'rabbitglauser/gibz-raumvermietung'
)

if (-not $env:GH_TOKEN) {
    Write-Error 'Set $env:GH_TOKEN to a GitHub PAT with `repo` (or Issues:write) scope before running.'
    exit 1
}

$labels = @(
    # Layer — green
    @{ name = 'backend';            color = '0e8a16'; description = 'Touches backend/' },
    @{ name = 'frontend';           color = '0e8a16'; description = 'Touches frontend/' },

    # Doc / infra — light teal
    @{ name = 'documentation';      color = 'bfdadc'; description = 'Docs or markdown only' },
    @{ name = 'infrastructure';     color = 'bfdadc'; description = 'CI, Docker, deploy config' },
    @{ name = 'authentication';     color = 'bfdadc'; description = 'Auth-related code' },
    @{ name = 'database design';    color = 'bfdadc'; description = 'DB schema / models' },
    @{ name = 'ci/cd';              color = 'bfdadc'; description = 'GitHub Actions / pipelines' },

    # Area — yellow
    @{ name = 'area:reservations';  color = 'fbca04'; description = 'Reservation routes / domain' },
    @{ name = 'area:tests';         color = 'fbca04'; description = 'Backend tests' },
    @{ name = 'area:ui';            color = 'fbca04'; description = 'React components' },
    @{ name = 'area:pages';         color = 'fbca04'; description = 'Next.js app routes' },
    @{ name = 'area:database';      color = 'fbca04'; description = 'database/ folder' },

    # Size — gray
    @{ name = 'size:XS';            color = 'cccccc'; description = '<= 10 lines changed' },
    @{ name = 'size:S';             color = 'cccccc'; description = '11-50 lines changed' },
    @{ name = 'size:M';             color = 'cccccc'; description = '51-200 lines changed' },
    @{ name = 'size:L';             color = 'cccccc'; description = '201-500 lines changed' },
    @{ name = 'size:XL';            color = 'cccccc'; description = '500+ lines changed' }
)

$headers = @{
    Authorization          = "Bearer $($env:GH_TOKEN)"
    Accept                 = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
}
$url = "https://api.github.com/repos/$Repo/labels"

$created = 0
$skipped = 0
$failed  = 0

foreach ($label in $labels) {
    $body = $label | ConvertTo-Json -Compress
    try {
        Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body -ContentType 'application/json' | Out-Null
        Write-Host "  created  $($label.name)" -ForegroundColor Green
        $created++
    }
    catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($status -eq 422) {
            Write-Host "  exists   $($label.name)" -ForegroundColor DarkGray
            $skipped++
        }
        else {
            Write-Host "  FAILED   $($label.name) — HTTP $status — $($_.Exception.Message)" -ForegroundColor Red
            $failed++
        }
    }
}

Write-Host ""
Write-Host "Done. created=$created skipped=$skipped failed=$failed" -ForegroundColor Cyan
if ($failed -gt 0) { exit 1 }
