#!/bin/bash

# Script to add getPrisma() to all IPC handlers

files=("electron/ipc/projects.ts" "electron/ipc/developers.ts" "electron/ipc/issues.ts" "electron/ipc/analytics.ts")

for file in "${files[@]}"; do
  echo "Processing $file..."
  
  # Add getPrisma() call after each ipcMain.handle line
  sed -i '' -E '/ipcMain\.handle\(/a\
\        const prisma = getPrisma();
' "$file"
  
  echo "✅ Updated $file"
done

echo "🎉 All files processed!"
