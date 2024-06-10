#!/usr/bin/env pwsh
<#
    .SYNOPSIS
    Pushes ruleset to registry.

    .DESCRIPTION
    The `push.ps1` script pushes the falco ruleset to the primary registry server of the target environment.

    .PARAMETER Environment
    The target environment. May be `production` or `development`.

    .PARAMETER Version
    The version number for this falco ruleset. Must be a valid SemVer.
#>
#Requires -Version 7
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('production', 'development')]
    [string]
    $Environment
)

#Requires -Version 7
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Path $PSScriptRoot -Parent
Push-Location -Path $projectRoot
try {
    . (Join-Path -Path $projectRoot -ChildPath '.azure-pipelines' -AdditionalChildPath 'utilities.ps1')

    # Deploy storage service
    Show-LogSection -Content 'Deploying storage service...'
    if ($Environment -eq 'development') {
        Show-LogCommand -Content 'npm deploy-dev'
        & npm deploy-dev
        Assert-LastExitCodeSuccess -LastExecutableName 'npm'
    }
    else {
        Show-LogCommand -Content 'npm deploy-prod'
        & npm deploy-prod
        Assert-LastExitCodeSuccess -LastExecutableName 'npm'
    }
}
catch {
    if (($null -ne $_.ErrorDetails) -and (-not [string]::IsNullOrWhiteSpace($_.ErrorDetails.Message))) {
        Show-LogError -Content $_.ErrorDetails.Message
    }
    elseif (($null -ne $_.Exception) -and (-not [string]::IsNullOrWhiteSpace($_.Exception.Message))) {
        Show-LogError -Content $_.Exception.Message
    }
    else {
        Show-LogError -Content $_
    }

    exit 1
}
finally {
    Pop-Location
}
