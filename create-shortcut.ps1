$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
if ([string]::IsNullOrEmpty($PSScriptRoot)) {
    $PSScriptRoot = Get-Location
}
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$PSScriptRoot\Shadow Player.lnk")
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = """$PSScriptRoot\ShadowPlayer.vbs"""
$Shortcut.WorkingDirectory = "$PSScriptRoot"
$Shortcut.Description = "Shadow Player // System Online"
$Shortcut.IconLocation = "$PSScriptRoot\public\icon.ico"
$Shortcut.Save()
Write-Host "Shortcut created in project root: $PSScriptRoot\Shadow Player.lnk"
