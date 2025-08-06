import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import 'ant-design-vue/dist/reset.css';

// 正确用法：先创建应用实例，再挂载插件
const app = createApp(App)

app.use(router)      // 注册路由
app.use(createPinia()) // 注册 Pinia

app.mount('#app')    // 最后挂载
