"use strict";
// import express from 'express';
// import path from 'path';
// import compression from 'compression';
// import os from 'os';
// // import  createProxyMiddleware from 'http-proxy-middleware';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// // 环境变量类型声明
// declare global {
//   namespace NodeJS {
//     interface ProcessEnv {
//       NODE_ENV: 'development' | 'production';
//       PORT?: string;
//       HOST?: string;
//       PKG?: '1'; // pkg打包环境标记
//       API_BASE_URL?: string; // 可选API基础地址
//     }
//   }
// }
// const app = express();
// const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
// // 获取静态资源绝对路径（兼容开发和生产环境）
// function getStaticDir(): string {
//   const isPackaged = process.env.PKG === '1';
//   const baseDir = isPackaged ? path.dirname(process.execPath) : __dirname;
//   return path.join(baseDir, 'dist');
// }
// // 生产环境启用gzip压缩
// if (process.env.NODE_ENV === 'production') {
//   app.use(compression());
// }
// // 静态文件服务
// app.use(express.static(getStaticDir()));
// // API代理配置（可选）
// // if (process.env.API_BASE_URL) {
// //   app.use('/api', createProxyMiddleware({
// //     target: process.env.API_BASE_URL,
// //     changeOrigin: true,
// //     pathRewrite: { '^/api': '' },
// //   }));
// // }
// // 处理前端路由（支持Vue Router的history模式）
// app.get('*', (_, res) => {
//   res.sendFile(path.join(getStaticDir(), 'index.html'));
// });
// // 获取本机IP地址
// function getNetworkIp(): string {
//   const interfaces = os.networkInterfaces();
//   for (const interfaceName in interfaces) {
//     const iface = interfaces[interfaceName];
//     if (!iface) continue;
//     for (const alias of iface) {
//       if (
//         alias.family === 'IPv4' &&
//         alias.address !== '127.0.0.1' &&
//         !alias.internal
//       ) {
//         return alias.address;
//       }
//     }
//   }
//   return 'localhost';
// }
// // 启动服务器
// app.listen(PORT, () => {
//   const networkUrl = `http://${getNetworkIp()}:${PORT}`;
//   const localUrl = `http://localhost:${PORT}`;
//   console.log(`
//   🚀 应用已成功启动!
//   本地访问: ${localUrl}
//   网络访问: ${networkUrl}
//   环境: ${process.env.NODE_ENV || 'development'}
//   静态文件目录: ${getStaticDir()}
//   ${process.env.API_BASE_URL ? `API代理: ${process.env.API_BASE_URL}\n` : ''}
//   `);
// });
// // 错误处理
// process.on('uncaughtException', (err) => {
//   console.error('[未捕获异常]', err);
// });
// process.on('unhandledRejection', (reason, promise) => {
//   console.error('[未处理的Promise拒绝]', promise, '原因:', reason);
// });
// 使用纯 CommonJS 风格，避免任何 ESM 语法
const express = __importStar(require("express"));
const expressLib = require('express');
const path = require('path');
const fs = require('fs');
const app = expressLib();
const port = process.env.PORT || 3000;
// 修复 path-to-regexp 问题
process.env.DEBUG = ''; // 禁用调试信息
// 静态文件服务 - 添加错误处理
const staticDir = path.join(__dirname, '../dist');
app.use(express.static(staticDir, {
    dotfiles: 'ignore',
    index: false // 禁用自动发送 index.html
}));
// 自定义安全的路由处理
app.get('*', (req, res) => {
    const requestedPath = req.path;
    const filePath = path.join(staticDir, requestedPath);
    // 安全检查
    if (!filePath.startsWith(staticDir)) {
        return res.status(403).send('Forbidden');
    }
    // 检查文件是否存在
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // 文件不存在则返回主页面
            return res.sendFile(path.join(staticDir, 'index.html'));
        }
        // 文件存在则直接发送
        res.sendFile(filePath);
    });
});
// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).send('Internal Server Error');
});
app.listen(port, () => {
    console.log(`
  Server started successfully!
  Local:  http://localhost:${port}
  Static files: ${staticDir}
  `);
});
