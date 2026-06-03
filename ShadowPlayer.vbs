' ============================================================
'  Shadow Player // System Online  — Silent Desktop Launcher
'  Runs the app with NO console window, NO flash, NO prompts.
'  Double-click this file (or the desktop shortcut) to launch.
' ============================================================

Option Explicit

Dim objShell, fso, scriptPath, strDir

Set objShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the parent directory of this script dynamically
scriptPath = WScript.ScriptFullName
strDir = fso.GetParentFolderName(scriptPath)

' CurrentDirectory must be set before Run
objShell.CurrentDirectory = strDir

' Window style 0 = SW_HIDE (completely invisible, no CMD flash)
' bWaitOnReturn = False so this script exits immediately
objShell.Run "pythonw run_pywebview.py", 0, False

Set objShell = Nothing
Set fso = Nothing
