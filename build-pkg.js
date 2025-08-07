const { execSync } = require('child_process');

// 1. 构建前端
execSync('npm run build', { stdio: 'inherit' });

// 2. 构建服务端
execSync('npm run build:server', { stdio: 'inherit' });

// 3. 使用 pkg 打包
execSync('npx pkg dist-server/index.js --target node16-win-x64 --output server-app', { 
  stdio: 'inherit',
  env: {
    ...process.env,
    PKG_ESBUILD: 'true'  // 启用 esbuild 转换
  }
});