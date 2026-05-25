<#
.SYNOPSIS
    Fetch the GitHub Projects V2 node IDs for a user/org Project and print a
    ready-to-paste `env:` block for the workflow files.

.DESCRIPTION
    Runs a single GraphQL query against api.github.com to grab:
      - the project's node ID
      - each single-select field's ID (Status, Priority, Size)
      - each option's ID under those fields (Backlog, Todo, P0, XS, etc.)

    Output is printed to stdout — paste it into the `env:` block of:
      .github/workflows/ai-project-manager.yml
      .github/workflows/issue-management.yml
      .github/workflows/pr-automation.yml

.PARAMETER ProjectNumber
    The integer in the Project URL (e.g. github.com/users/you/projects/4 -> 4).

.PARAMETER Owner
    The owner login. Defaults to your authenticated user (`viewer`). Pass the
    org login for org-owned projects.

.PARAMETER IsOrg
    Switch — set when the Project is owned by an org instead of a user.

.EXAMPLE
    $env:GH_TOKEN = 'ghp_yourPATwithProjectsReadWrite'
    pwsh ./scripts/fetch-project-ids.ps1 -ProjectNumber 4

.EXAMPLE
    pwsh ./scripts/fetch-project-ids.ps1 -ProjectNumber 7 -Owner my-org -IsOrg

.NOTES
    Token needs Projects: Read (write not required just to read IDs).
#>
param(
    [Parameter(Mandatory = $true)]
    [int]$ProjectNumber,

    [string]$Owner,

    [switch]$IsOrg
)

if (-not $env:GH_TOKEN) {
    Write-Error 'Set $env:GH_TOKEN to a GitHub PAT with Projects: Read scope.'
    exit 1
}

# Build the GraphQL selector
if ($IsOrg) {
    if (-not $Owner) { Write-Error '-Owner is required when -IsOrg is set.'; exit 1 }
    $selector = "organization(login: ""$Owner"")"
}
elseif ($Owner) {
    $selector = "user(login: ""$Owner"")"
}
else {
    $selector = "viewer"
}

$query = @"
{
  $selector {
    projectV2(number: $ProjectNumber) {
      id
      title
      fields(first: 30) {
        nodes {
          ... on ProjectV2SingleSelectField {
            id
            name
            options { id name }
          }
        }
      }
    }
  }
}
"@

$body = @{ query = $query } | ConvertTo-Json -Compress

$headers = @{
    Authorization = "Bearer $($env:GH_TOKEN)"
    Accept        = 'application/vnd.github+json'
}

try {
    $resp = Invoke-RestMethod -Uri 'https://api.github.com/graphql' -Method Post -Headers $headers -Body $body -ContentType 'application/json'
}
catch {
    Write-Error "Request failed: $($_.Exception.Message)"
    exit 1
}

if ($resp.errors) {
    Write-Error "GraphQL errors:"
    $resp.errors | ForEach-Object { Write-Host "  - $($_.message)" -ForegroundColor Red }
    exit 1
}

$project = $resp.data.PSObject.Properties.Value.projectV2
if (-not $project) {
    Write-Error "Project number $ProjectNumber not found for the given owner."
    exit 1
}

Write-Host "Project: $($project.title)" -ForegroundColor Cyan
Write-Host "Project ID: $($project.id)" -ForegroundColor DarkGray
Write-Host ""

# Helper — look up a field by display name, return $null if missing
function Get-Field($name) {
    return $project.fields.nodes | Where-Object { $_.name -eq $name } | Select-Object -First 1
}
function Get-Option($field, $name) {
    if (-not $field) { return $null }
    return $field.options | Where-Object { $_.name -eq $name } | Select-Object -First 1
}

$status   = Get-Field 'Status'
$priority = Get-Field 'Priority'
$size     = Get-Field 'Size'

if (-not $status)   { Write-Warning "No 'Status' single-select field found on the project." }
if (-not $priority) { Write-Warning "No 'Priority' single-select field found on the project." }
if (-not $size)     { Write-Warning "No 'Size' single-select field found on the project." }

function Val($x) { if ($x) { "'$($x.id)'" } else { "''  # NOT FOUND" } }

Write-Host "---- Paste into ai-project-manager.yml env: ----" -ForegroundColor Yellow
Write-Host @"
env:
  PROJECT_ID: '$($project.id)'
  STATUS_FIELD_ID: $(Val $status)
  PRIORITY_FIELD_ID: $(Val $priority)
  SIZE_FIELD_ID: $(Val $size)
  STATUS_BACKLOG: $(Val (Get-Option $status 'Backlog'))
  STATUS_TODO: $(Val (Get-Option $status 'Todo'))
  STATUS_IN_PROGRESS: $(Val (Get-Option $status 'In Progress'))
  STATUS_TESTING: $(Val (Get-Option $status 'Testing'))
  STATUS_DONE: $(Val (Get-Option $status 'Done'))
  PRIORITY_P0: $(Val (Get-Option $priority 'P0'))
  PRIORITY_P1: $(Val (Get-Option $priority 'P1'))
  PRIORITY_P2: $(Val (Get-Option $priority 'P2'))
  SIZE_XS: $(Val (Get-Option $size 'XS'))
  SIZE_S: $(Val (Get-Option $size 'S'))
  SIZE_M: $(Val (Get-Option $size 'M'))
  SIZE_L: $(Val (Get-Option $size 'L'))
  SIZE_XL: $(Val (Get-Option $size 'XL'))
"@
Write-Host "------------------------------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "Note: issue-management.yml uses a subset (no SIZE_*), and pr-automation.yml uses just PROJECT_ID + STATUS_FIELD_ID + STATUS_*. Copy the relevant subset into each file." -ForegroundColor DarkGray
