#!/usr/bin/env pwsh
<#
    .SYNOPSIS
    Pushes ruleset to registry.

    .DESCRIPTION
    The `test.ps1` script tests deployment of the storage service.
#>
#Requires -Version 7
[CmdletBinding()]
param()

#Requires -Version 7
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Path $PSScriptRoot -Parent
. (Join-Path -Path $projectRoot -ChildPath '.azure-pipelines' -AdditionalChildPath 'utilities.ps1')

function Initialize {
    param ()

    process {
        # Verify Node.js and npm
        Show-LogSection -Content 'Verifying Node.js and npm...'

        $nodeVersion = Get-NodeVersion
        if ($null -eq $nodeVersion) {
            Write-Error -Message 'Node.js is not installed'
        }

        $nvmrcVersion = Get-NvmrcVersion
        if ($null -eq $nvmrcVersion -or 0 -ne (Compare-NodeVersion -FirstVersion $nodeVersion -SecondVersion $nvmrcVersion)) {
            Write-Error -Message "Node.js ${nvmrcVersion} is not installed (found ${nodeVersion})"
        }

        Show-LogInfo -Content "Node.js ${nodeVersion} is installed"

        $npmVersion = Get-NpmVersion
        if ($null -eq $npmVersion) {
            Write-Error -Message 'npm is not installed'
        }

        Show-LogInfo -Content "npm ${npmVersion} is installed"

        # Install packages
        Show-LogSection -Content 'Installing packages...'

        Show-LogCommand -Content 'npm install'
        & npm install
        Assert-LastExitCodeSuccess -LastExecutableName 'npm'

        # Set up .dev.vars
        Show-LogSection -Content 'Setting up .dev.vars...'
        $varsFile = Join-Path -Path $projectRoot -ChildPath '.dev.vars'
        "SALAD_PASSWORD=${Env:CLOUDFLARE_STORAGE_PASSWORD}" | Out-File -FilePath $varsFile
        "TEST_API_KEY=${Env:DEV_KEY}" | Out-File -FilePath $varsFile -Append
        'TEST_ORG=azure-devops' | Out-File -FilePath $varsFile -Append
        'TEST_ORG_ID=e701ed8d-ac98-4703-82e9-2f70e5a17233' | Out-File -FilePath $varsFile -Append
        Get-Content -Path $varsFile
    }
}

function Test {
    param()

    process {
        # Execute tests
        Show-LogSection -Content 'Executing tests...'
        Show-LogCommand -Content 'npm test'
        & npm test
        Assert-LastExitCodeSuccess -LastExecutableName 'npm'
    }
}

Push-Location -Path $projectRoot
try {
    Initialize
    Test
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
