# This script packages important project files that are usually gitignored.
# Run it from the project root directory ("Dr. Handyman").
# IMPORTANT: Please stop any running development servers before executing this script to avoid file locking issues.

# List of files and directories to be archived.
# Add or remove items as needed.
$filesToArchive = @(
    ".cursor",
    ".vscode",
    "tasks.json",
    "tasks",
    ".env",
    "ts-pnpm/.env",
    "ts-pnpm/.env.local",
    "ts-pnpm/.vscode",
    "ts-pnpm/.vercel",
    ".taskmasterconfig",
    "README-HOME-SETUP.md"
    # Optional: The 'ts-pnpm/.next' build cache was removed from this list because it often contains files
    # that are locked by the running development server, which causes this script to fail.
    # If you want to include it, stop your dev server first, then add "ts-pnpm/.next" back to this list.
)

$existingFiles = @()
# Check which of the files and directories actually exist before trying to archive them.
foreach ($file in $filesToArchive) {
    if (Test-Path $file) {
        $existingFiles += $file
    } else {
        Write-Host "Info: Skipping '$file' as it does not exist."
    }
}

if ($existingFiles.Count -eq 0) {
    Write-Host "Error: No files to archive were found. Make sure you are running this script from the project root. Exiting."
    exit
}

$archiveName = "project-backup.zip"
# Remove old backup file if it exists
if (Test-Path $archiveName) {
    Remove-Item $archiveName
}

Write-Host "Creating archive: $archiveName"
Write-Host "Archiving the following items:"
$existingFiles | ForEach-Object { Write-Host "- $_" }

try {
    Compress-Archive -Path $existingFiles -DestinationPath $archiveName -Force
    Write-Host ""
    Write-Host "Successfully created '$archiveName' in your project root."
    Write-Host "You can now transfer this single file to your home machine."
    Write-Host ""
    Write-Host "IMPORTANT: This zip file contains sensitive information (like API keys). Make sure to transfer it securely and delete it from your work machine and any intermediate storage (like cloud drives or USBs) once you're done."
} catch {
    Write-Host "An error occurred during archiving: $_"
} 