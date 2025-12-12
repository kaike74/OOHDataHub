$content = Get-Content 'frontend/app/login/page.tsx' -Raw
$content = $content -replace '(\d+)%', '$1'
$content = $content -replace 'strokeWidth="2"', 'strokeWidth="0.15"'
$content = $content -replace 'strokeWidth="3"', 'strokeWidth="0.2"'
$content = $content -replace 'strokeWidth="1\.5"', 'strokeWidth="0.1"'
Set-Content 'frontend/app/login/page.tsx' -Value $content
