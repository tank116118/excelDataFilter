<template>
  <a-layout class="app-layout">
    <!-- 固定头部 - 单行工具栏 -->
    <a-layout-header class="app-header">
      <div class="header-container">
        <Toolbar />
      </div>
    </a-layout-header>

    <!-- 可滚动内容区 -->
    <a-layout class="content-layout">
      <a-layout-content class="main-content">
        <router-view v-slot="{ Component }">
          <component :is="Component" :key="$route.fullPath" />
        </router-view>
      </a-layout-content>
      
      <!-- 固定页脚 -->
      <a-layout-footer class="app-footer">
        <div class="footer-container">
          <div class="copyright">©2025 版权所有</div>
          <div class="links">
            <a>帮助</a>
            <a-divider type="vertical" />
            <a>隐私</a>
            <a-divider type="vertical" />
            <a>条款</a>
          </div>
        </div>
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import Toolbar from './Toolbar.vue'

</script>

<style lang="less">
/* 全局重置 */
body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
html {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#app {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}

/* 主布局 */
.app-layout {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  
  /* 固定头部 - 单行工具栏 */
  .app-header {
    height: 56px;
    background: #fff;
    padding: 0;
    flex-shrink: 0;
    z-index: 1;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    border-bottom: 1px solid #f0f0f0;
    
    .header-container {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      max-width: 100%;
      margin: 0 auto;
      padding: 0 24px;
    }
  }
  
  /* 内容区布局 */
  .content-layout {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    
    /* 可滚动主内容区 */
    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      background: #fff;
    }
    
    /* 固定页脚 */
    .app-footer {
      flex-shrink: 0;
      padding: 16px 24px;
      background: #f0f2f5;
      
      .footer-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 100%;
        margin: 0 auto;
        
        .links a {
          color: rgba(0, 0, 0, 0.45);
          
          &:hover {
            color: rgba(0, 0, 0, 0.85);
          }
        }
      }
    }
  }
}
</style>