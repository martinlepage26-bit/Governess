$appRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Governess Agatha.lnk"
$targetPath = Join-Path $env:WINDIR "System32\wscript.exe"
$arguments = '"' + (Join-Path $appRoot "launch_governess_agatha.vbs") + '"'
$iconPath = Join-Path $appRoot "assets\governess_agatha_icon.ico"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetPath
$shortcut.Arguments = $arguments
$shortcut.WorkingDirectory = $appRoot
$shortcut.IconLocation = "$iconPath,0"
$shortcut.Description = "Governess Agatha paper builder desktop app"
$shortcut.Save()
