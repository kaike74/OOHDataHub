# Mass Color Replacement Script
# Replaces ALL remaining emidias-* with plura-*

$frontendPath = "C:\Users\Samsung\Downloads\OOHDataHub\frontend"

# Color mappings
$replacements = @{
    'emidias-primary'       = 'plura-primary'
    'emidias-primary-light' = 'plura-primary-light'
    'emidias-primary-dark'  = 'plura-primary-dark'
    'emidias-accent'        = 'plura-accent'
    'emidias-accent-light'  = 'plura-accent-light'
    'emidias-accent-dark'   = 'plura-accent-dark'
    'emidias-gray'          = 'plura-gray'
    'emidias-success'       = 'plura-success'
    'emidias-danger'        = 'plura-danger'
    'emidias-warning'       = 'plura-warning'
    'emidias-info'          = 'plura-info'
    'shadow-emidias'        = 'shadow-plura'
}

$fileCount = 0
$totalReplacements = 0

Write-Host "🎨 Starting Mass Color Replacement..." -ForegroundColor Cyan
Write-Host ""

# Process all TypeScript/JavaScript/CSS files
Get-ChildItem -Path $frontendPath -Recurse -Include *.tsx, *.ts, *.jsx, *.js, *.css | ForEach-Object {
    $file = $_
    $content = Get-Content $file.FullName -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
    
    if ($null -eq $content) { return }
    
    $originalContent = $content
    $fileChanged = $false
    $fileReplacements = 0
    
    foreach ($old in $replacements.Keys) {
        $new = $replacements[$old]
        $matches = ([regex]::Matches($content, $old)).Count
        
        if ($matches -gt 0) {
            $content = $content -replace $old, $new
            $fileChanged = $true
            $fileReplacements += $matches
        }
    }
    
    if ($fileChanged) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $fileCount++
        $totalReplacements += $fileReplacements
        Write-Host "✓ $($file.Name): $fileReplacements replacements" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ Complete!" -ForegroundColor Green
Write-Host "   Files updated: $fileCount" -ForegroundColor Cyan
Write-Host "   Total replacements: $totalReplacements" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎨 All emidias-* colors replaced with plura-*" -ForegroundColor Green
