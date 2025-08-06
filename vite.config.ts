import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [
        AntDesignVueResolver({
          importStyle: 'less', // 使用 less 而不是 css
          resolveIcons: true, // 如果需要图标
        }),
      ],
      dts: true,
      // 添加以下配置避免生成禁用注释
      directives: true,
      include: [/\.vue$/, /\.vue\?vue/],
      exclude: [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/],
    }),
  ],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  server: {
    // 热更新相关配置
    hmr: {
      overlay: true, // 显示错误覆盖层
      protocol: 'ws', // 使用 WebSocket 协议
      host: 'localhost',
      port: 5173, // 默认与 dev server 相同
    },
    // 文件系统监听选项
    watch: {
      usePolling: true, // 在某些 Docker/WSL2 环境下需要
      interval: 100 // 轮询间隔(ms)
    }
  }
})