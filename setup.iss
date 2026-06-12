; Ollama Hub & Control Center - Inno Setup Installer
; To compile: iscc setup.iss  (requires Inno Setup)
; Download from: https://jrsoftware.org/isdl.php

#define MyAppName "Ollama Hub & Control Center"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "FIXIT.Ai"
#define MyAppURL "http://localhost:3000"
#define MyAppExeName "ollama-hub-win.exe"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=.\installer
OutputBaseFilename=OllamaHub-Setup-{#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
DisableProgramGroupPage=yes
CloseApplications=no
MinVersion=10.0.17763
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional icons:"; Flags: checkedonce

[Files]
; Standalone executable (includes Node.js runtime + app)
; This is the PRIMARY deployment method - no dependencies needed
Source: "release\ollama-hub-win.exe"; DestDir: "{app}"; DestName: "ollama-hub.exe"; Flags: ignoreversion; Check: FileExists(ExpandConstant('{src}\release\ollama-hub-win.exe'))

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\ollama-hub.exe"; WorkingDir: "{app}"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\ollama-hub.exe"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\ollama-hub.exe"; Description: "Launch {#MyAppName}"; Flags: postinstall nowait skipifsilent shellexec; WorkingDir: "{app}"

[Code]
function InitializeSetup: Boolean;
begin
  Result := True;
end;
