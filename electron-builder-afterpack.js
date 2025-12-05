const fs = require('fs');
const path = require('path');

exports.default = async function (context) {
  const appOutDir = context.appOutDir;
  const platform = context.electronPlatformName;

  console.log('📦 Running afterPack hook...');
  console.log(`Platform: ${platform}`);
  console.log(`App output dir: ${appOutDir}`);

  // Paths
  const appName = context.packager.appInfo.productFilename;
  const appPath = platform === 'darwin'
    ? path.join(appOutDir, `${appName}.app`)
    : appOutDir;

  const resourcesPath = platform === 'darwin'
    ? path.join(appPath, 'Contents', 'Resources')
    : path.join(appPath, 'resources');

  // Because asar is disabled in electron-builder config, app files are in 'app' not 'app.asar.unpacked'
  const appResourcePath = path.join(resourcesPath, 'app');
  const nodeModulesPath = path.join(appResourcePath, 'node_modules');

  // Ensure node_modules directory exists
  if (!fs.existsSync(nodeModulesPath)) {
    fs.mkdirSync(nodeModulesPath, { recursive: true });
  }

  // Copy .prisma directory
  const prismaSourcePath = path.join(process.cwd(), 'node_modules', '.prisma');
  const prismaTargetPath = path.join(nodeModulesPath, '.prisma');

  if (fs.existsSync(prismaSourcePath)) {
    console.log(`✅ Found .prisma at: ${prismaSourcePath}`);
    console.log(`📋 Copying to: ${prismaTargetPath}`);
    copyRecursiveSync(prismaSourcePath, prismaTargetPath);
    console.log('✅ .prisma folder copied successfully!');
  } else {
    console.warn(`⚠️  .prisma folder not found at ${prismaSourcePath}`);
  }

  // Copy @prisma/client directory
  const prismaClientSourcePath = path.join(process.cwd(), 'node_modules', '@prisma');
  const prismaClientTargetPath = path.join(nodeModulesPath, '@prisma');

  if (fs.existsSync(prismaClientSourcePath)) {
    console.log(`✅ Found @prisma at: ${prismaClientSourcePath}`);
    console.log(`📋 Copying to: ${prismaClientTargetPath}`);
    copyRecursiveSync(prismaClientSourcePath, prismaClientTargetPath);
    console.log('✅ @prisma folder copied successfully!');
  } else {
    console.warn(`⚠️  @prisma folder not found at ${prismaClientSourcePath}`);
  }

  console.log('🎉 Prisma packaging complete!');
};

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    // Create directory if it doesn't exist
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    // Copy all files in directory
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    // Copy file
    fs.copyFileSync(src, dest);
  }
}
