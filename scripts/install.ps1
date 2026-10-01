# Greek Flashcards Installer
# Installs to %LocalAppData%\GreekFlashcards — no admin required.

$AppName    = "Greek Flashcards"
$AppVersion = "1.0.0"
$Publisher  = "Greek Flashcards"
$InstallDir = "$env:LocalAppData\GreekFlashcards"
$ExePath    = "$InstallDir\Greek Flashcards.exe"

Write-Host ""
Write-Host "  Greek Flashcards Installer" -ForegroundColor Cyan
Write-Host "  ===========================" -ForegroundColor Cyan
Write-Host ""

# Create / replace install directory
if (Test-Path $InstallDir) {
    Write-Host "  Removing previous installation..." -ForegroundColor Yellow
    Remove-Item $InstallDir -Recurse -Force
}
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null

# Copy app files
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppSource  = Join-Path $ScriptDir "app"
Write-Host "  Copying files to $InstallDir..." -ForegroundColor White
Copy-Item "$AppSource\*" $InstallDir -Recurse -Force
Write-Host "  Files installed." -ForegroundColor Green

# Desktop shortcut
$WS       = New-Object -ComObject WScript.Shell
$Desktop  = [System.Environment]::GetFolderPath("Desktop")
$SC1      = $WS.CreateShortcut("$Desktop\$AppName.lnk")
$SC1.TargetPath       = $ExePath
$SC1.WorkingDirectory = $InstallDir
$SC1.Description      = "Greek vocabulary flashcard app"
$SC1.Save()
Write-Host "  Desktop shortcut created." -ForegroundColor Green

# Start Menu shortcut
$StartMenu = "$env:AppData\Microsoft\Windows\Start Menu\Programs"
$SC2       = $WS.CreateShortcut("$StartMenu\$AppName.lnk")
$SC2.TargetPath       = $ExePath
$SC2.WorkingDirectory = $InstallDir
$SC2.Description      = "Greek vocabulary flashcard app"
$SC2.Save()
Write-Host "  Start Menu shortcut created." -ForegroundColor Green

# Write uninstaller
$Uninstaller = @"
Remove-Item "$env:LocalAppData\GreekFlashcards" -Recurse -Force -ErrorAction SilentlyContinue
`$Desktop = [System.Environment]::GetFolderPath("Desktop")
Remove-Item "`$Desktop\Greek Flashcards.lnk" -Force -ErrorAction SilentlyContinue
Remove-Item "$env:AppData\Microsoft\Windows\Start Menu\Programs\Greek Flashcards.lnk" -Force -ErrorAction SilentlyContinue
Remove-Item "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\GreekFlashcards" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Greek Flashcards has been uninstalled." -ForegroundColor Green
"@
$Uninstaller | Out-File "$InstallDir\uninstall.ps1" -Encoding UTF8

# Uninstall .bat wrapper (so it shows up properly in Add/Remove Programs)
$UninstallBat = "@echo off`r`npowershell -ExecutionPolicy Bypass -File `"$InstallDir\uninstall.ps1`"`r`npause"
$UninstallBat | Out-File "$InstallDir\Uninstall Greek Flashcards.bat" -Encoding ASCII

# Register in Add/Remove Programs (HKCU — no admin needed)
$RegPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\GreekFlashcards"
New-Item -Path $RegPath -Force | Out-Null
Set-ItemProperty -Path $RegPath -Name "DisplayName"     -Value $AppName
Set-ItemProperty -Path $RegPath -Name "DisplayVersion"  -Value $AppVersion
Set-ItemProperty -Path $RegPath -Name "Publisher"       -Value $Publisher
Set-ItemProperty -Path $RegPath -Name "InstallLocation" -Value $InstallDir
Set-ItemProperty -Path $RegPath -Name "UninstallString" -Value "$InstallDir\Uninstall Greek Flashcards.bat"
Set-ItemProperty -Path $RegPath -Name "NoModify"        -Value 1 -Type DWord
Set-ItemProperty -Path $RegPath -Name "NoRepair"        -Value 1 -Type DWord
Write-Host "  Registered in Add/Remove Programs." -ForegroundColor Green

Write-Host ""
Write-Host "  Installation complete!" -ForegroundColor Cyan
Write-Host "  Launch Greek Flashcards from your Desktop or Start Menu." -ForegroundColor Cyan
Write-Host ""
