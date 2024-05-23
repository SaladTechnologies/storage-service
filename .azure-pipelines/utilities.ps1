<#
    .SYNOPSIS
    Provides utility functions for PowerShell scripts running in Azure Pipelines.

    .DESCRIPTION
    The `utilities.ps1` script provides utility functions for PowerShell scripts running in Azure Pipelines. It is not
    intended to be run on its own, but rather to be imported into other scripts.
#>

#Requires -Version 7
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-LastExitCodeSuccess {
    [CmdletBinding()]
    [OutputType([void])]
    param(
        # The first version to compare.
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string]
        $LastExecutableName
    )

    process {
        if (0 -lt $LastExitCode) {
            Write-Error -Message "${LastExecutableName} exited with code ${LastExitCode}"
        }
    }
}

function Test-AzureDevOpsEnvironment {
    [CmdletBinding()]
    [OutputType([bool])]
    param()

    process {
        [string]::Equals($Env:TF_BUILD, 'True', [StringComparison]::OrdinalIgnoreCase)
    }
}

function Show-LogCommand {
    [CmdletBinding()]
    [OutputType([void])]
    param(
        # The content to write.
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string]
        $Content
    )

    process {
        if (Test-AzureDevOpsEnvironment) {
            Write-Host -Object "##[command]${Content}"
        }
        else {
            Write-Host -Object $Content -ForegroundColor Cyan
        }
    }
}

function Show-LogDebug {
    [CmdletBinding()]
    [OutputType([void])]
    param(
        # The content to write.
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string]
        $Content
    )

    process {
        if (Test-AzureDevOpsEnvironment) {
            Write-Host -Object "##[debug]${Content}"
        }
        else {
            Write-Host -Object $Content -ForegroundColor Magenta
        }
    }
}

function Show-LogError {
    [CmdletBinding()]
    [OutputType([void])]
    param(
        # The content to write.
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string]
        $Content
    )

    process {
        if (Test-AzureDevOpsEnvironment) {
            Write-Host -Object "##vso[task.logissue type=error;]${Content}"
        }
        else {
            Write-Host -Object $Content -ForegroundColor Red
        }
    }
}

function Show-LogGroupBegin {
    [CmdletBinding()]
    [OutputType([void])]
    param(
        # The content to write.
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string]
        $Content
    )

    process {
        if (Test-AzureDevOpsEnvironment) {
            Write-Host -Object "##[group]${Content}"
        }
    }
}

function Show-LogGroupEnd {
    [CmdletBinding()]
    [OutputType([void])]
    param()

    process {
        if (Test-AzureDevOpsEnvironment) {
            Write-Host -Object '##[endgroup]'
        }
    }
}

function Show-LogInfo {
    [CmdletBinding()]
    [OutputType([void])]
    param(
        # The content to write.
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string]
        $Content
    )

    process {
        Write-Host -Object $Content
    }
}

function Show-LogSection {
    [CmdletBinding()]
    [OutputType([void])]
    param(
        # The content to write.
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string]
        $Content
    )

    process {
        if (Test-AzureDevOpsEnvironment) {
            Write-Host -Object "##[section]${Content}"
        }
        else {
            Write-Host -Object $Content -ForegroundColor Green
        }
    }
}

function Show-LogWarning {
    [CmdletBinding()]
    [OutputType([void])]
    param(
        # The content to write.
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string]
        $Content
    )

    process {
        if (Test-AzureDevOpsEnvironment) {
            Write-Host -Object "##vso[task.logissue type=warning;]${Content}"
        }
        else {
            Write-Host -Object $Content -ForegroundColor Yellow
        }
    }
}
