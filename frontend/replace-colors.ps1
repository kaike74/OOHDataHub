# Plura Color Replacement Script
# This script replaces all emidias-* color references with plura-* equivalents

$componentsPath = "C:\Users\Samsung\Downloads\OOHDataHub\frontend\components"
$appPath = "C:\Users\Samsung\Downloads\OOHDataHub\frontend\app"

# Color mappings
$replacements = @{
    'emidias-primary' = 'plura-primary'
    'emidias-primary-light' = 'plura-primary-light'
    'emidias-primary-dark' = 'plura-primary-dark'
    'emidias-accent' = 'plura-accent'
    'emidias-accent-light' = 'plura-accent-light'
    'emidias-accent-dark' = 'plura-accent-dark'
    'emidias-gray' = 'plura-gray'
    'emidias-success' = 'plura-success'
    'emidias-success-light' = 'plura-success-light'
    'emidias-success-dark' = 'plura-success-dark'
    'emidias-warning' = 'plura-warning'
    'emidias-warning-light' = 'plura-warning-light'
    'emidias-danger' = 'plura-danger'
    'emidias-danger-light' = 'plura-danger-light'
    'emidias-info' = 'plura-info'
    'emidias-info-light' = 'plura-info-light'
    'emidias-white' = 'plura-white'
    'emidias-dark' = 'plura-dark'
    'emidias-bg' = 'plura-bg'
    'shadow-emidias' = 'shadow-plura'
}

$fileCount = 0
$replacementCount = 0

# Function to process files
function Process-Files {
    param($path)
    
    Get-ChildItem -Path $path -Recurse -Include *.tsx,*.ts,*.jsx,*.js,*.css | ForEach-Object {
        $file = $_
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        $fileChanged = $false
        
        foreach ($old in $replacements.Keys) {
            $new = $replacements[$old]
            if ($content -match $old) {
                $content = $content -replace $old, $new
                $fileChanged = $true
            }
        }
        
        if ($fileChanged) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            $fileCount++
            Write-Host "✓ Updated: $($file.Name)" -ForegroundColor Green
        }
    }
}

Write-Host "🎨 Starting Plura Color Replacement..." -ForegroundColor Cyan
Write-Host ""

# Process components
Write-Host "Processing components..." -ForegroundColor Yellow
Process-Files $componentsPath

# Process app
Write-Host "Processing app..." -ForegroundColor Yellow
Process-Files $appPath

Write-Host ""
Write-Host "✅ Complete! Updated $fileCount files" -ForegroundColor Green
Write-Host "🎨 All emidias-* colors replaced with plura-* equivalents" -ForegroundColor Cyan
